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
importClass(Packages.java.awt.Color)
importClass(Packages.java.awt.event.ActionListener)
importClass(Packages.javax.swing.JOptionPane)

importClass(Packages.org.concord.otrunk.ui.swing.OTCardContainerView)
importClass(Packages.org.concord.otrunk.labview.LabviewReportConverter)
importClass(Packages.org.concord.otrunkcapa.rubric.OTAssessment)


/*
 * Variables from otml
 * ===================
 * otMonitor
 * otInstAreaCards
 * otAnswerBoxAmp
 * otAnswerBoxFrq
 * otUnitChoiceAmp
 * otUnitComboBoxAmp
 * otUnitChoiceFrq
 * otUnitComboBoxFrq 
 * otEmptyUnitChoice
 * submitAnswerButton
 * reportButton
 */
 
/*
 * 
 */
var g_otAssessment
var g_timeStepStarted = 0

var g_unitIndicator = 0 // 0: wrong answer, 1: correct answer but suboptimal unit, 2: correct unit

/**
 * This function is called when the script starts up
 * It returns a boolean indicating whether the initialization 
 * was successful or not.
 */
function init() {
	System.out.println("-------------------------- init --------------------------------")
	setupGUI()
	setupAsessmentLogging()
	submitAnswerButton.addActionListener(submitAnswerButtonListener)
	return true
}

function save() {
	submitAnswerButton.removeActionListener(submitAnswerButtonListener)
	return true
}

function setupGUI() {
	/* 
	otAnswerBoxAmp.setBackground(new Color(1,1,0.7))
	otAnswerBoxFrq.setBackground(new Color(1,1,0.7))	
	otUnitComboBoxAmp.setBackground(new Color(1,1,0.7))
	otUnitComboBoxFrq.setBackground(new Color(1,1,0.7))* 
	*/	
}

function setupAsessmentLogging() {
	// Create assessment object
	g_otAssessment = otObjectService.createObject(OTAssessment)
	otContents.add(g_otAssessment)
}

function initStep() {
	g_timeStepStarted = System.currentTimeMillis()
}

function startStep(step) {
	initStep()
	
	//Show instructions for the current step
	var strCardID = "step" + step + "_text"
	OTCardContainerView.setCurrentCard(otInstAreaCards, strCardID)
	
	otAnswerBoxAmp.setText("")
	otAnswerBoxFrq.setText("")	
	otUnitChoiceAmp.setCurrentChoice(otEmptyUnitChoice)
	otUnitChoiceFrq.setCurrentChoice(otEmptyUnitChoice)	
}

// Create rubric from the OTModelActivityData object by populating the OTAssessment object
function assess() {
	var converter = new LabviewReportConverter(otMonitor)
	converter.markEndTime()
	var madwrapper = converter.getMADWrapper()
	
	//converter.dumpMAD()

	var amplitude = Double.parseDouble(madwrapper.getInitialCIValue("amplitude"))
	System.out.println("amplitude=" + amplitude)
			
	var frequency = Double.parseDouble(madwrapper.getInitialCIValue("frequency"))
	System.out.println("frequency=" + frequency)
	
	var numChanges = madwrapper.getNumChanges()
	
	var ampAnswer = otAnswerBoxAmp.getText()
	var frqAnswer = otAnswerBoxFrq.getText()
	
	var ampUnitAnswer = otUnitChoiceAmp.getCurrentChoice() 
    var frqUnitAnswer = otUnitChoiceFrq.getCurrentChoice()
    
	var ampIndicator = checkAmplitude(amplitude, ampAnswer, ampUnitAnswer)
	var frqIndicator = checkFrequency(frequency, frqAnswer, frqUnitAnswer) 
	var timeTotal = madwrapper.getTimeTotal();
	
	g_otAssessment.getIndicatorValues().put("amplitudeCorrect", ampIndicator)
	g_otAssessment.getIndicatorValues().put("frequencyCorrect", frqIndicator)
	g_otAssessment.getIndicatorValues().put("numChanges", numChanges)
	g_otAssessment.getIndicatorValues().put("timeTotal", timeTotal)
	
	System.out.println("numChanges=" + numChanges)
	System.out.println("timeTotal=" + timeTotal)
}

function checkAmplitude(correctValue, answer, unitAnswer) {
	var unit = "";
	var answerValue = 0.0;

	if (unitAnswer == null) {
		return 1.0; // totally wrong
	}
	else {
		unit = unitAnswer.getAbbreviation();
	}
	System.out.println("unit=" + unit)
	
	if (answer == null) {
		return 1.0; // totally wrong
	}
	else {
		answerValue = Double.parseDouble(answer) 
	}
	
	if (unit == "mV") {
		answerValue *= 0.001		
		
	}
	else if (unit == "kV") {
		answerValue *= 1000
	}
	else if (unit != "V") {
		return 1.0; // totally wrong
	}
	
	System.out.println("amp answer=" + answerValue)
	
	var diff =  Math.abs(answerValue - correctValue) / correctValue
	
	System.out.println("diff=" + diff)
	return diff	
}

function checkFrequency(correctValue, answer, unitAnswer) {
	var unit = "";
	var answerValue = 0.0;

	if (unitAnswer == null) {
		return 1.0; // totally wrong
	}
	else {
		unit = unitAnswer.getAbbreviation();
	}
	System.out.println("unit=" + unit)
	
	if (answer == null) {
		return 1.0; // totally wrong
	}
	else {
		answerValue = Double.parseDouble(answer) 
	}
	
	if (unit == "kHz") {
		answerValue *= 1000		
		
	}
	else if (unit == "MHz") {
		answerValue *= 1.0e6
	}
	else if (unit != "Hz") {
		return 1.0; // totally wrong
	}
	
	System.out.println("frq answer=" + answerValue)
	
	var diff =  Math.abs(answerValue - correctValue) / correctValue
	
	System.out.println("diff=" + diff)
	return diff	
}

var submitAnswerButtonHandler = {
	actionPerformed: function(evt) {
		var monitor = controllerService.getRealObject(otMonitor)
		if (monitor.processIsRunning()) {
			JOptionPane.showMessageDialog(null, "Please close the LabVIEW session first and try SUBMIT again.")
			System.out.println("Process running. Try when finished")
			return
		}
		assess();
	}
};

var submitAnswerButtonListener = new ActionListener(submitAnswerButtonHandler)


