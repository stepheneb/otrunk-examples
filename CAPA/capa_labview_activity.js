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
importClass(Packages.java.text.SimpleDateFormat)
importClass(Packages.java.awt.Color)
importClass(Packages.java.awt.event.ActionListener)
importClass(Packages.javax.swing.JOptionPane)
importClass(Packages.java.math.RoundingMode)

importClass(Packages.org.concord.otrunk.ui.OTText)
importClass(Packages.org.concord.otrunk.ui.swing.OTCardContainerView)
importClass(Packages.org.concord.otrunkcapa.rubric.OTAssessment)
importClass(Packages.org.concord.otrunk.labview.LabviewMonitor)
importClass(Packages.org.concord.otrunk.labview.LabviewReportConverter)
importClass(Packages.org.concord.otrunk.labview.ScopeAssessmentUtil)


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

var _monitor = null
var _assessUtil = null
 
var _otAssessment = null
var _info // text to be added to the report

var	_dateFormat = SimpleDateFormat.getInstance()

var _currentStep = 1
var _lastStep = 1

var _correctAmp = 0.0
var _submittedAmp = 0.0
var _submittedAmpUnit = ""

var _correctFrq = 0.0
var _submittedFrq = 0.0
var _submittedFrqUnit = "" 

/**
 * This function is called when the script starts up
 * It returns a boolean indicating whether the initialization 
 * was successful or not.
 */

function init() {
	System.out.println("-------------------------- init --------------------------------")
	
	_dateFormat.applyPattern("MM/dd/yyyy HH:mm:ss zzz")
	
    _monitor = controllerService.getRealObject(otMonitor)	

	setupGUI()
	
	//reportHeader()	
	setupAssessmentLogging()
	initLogging()
	
	submitAnswerButton.addActionListener(submitAnswerButtonListener)
	
	OTCardContainerView.setCurrentCard(otInfoAreaCards, "intro_text")
	startStep(_currentStep)
	return true
}

function save() {
	System.out.println("-------------------------- save --------------------------------")	
	submitAnswerButton.removeActionListener(submitAnswerButtonListener)
	return true
}

function reportHeader() {
	var header = otObjectService.createObject(OTText)
	var now = _dateFormat.format(new Date())
	header.setText("CAPA - LabVIEW Oscilloscope (" + now + ")")
	otContents.add(header)
}

function initLogging() {
	_info = otObjectService.createObject(OTText)
	_info.setText("")
	otContents.add(_info)
}

function log(msg) {
	_info.setText(_info.getText() + msg + "\n")
}

function setupGUI() {
	answerBoxAmp.setBackground(new Color(1,1,0.7))
	answerBoxFrq.setBackground(new Color(1,1,0.7))	
	unitComboBoxAmp.setBackground(new Color(1,1,0.7))
	unitComboBoxFrq.setBackground(new Color(1,1,0.7))
	
	reportButton.setVisible(false)
}

