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
 * answerBoxCarrierAmp
 * answerBoxCarrierFrq
 * answerBoxModFrq
 * otUnitChoiceCarrierAmp
 * otUnitChoiceCarrierFrq
 * otUnitChoiceModFrq
 * unitComboBoxCarrierAmp
 * unitComboBoxCarrierFrq 
 * unitComboBoxModFrq
 * otEmptyUnitChoice
 * carrierAmpLabel
 * carrierFrqLabel
 * modAmpLabel
 * modFrqLabel
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

var _correctCarrierAmp = 0.0
var _submittedCarrierAmp = 0.0
var _submittedCarrierAmpUnit = ""

var _correctCarrierFrq = 0.0
var _correctModFrq = 0.0
var _submittedCarrierFrq = 0.0
var _submittedModFrq = 0.0
var _submittedCarrierFrqUnit = "" 
var _submittedModFrqUnit = "" 

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
	answerBoxCarrierAmp.setBackground(new Color(1,1,0.7))
	answerBoxCarrierFrq.setBackground(new Color(1,1,0.7))	
	answerBoxModAmp.setBackground(new Color(1,1,0.7))			
	answerBoxModFrq.setBackground(new Color(1,1,0.7))		
	unitComboBoxCarrierAmp.setBackground(new Color(1,1,0.7))
	unitComboBoxCarrierFrq.setBackground(new Color(1,1,0.7))
	unitComboBoxModAmp.setBackground(new Color(1,1,0.7))		
	unitComboBoxModFrq.setBackground(new Color(1,1,0.7))	
	
	reportButton.setVisible(false)
}

function setupAssessmentLogging() {
	// Create assessment object
	_otAssessment = otObjectService.createObject(OTAssessment)
	_otAssessment.setTitle("Amplitude Modulation - Student Report")
	otContents.add(_otAssessment)
}

function startStep(step) {
	//Show instructions for the current step
	var strCardID = "step" + step + "_text"
	OTCardContainerView.setCurrentCard(otInstAreaCards, strCardID)
	
	answerBoxCarrierAmp.setText("")
	answerBoxCarrierFrq.setText("")	
	otUnitChoiceCarrierAmp.setCurrentChoice(otEmptyUnitChoice)
	otUnitChoiceCarrierFrq.setCurrentChoice(otEmptyUnitChoice)	
}


/**
 * Check if the submitted answers are valid values for assessment
 */
