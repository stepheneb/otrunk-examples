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
importClass(Packages.org.concord.framework.otrunk.view.OTUserListService)
importClass(Packages.org.concord.otrunkcapa.rubric.OTAssessment)
importClass(Packages.org.concord.otrunk.labview.LabviewMonitor)
importClass(Packages.org.concord.otrunk.labview.LabviewReportConverter)
importClass(Packages.org.concord.otrunk.labview.ScopeAssessmentUtil)

/*
 * Variables from OTScriptContextHelper
 * ====================================
 * viewContext
 */
 
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

var _currentStep = 1
var _lastStep = 1

var _correctAmp = 0.0
var _submittedAmp = 0.0
var _submittedAmpUnit = ""

var _correctFrq = 0.0
var _submittedFrq = 0.0
var _submittedFrqUnit = ""

var _dateFormat = SimpleDateFormat.getInstance()

var _helper = null
var _madw = null  

/**
 * This function is called when the script starts up
 * It returns a boolean indicating whether the initialization 
 * was successful or not.
 */

function init() {
	System.out.println("-------------------------- init --------------------------------")
	
	_dateFormat.applyPattern("MM/dd/yyyy HH:mm:ss zzz");
    _monitor = controllerService.getRealObject(otMonitor)	

	setupGUI()
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

function initLogging() {
	_info = otObjectService.createObject(OTText)
	_info.setText("")
	otContents.add(_info)
}

function log(msg) {
	_info.setText(_info.getText() + msg)
}

function setupGUI() {
	answerBoxAmp.setBackground(new Color(1,1,0.7))
	answerBoxFrq.setBackground(new Color(1,1,0.7))	
	unitComboBoxAmp.setBackground(new Color(1,1,0.7))
	unitComboBoxFrq.setBackground(new Color(1,1,0.7))
	
	reportButton.setVisible(false)
}

function setupAssessmentLogging() {
	var userName = getUserName()
	var ms = new Date().getTime()
	
	// Create assessment object
	_otAssessment = otObjectService.createObject(OTAssessment)
	_otAssessment.setActivityName("Using an Oscilloscope");
	_otAssessment.setUserName(userName)
	_otAssessment.setTime(ms)	

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

function wrap_assess() {
	var converter = new LabviewReportConverter(_monitor)
	converter.markEndTime()
	_madw = converter.getMADWrapper()
	_helper = new ScopeAssessmentUtil(_madw)
	var madID = converter.getOTModelActivityData().getGlobalId()
	_otAssessment.getInventory().put("modelActivityData", madID) 
	assess(_otAssessment)
}

function getUserName() {
	var userListService = viewContext.getViewService(OTUserListService)
	var users = userListService.getUserList()
	if (users.size() < 1) {
		return "A student"
	}
	else {
		return users.get(0).getName()
	}
}

var submitAnswerButtonHandler = {
	actionPerformed: function(evt) {
		if (!_monitor.isRunning()) {
			JOptionPane.showMessageDialog(null, "You should open the oscilloscope window first.")
			return
		}
	    if (validateAnswers() == false) {
	    	return
	    }
		var msg = "This will end your activity and close the oscilloscope. Do you want to continue?"
		var option = JOptionPane.showConfirmDialog(null, msg, "Submitting Answer", JOptionPane.OK_CANCEL_OPTION)
		
		if (option == JOptionPane.OK_OPTION) {
	  		_monitor.close()
	    	wrap_assess() // must close labVIEW before assess()
	    	
			++_currentStep
			if (_currentStep <= _lastStep) {
				startStep(_currentStep)
			}
			else {
				endActivity()
			}
		}
	}
}

var submitAnswerButtonListener = new ActionListener(submitAnswerButtonHandler)
