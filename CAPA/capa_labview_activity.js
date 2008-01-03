/*
 *  Copyright (C) 2007  The Concord Consortium, Inc.,
 *  10 Concord Crossing, Concord, MA 01742
 *
 *  Web Site: http://www.concord.org
 *  Email: info@concord.org
 *
 *  This library is free software; you can redistribute it and/or
 *  modify it under the terms of the GNU Lesser General Public
 *  License as published by the Free Software Foundation; either
 *  version 2.1 of the License, or (at your option) any later version.
 *
 *  This library is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *  Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public
 *  License along with this library; if not, write to the Free Software
 *  Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 *
 * END LICENSE */


importClass(Packages.java.lang.System)
importClass(Packages.java.lang.Integer)
importClass(Packages.java.lang.Double)
importClass(Packages.java.text.DecimalFormat)
importClass(Packages.java.text.SimpleDateFormat)
importClass(Packages.java.awt.Color)
importClass(Packages.java.awt.event.ActionListener)
importClass(Packages.javax.swing.JOptionPane)
importClass(Packages.java.math.RoundingMode)

importClass(Packages.org.concord.otrunk.ui.OTText)
importClass(Packages.org.concord.otrunk.ui.swing.OTCardContainerView)
importClass(Packages.org.concord.otrunk.labview.LabviewReportConverter)
importClass(Packages.org.concord.otrunkcapa.rubric.OTAssessment)


/*
 * Variables from otml
 * ===================
 * otMonitor
 * otInfoAreaCards
 * otInstAreaCards
 * submitAnswerButton
 * reportButton
 * answerBoxAmp
 * answerBoxFrq
 * otUnitChoiceAmp
 * otUnitChoiceFrq
 * unitComboBoxAmp
 * unitComboBoxFrq 
 * otEmptyUnitChoice
 * ampLabel
 * frqLabel
 * valueLabel
 * unitLabel
 * launchButton 
 */
 
var otAssessment
var info // text to be added to the report
var timeStepStarted = 0

var unitIndicator = 0 // 0: wrong answer, 1: correct answer but suboptimal unit, 2: correct unit

var numFormat = DecimalFormat.getInstance()
var	dateFormat = SimpleDateFormat.getInstance()

var currentStep = 1
var lastStep = 1
	

/**
 * This function is called when the script starts up
 * It returns a boolean indicating whether the initialization 
 * was successful or not.
 */
function init() {
	System.out.println("-------------------------- init --------------------------------")
	
	numFormat.applyPattern("####.##")
	dateFormat.applyPattern("MM/dd/yyyy HH:mm:ss zzz")
	
	initLogging()
	
	setupGUI()
	setupAsessmentLogging()
	submitAnswerButton.addActionListener(submitAnswerButtonListener)
	
	startStep(currentStep)
	return true
}

function save() {
	System.out.println("-------------------------- save --------------------------------")	
	submitAnswerButton.removeActionListener(submitAnswerButtonListener)
	return true
}

function initLogging() {
	info = otObjectService.createObject(OTText)
	info.setText("CAPA - LabVIEW Oscilloscope\n")
	otContents.add(info)
}

function log(msg) {
	info.setText(info.getText() + msg + "\n")
}

function setupGUI() {
	answerBoxAmp.setBackground(new Color(1,1,0.7))
	answerBoxFrq.setBackground(new Color(1,1,0.7))	
	unitComboBoxAmp.setBackground(new Color(1,1,0.7))
	unitComboBoxFrq.setBackground(new Color(1,1,0.7))
	
	reportButton.setVisible(false)
}

function setupAsessmentLogging() {
	// Create assessment object
	otAssessment = otObjectService.createObject(OTAssessment)
	otContents.add(otAssessment)
}

function startStep(step) {
	//Show instructions for the current step
	var strCardID = "step" + step + "_text"
	OTCardContainerView.setCurrentCard(otInstAreaCards, strCardID)
	
	answerBoxAmp.setText("")
	answerBoxFrq.setText("")	
	otUnitChoiceAmp.setCurrentChoice(otEmptyUnitChoice)
	otUnitChoiceFrq.setCurrentChoice(otEmptyUnitChoice)	
}

// Create rubric from the OTModelActivityData object by populating the OTAssessment object
function assess() {
	var converter = new LabviewReportConverter(otMonitor)
	converter.markEndTime()
	var madwrapper = converter.getMADWrapper()
	
	System.out.println("fm: " + dateFormat.getNumberFormat().toPattern())
	
	var stime = dateFormat.format(new Date(madwrapper.getStartTime())) 
	log(stime + " - Activity started")
	var etime = dateFormat.format(new Date())

	var amplitude = Double.parseDouble(madwrapper.getInitialCIValue("amplitude"))
	var frequency = Double.parseDouble(madwrapper.getInitialCIValue("frequency"))
	log(stime + " - Solution is: amplitude=" + getAmpSolutionText(amplitude) + ", frequency = " + getFrqSolutionText(frequency))
	
	var numChanges = madwrapper.getNumChanges()
	
	var ampAnswer = answerBoxAmp.getText()
	var frqAnswer = answerBoxFrq.getText()
	
	var ampUnitAnswer = otUnitChoiceAmp.getCurrentChoice() 
    var frqUnitAnswer = otUnitChoiceFrq.getCurrentChoice()
    
    log(etime + " - Answer submitted: amplitude = " + ampAnswer + " " + ampUnitAnswer.getAbbreviation())
  	log(etime + " - Answer submitted: frequency = " + frqAnswer + " " + frqUnitAnswer.getAbbreviation())
    
    var ampIndicator = 0.0
    var frqIndicator = 0.0
    
    try {
		ampIndicator = checkAmplitude(amplitude, ampAnswer, ampUnitAnswer)
		frqIndicator = checkFrequency(frequency, frqAnswer, frqUnitAnswer)
    }
    catch (e) {
    	return
    }
	
	var timeTotal = madwrapper.getTimeTotal()
	
	otAssessment.setLabel("Oscilloscope")
	otAssessment.getIndicatorValues().put("amplitudeCorrect", ampIndicator)
	otAssessment.getIndicatorValues().put("frequencyCorrect", frqIndicator)
	otAssessment.getIndicatorValues().put("numChanges", numChanges)
	otAssessment.getIndicatorValues().put("timeTotal", timeTotal)
	
	System.out.println("numChanges=" + numChanges)
	System.out.println("timeTotal=" + timeTotal)
	
	++currentStep
	
	System.out.println("step=" + currentStep)
	if (currentStep <= lastStep){
		startStep(currentStep)
	}
	else {
		endActivity()
	}
}