function setupAssessmentLogging() {
	// Create assessment object
	_otAssessment = otObjectService.createObject(OTAssessment)
	_otAssessment.setTitle("Using an Oscilloscope - Student Report")
	otContents.add(_otAssessment)
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


/**
 * Check if the submitted answers are valid values for assessment
 */
function validateAnswers() {
	var ampText = answerBoxAmp.getText()
	var frqText= answerBoxFrq.getText()
	
	_submittedAmpUnit = otUnitChoiceAmp.getCurrentChoice() 
    _submittedFrqUnit = otUnitChoiceFrq.getCurrentChoice()
    
	System.out.println("_submittedAmp = [" + _submittedAmp + "]")

	if (_submittedAmpUnit == null || _submittedAmpUnit.getAbbreviation() == "") {
		JOptionPane.showMessageDialog(null, "Set the unit for amplitude and try again.")
		return false
	}
	if (_submittedFrqUnit == null || _submittedFrqUnit.getAbbreviation() == "") {
		JOptionPane.showMessageDialog(null, "Set the unit for frequency and try again.")
		return false
	}
	try {
		_submittedAmp = Double.parseDouble(ampText)
	}
	catch (e) {
		JOptionPane.showMessageDialog(null, "Invalid amplitude value [" + ampText + "].\n" + "Please try again.")
		return false
	}
	try {
		_submittedFrq = Double.parseDouble(frqText)
	}
	catch (e) {
		JOptionPane.showMessageDialog(null, "Invalid frequency value [" + frqText + "].\n" + "Please try again.")
		return false
	}
	return true	
}

/**
 * Create rubric from the OTModelActivityData object by populating the OTAssessment object
 * This must happen AFTER the LabVIEW has exited, and AFTER validateAnswers().
 */
function assess() {
	var converter = new LabviewReportConverter(_monitor)
	converter.markEndTime()
	var madwrapper = converter.getMADWrapper()
	_assessUtil = new ScopeAssessmentUtil(madwrapper)
	
	System.out.println("madwrapper=" + madwrapper)

	_correctAmp = 2 * Double.parseDouble(madwrapper.getLastCIValue("amplitude")) //peak-to-peak amplitude
	_correctFrq = Double.parseDouble(madwrapper.getLastCIValue("frequency"))
	
	var ampUnit = _submittedAmpUnit.getAbbreviation()
	var frqUnit = _submittedFrqUnit.getAbbreviation()
	
	var etime = _dateFormat.format(new Date())
	log(etime + " - Solution is: amplitude=" + ScopeAssessmentUtil.getAmplitudeString(_correctAmp) + ", frequency = " + ScopeAssessmentUtil.getFrequencyString(_correctFrq))
	
	var numChanges = madwrapper.getNumChanges()
	
    log(etime + " - Answer submitted: amplitude = " + _submittedAmp + " " + ampUnit)
  	log(etime + " - Answer submitted: frequency = " + _submittedFrq + " " + frqUnit)
    
	var ampIndicator = checkAmplitude(_correctAmp, _submittedAmp, ampUnit)
	var frqIndicator = checkFrequency(_correctFrq, _submittedFrq, frqUnit)
	var ampUnitIndicator = checkAmpUnit(ampUnit)
	var frqUnitIndicator = checkFrqUnit(frqUnit)
	
	System.out.println("ampUnit=" + ampUnit + " ind=" + ampIndicator)
	System.out.println("ampIndicator=" + ampIndicator)
	System.out.println("frqIndicator=" + frqIndicator)	
	
	var timeTotal = madwrapper.getTimeTotal()
	
	var settingsIndicator = checkSettings(madwrapper)
	
	_otAssessment.setLabel("Oscilloscope")
	var indicators = _otAssessment.getIndicatorValues()
	indicators.put("amplitudeValue", ampIndicator)
	indicators.put("frequencyValue", frqIndicator)
	indicators.put("amplitudeUnit", ampUnitIndicator)
	indicators.put("frequencyUnit", frqUnitIndicator)
	indicators.put("numChanges", numChanges)
	indicators.put("timeTotal", timeTotal)
	indicators.put("controlSetting", settingsIndicator)
	
	System.out.println("numChanges=" + numChanges)
	System.out.println("timeTotal=" + timeTotal)
	
	++_currentStep
	
	System.out.println("step=" + _currentStep)
	if (_currentStep <= _lastStep){
		startStep(_currentStep)
	}
	else {
		endActivity()
	}

	log("----------")
	_info.setText(_info.getText() + _assessUtil.getChangeLog())
}

function getDiff(a, b) {
	return Math.abs(a - b) / b	
}

function checkAmplitude(correctValue, answer, unit) {
	var answerValue = 0.0

	answerValue = Double.parseDouble(answer)

	if (unit == "mV") {
		answerValue *= 0.001		
		
	}
	else if (unit == "kV") {
		answerValue *= 1000
	}
	else if (unit != "V") {
		return 0 // totally wrong
	}
	
	var diff = getDiff(answerValue, correctValue)
	
	if (diff < 0.05) {
		return 4  //perfect
	}
	else if (diff < 0.1 ) {
		return 3  //close
	}

	// NOw check for possiblities of mistaken units
	diff = getDiff(answerValue, correctValue * 1000)
	if (diff < 0.05) {
		return 2
	} 
	else if (diff < 0.1) {
		return 1
	}
	diff = getDiff(answerValue, correctValue * 0.001)
	if (diff < 0.05) {
		return 2
	} 	
	else if (diff < 0.1) {
		return 1
	}
	return 0
}

function checkFrequency(correctValue, answer, unit) {
	var answerValue = 0.0

	System.out.println("checkFrequency: unit = [" + unit + "]")

	answerValue = Double.parseDouble(answer) 
	
	if (unit == "kHz") {
		answerValue *= 1000		
		
	}
	else if (unit == "MHz") {
		answerValue *= 1.0e6
	}
	else if (unit != "Hz") {
		return 0 // totally wrong
	}
	
	var diff =  getDiff(answerValue, correctValue)
	
	if (diff < 0.05) {
		return 4  //perfect
	}
	else if (diff < 0.1 ) {
		return 3  //close
	}

	// NOw check for possiblities of mistaken units
	diff = getDiff(answerValue, correctValue * 1000)
	if (diff < 0.05) {
		return 2
	} 
	else if (diff < 0.1) {
		return 1
	}
	diff = getDiff(answerValue, correctValue * 1.0e6)
	if (diff < 0.05) {
		return 2
	} 	
	else if (diff < 0.1) {
		return 1
	}
	return 0
}

function checkAmpUnit(unit) {
	a = ["mV", "V", "kV"] 
	for (i in a) {
		if (a[i] == unit) {
			return 1
		} 
	}
	return 0
}

function checkFrqUnit(unit) {
	a = ["Hz", "kHz", "MHz"] 
	for (i in a) {
		if (a[i] == unit) {
			return 1
		} 
	}
	return 0
}

// @return 0:excellent, 1: good, 2: ok, 3: bad 
function checkSettings(madWrapper) {
	var viewWidth = _assessUtil.getLastTimePerDiv() * 10
	var waveLength = 1.0 / _correctFrq
	var timePerDivPoints = 0
	var voltsPerDivPoints = 0

	if (ScopeAssessmentUtil.optimalTimePerDivPossible(waveLength)) {
		if (viewWidth < 0.5 * waveLength) {
			timePerDivPoints = 0
		}
		else if (viewWidth < waveLength) {
			timePerDivPoints = 1 	
		}
		else if (viewWidth < 2 * waveLength) {
			timePerDivPoints = 2
		}
		else if (viewWidth < 3 * waveLength) {
			timePerDivPoints = 1
		}
		else {
			timePerDivPoints = 0
		}
	}
	else {
		if (viewWidth < 0.5 * waveLength) {
			timePerDivPoints = 0
		}
		else if (viewWidth < 3 * waveLength) {
			timePerDivPoints = 2
		}
		else {
			timePerDivPoints = 0
		}
	}
	
	var viewHeight = _assessUtil.getLastVoltsPerDiv() * 8
	var voltsPerDivPoints = _assessUtil.getVoltsPerDivPoints(_correctAmp)

	// Check for channel selection
	var channel = Integer.parseInt(madWrapper.getLastCIValue("SelectChannel"));
	System.out.println("channel=" + channel);
	if (channel == 2) {
		return 0 // bad: channel A has no signal 
	}
	
	if (timePerDivPoints == 2 && voltsPerDivPoints == 2) {
		return 3
	}
	else if ((timePerDivPoints == 2 && voltsPerDivPoints == 1) || (timePerDivPoints == 1 && voltsPerDivPoints == 2)) {
		return 2
	}
	else if (timePerDivPoints == 1 && voltsPerDivPoints == 1) {
		return 1
	}
	else {
		return 0
	}
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
	OTCardContainerView.setCurrentCard(otInstAreaCards, "solution_text")
	
	reportButton.setVisible(true)
}

var submitAnswerButtonHandler = {
	actionPerformed: function(evt) {
		var state = _monitor.getState()
		var msg = ""
		var prop = System.getProperty("otrunk.capa.labview.no_labview")
		var noLabview = (prop == "true")

		System.out.println("Entered: submitAnswerButtonHandler" + prop)
		
		if (state == LabviewMonitor.RUNNING || noLabview) {
		    System.out.println("State: running")
		    if (validateAnswers() == false) {
		    	return
		    }
			msg = "This will end your activity and close the LabVIEW window. Do you want to continue?"
			var option = JOptionPane.showConfirmDialog(null, msg, "Submitting Answer", JOptionPane.OK_CANCEL_OPTION)
			
			if (option == JOptionPane.OK_OPTION) {
		    	System.out.println("option == OK")
		  		_monitor.close()
		    	assess() // must close labVIEW before assess()
			}
		}
		else if (state == LabviewMonitor.READY) {
		    System.out.println("State: ready")
			msg = "The activity hasn't started yet.\n You need to launch LabVIEW first"
			JOptionPane.showMessageDialog(null, msg)
			return
		}
		else {
			System.out.println("submitButtonHandler: this place shouldn't be reached")
			return
		}
	}
}

var submitAnswerButtonListener = new ActionListener(submitAnswerButtonHandler)