function validateAnswers() {
	var carrierAmpText = answerBoxCarrierAmp.getText()
	var carrierFrqText= answerBoxCarrierFrq.getText()
	var modAmpText = answerBoxModAmp.getText()
	var modFrqText= answerBoxModFrq.getText()	
	
	_submittedCarrierAmpUnit = otUnitChoiceCarrierAmp.getCurrentChoice() 
    _submittedCarrierFrqUnit = otUnitChoiceCarrierFrq.getCurrentChoice()
	_submittedModAmpUnit = otUnitChoiceModAmp.getCurrentChoice()     
    _submittedModFrqUnit = otUnitChoiceModFrq.getCurrentChoice()    
    
	if (_submittedCarrierAmpUnit == null || _submittedCarrierAmpUnit.getAbbreviation() == "") {
		JOptionPane.showMessageDialog(null, "Set the unit for carrier amplitude and try again.")
		return false
	}
	if (_submittedCarrierFrqUnit == null || _submittedCarrierFrqUnit.getAbbreviation() == "") {
		JOptionPane.showMessageDialog(null, "Set the unit for carrier <quency and try again.")
		return false
	}
	if (_submittedModAmpUnit == null || _submittedModAmpUnit.getAbbreviation() == "") {
		JOptionPane.showMessageDialog(null, "Set the unit for modulator amplitude and try again.")
		return false
	}
	if (_submittedModFrqUnit == null || _submittedModFrqUnit.getAbbreviation() == "") {
		JOptionPane.showMessageDialog(null, "Set the unit for modulator frequency and try again.")
		return false
	}
	try {
		_submittedCarrierAmp = Double.parseDouble(carrierAmpText)
	}
	catch (e) {
		JOptionPane.showMessageDialog(null, "Invalid carrier amplitude value [" + carrierAmpText + "].\n" + "Please try again.")
		return false
	}
	try {
		_submittedCarrierFrq = Double.parseDouble(carrierFrqText)
	}
	catch (e) {
		JOptionPane.showMessageDialog(null, "Invalid carrier frequency value [" + carrierFrqText + "].\n" + "Please try again.")
		return false
	}
	try {
		_submittedModAmp = Double.parseDouble(modAmpText)
	}
	catch (e) {
		JOptionPane.showMessageDialog(null, "Invalid modulator amplitude value [" + modAmpText + "].\n" + "Please try again.")
		return false
	}
	try {
		_submittedModFrq = Double.parseDouble(modFrqText)
	}
	catch (e) {
		JOptionPane.showMessageDialog(null, "Invalid modulator frequency value [" + modFrqText + "].\n" + "Please try again.")
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
	
	_correctCarrierAmp = 2.0 * Double.parseDouble(madwrapper.getLastCIValue("amplitude2")) //peak-to-peak amplitude
	_correctCarrierFrq = Double.parseDouble(madwrapper.getLastCIValue("frequency2"))
	_correctModAmp = 2.0 * Double.parseDouble(madwrapper.getLastCIValue("amplitude")) //peak-to-peak amplitude	
	_correctModFrq = Double.parseDouble(madwrapper.getLastCIValue("frequency"))
	
	var carrierAmpUnit = _submittedCarrierAmpUnit.getAbbreviation()
	var carrierFrqUnit = _submittedCarrierFrqUnit.getAbbreviation()
	var modAmpUnit = _submittedModAmpUnit.getAbbreviation()
	var modFrqUnit = _submittedModFrqUnit.getAbbreviation()	
	
	var etime = _dateFormat.format(new Date())
	log("----------")
	log(etime + " - Correct carrier amplitude = " + ScopeAssessmentUtil.getAmplitudeString(_correctCarrierAmp))
	log(etime + " - Correct carrier frequency = " + ScopeAssessmentUtil.getFrequencyString(_correctCarrierFrq))
	log(etime + " - Correct modulator amplitude = " + ScopeAssessmentUtil.getAmplitudeString(_correctModAmp))	
	log(etime + " - Correct modulator frequency = " + ScopeAssessmentUtil.getFrequencyString(_correctModFrq))

	var numChanges = madwrapper.getNumChanges()

    log(etime + " - Answer submitted: carrier amplitude = " + _submittedCarrierAmp + " " + carrierAmpUnit)
  	log(etime + " - Answer submitted: carrier frequency = " + _submittedCarrierFrq + " " + carrierFrqUnit)
  	log(etime + " - Answer submitted: modulator amplitude = " + _submittedModAmp + " " + modAmpUnit)
  	log(etime + " - Answer submitted: modulator frequency = " + _submittedModFrq + " " + modFrqUnit)
    
	var carrierAmpIndicator = checkAmplitude(_correctCarrierAmp, _submittedCarrierAmp, carrierAmpUnit)
	var carrierFrqIndicator = checkFrequency(_correctCarrierFrq, _submittedCarrierFrq, carrierFrqUnit)
	var modAmpIndicator = checkAmplitude(_correctModAmp, _submittedModAmp, modAmpUnit)	
	var modFrqIndicator = checkFrequency(_correctModFrq, _submittedModFrq, modFrqUnit)
	
	var carrierAmpUnitIndicator = checkAmpUnit(carrierAmpUnit)
	var carrierFrqUnitIndicator = checkFrqUnit(carrierFrqUnit)
	var modAmpUnitIndicator = checkAmpUnit(carrierAmpUnit)
	var modFrqUnitIndicator = checkFrqUnit(carrierFrqUnit)

	var timeTotal = madwrapper.getTimeTotal()
	var tpdIndicator = checkSettings(madwrapper)
	
	_otAssessment.setLabel("Oscilloscope")
	var indicators = _otAssessment.getIndicatorValues()
	indicators.put("carrierAmplitudeValue", carrierAmpIndicator)
	indicators.put("carrierAmplitudeUnit", carrierAmpUnitIndicator)
	indicators.put("carrierFrequencyValue", carrierFrqIndicator)
	indicators.put("carrierFrequencyUnit", carrierFrqUnitIndicator)	
	indicators.put("modAmplitudeValue", modAmpIndicator)	
	indicators.put("modAmplitudeUnit", modAmpUnitIndicator)		
	indicators.put("modFrequencyValue", modFrqIndicator)
	indicators.put("modFrequencyUnit", modFrqUnitIndicator)			
	indicators.put("numChanges", numChanges)
	indicators.put("timeTotal", timeTotal)
	indicators.put("controlSetting", tpdIndicator)
	
	++_currentStep
	
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

function checkSettings(madWrapper) {
	var timePerDivPoints = 0
	var voltsPerDivPoints = 0
	
	var timePerDivs = _assessUtil.getTimePerDivs()
	var voltsPerDivs = _assessUtil.getVoltsPerDivs()
	
	for (var i = 0; i < timePerDivs.size(); ++i) {
		System.out.println(timePerDivs.get(i))
		var pts = checkTimePerDiv(timePerDivs.get(i), _correctCarrierFrq)
		if (pts > timePerDivPoints) {
			timePerDivPoints = pts
			System.out.println("tpd pts=" + pts)
		}		
		pts = checkTimePerDiv(timePerDivs.get(i), _correctModFrq)
		if (pts > timePerDivPoints) {
			timePerDivPoints = pts
			System.out.println("tpd pts=" + pts)			
		}		
	}
	for (var i = 0; i < voltsPerDivs.size(); ++i) {
		System.out.println(voltsPerDivs.get(i))
		var pts = _assessUtil.getVoltsPerDivPoints(_correctCarrierAmp)
		if (pts > voltsPerDivPoints) {
			voltsPerDivPoints = pts
		}
		pts = _assessUtil.getVoltsPerDivPoints(_correctModAmp)		 
		if (pts > voltsPerDivPoints) {
			voltsPerDivPoints = pts
			System.out.println("vpd pts=" + pts)			
		}
	}
	
	// Check for channel selection
	var channel = Integer.parseInt(madWrapper.getLastCIValue("SelectChannel"));
	
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

function checkTimePerDiv(tpd, correctFrq) {
	var viewWidth = tpd * 10
	var waveLength = 1.0 / correctFrq
	
	if (ScopeAssessmentUtil.optimalTimePerDivPossible(waveLength)) {
		if (viewWidth < 0.5 * waveLength) {
			return 0
		}
		else if (viewWidth < waveLength) {
			return 1 	
		}
		else if (viewWidth < 2 * waveLength) {
			return 2
		}
		else if (viewWidth < 3 * waveLength) {
			return 1
		}
		else {
			return 0
		}
	}
	else {
		if (viewWidth < 0.5 * waveLength) {
			return 0
		}
		else if (viewWidth < 3 * waveLength) {
			return 2
		}
		else {
			return 0
		}
	}
}

function endActivity()
{
	submitAnswerButton.setVisible(false)
	answerBoxCarrierAmp.setVisible(false)
	answerBoxCarrierFrq.setVisible(false)
	answerBoxModAmp.setVisible(false)		
	answerBoxModFrq.setVisible(false)	
	unitComboBoxCarrierAmp.setVisible(false)
	unitComboBoxCarrierFrq.setVisible(false)
	unitComboBoxModAmp.setVisible(false)	
	unitComboBoxModFrq.setVisible(false)
	carrierAmpLabel.setVisible(false)
	carrierFrqLabel.setVisible(false)
	modAmpLabel.setVisible(false)	
	modFrqLabel.setVisible(false)
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

		if (state == LabviewMonitor.RUNNING || noLabview) {
		    System.out.println("State: running")
		    if (validateAnswers() == false) {
		    	return
		    }
			msg = "This will end your activity and close the LabVIEW window. Do you want to continue?"
			var option = JOptionPane.showConfirmDialog(null, msg, "Submitting Answer", JOptionPane.OK_CANCEL_OPTION)
			
			if (option == JOptionPane.OK_OPTION) {
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