function getAmpSolutionText(amplitude) {
	if (amplitude >= 1000.0) {
		return numFormat.format(amplitude / 1000.0) + " kV"
	}
	else if (amplitude < 0.0) {
		return numFormat.format(amplitude * 1000.0) + " mV"
	}
	else {
		return numFormat.format(amplitude) + " V"
	}
}

function getFrqSolutionText(frequency) {
	if (frequency >= 1.0e6) {
		return numFormat.format(frequency / 1.0e6) + " MHz"
	}
	else if (frequency >= 1000.0) {
		return numFormat.format(frequency / 1000.0) + " kHz"
	}
	else {
		return numFormat.format(frequency) + " Hz"
	}
}

function checkAmplitude(correctValue, answer, unitAnswer) {
	var unit = ""
	var answerValue = 0.0
	
	System.out.println("answer text = [" + answer + "]")

	System.out.println(unitAnswer.getAbbreviation())
	if (unitAnswer == null) {
		JOptionPane.showMessageDialog(null, "Set the unit for amplitude and try again.")
		throw new RuntimeException()
	}
	else {
		unit = unitAnswer.getAbbreviation()
	}
	System.out.println("unit=" + unit)
	
	try {
		answerValue = Double.parseDouble(answer)
	}
	catch (e) {
		JOptionPane.showMessageDialog(null, "Invalid amplitude value [" + answer + "].\n" + "Please try again.")
		throw e
	}
	if (answer == null) {
		System.out.println("amp=null")
		return 1.0 // totally wrong
	}
	else {
		try {
		    answerValue = Double.parseDouble(answer)
		}
		catch (e) {
			System.out.println("ans exc")
		}
	}
	
	if (unit == "mV") {
		answerValue *= 0.001		
		
	}
	else if (unit == "kV") {
		answerValue *= 1000
	}
	else if (unit != "V") {
		return 1.0 // totally wrong
	}
	
	System.out.println("amp answer=" + answerValue)
	
	var diff =  Math.abs(answerValue - correctValue) / correctValue
	
	System.out.println("diff=" + diff)
	return diff	
}

function checkFrequency(correctValue, answer, unitAnswer) {
	var unit = ""
	var answerValue = 0.0

	if (unitAnswer == null) {
		JOptionPane.showMessageDialog(null, "Set the unit for frequency and try again.")
		throw new RuntimeException()
	}
	else {
		unit = unitAnswer.getAbbreviation()
	}
	System.out.println("unit=" + unit)

	try {	
		answerValue = Double.parseDouble(answer) 
	}
	catch (e) {
		JOptionPane.showMessageDialog(null, "Invalid frequency value [" + answer + "].\n" + "Please try again.")
		throw e
	}
	
	if (unit == "kHz") {
		answerValue *= 1000		
		
	}
	else if (unit == "MHz") {
		answerValue *= 1.0e6
	}
	else if (unit != "Hz") {
		return 1.0 // totally wrong
	}
	
	System.out.println("frq answer=" + answerValue)
	
	var diff =  Math.abs(answerValue - correctValue) / correctValue
	
	System.out.println("diff=" + diff)
	return diff	
}

function endActivity()
{
	submitAnswerButton.setVisible(false)
	answerBoxAmp.setVisible(false)
	answerBoxFrq.setVisible(false)
	unitComboBoxAmp.setVisible(false)
	unitComboBoxFrq.setVisible(false)
	ampLabel.setVisible(false)
	frqLabel.setVisible(false)
	valueLabel.setVisible(false)
	unitLabel.setVisible(false)
	launchButton.setVisible(false)
	OTCardContainerView.setCurrentCard(otInfoAreaCards, "end_text")
	
	reportButton.setVisible(true)
}

var submitAnswerButtonHandler = {
	actionPerformed: function(evt) {
		var monitor = controllerService.getRealObject(otMonitor)
		
		if (monitor.processIsRunning()) {
			JOptionPane.showMessageDialog(null, "Please close the LabVIEW session first and try SUBMIT again.")
			System.out.println("Process running. Try when finished")
			return
		}
		assess()
	}
}

var submitAnswerButtonListener = new ActionListener(submitAnswerButtonHandler)


