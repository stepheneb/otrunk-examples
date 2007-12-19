importClass(Packages.java.lang.System)
importClass(Packages.java.awt.Color)
importClass(Packages.java.awt.event.ActionListener)
importClass(Packages.javax.swing.JOptionPane)

importClass(Packages.org.concord.otrunk.ui.swing.OTCardContainerView)
importClass(Packages.org.concord.otrunkcapa.rubric.OTAssessment)
importClass(Packages.org.concord.otrunk.labview.LabviewActivityLog)


/**
 * Variables from otml
 */
var otMonitor
var otInstAreaCards
var otAnswerBox
var otUnitChoice
var otEmptyUnitChoice
var otUnitComboBox
var submitButton
var reportButton
var clearButton
var reportsText // reports are shown here when "show report" has been selected

/**
 * 
 */
var otAssessment
var initializationDone = false
//var activityInitialized = false
var activityInitialized = true
var timeStepStarted = 0

/**
 * This function is called when the script starts up
 * It returns a boolean indicating whether the initialization 
 * was successful or not.
 */
function init() {
	System.out.println("-------------------------- init --------------------------------")
	setupGUI()
	//initLogging()
	//setupMultimeter()
	//setupCircuitListener()
	//setupAnswerButton()
	//setupActivity()
	setupAsessmentLogging()
	//setupCircuitAnalyzer()
	initializationDone = true
        
	//submitButton.addActionListener(submitButtonListener)
	//clearButton.addActionListener(clearButtonListener)
	// 	
	return initializationDone;
}

function save() {
	submitButton.removeActionListener(submitButtonListener)
	submitButton.removeActionListener(clearButtonListener)
	return true;
}

function setupGUI() {
	otAnswerBox.setBackground(new Color(1,1,0.7))
	otUnitComboBox.setBackground(new Color(1,1,0.7))
}

function setupAsessmentLogging() {
	if (activityInitialized) {
		//Create assessment object
		otAssessment = otObjectService.createObject(OTAssessment)
		otContents.add(otAssessment)
	}
	else{
		//If the activity was already run, take the last assessment object, copy it and continue it
		var otLastAssessment = null
		for (var i = otContents.size() - 1; i >= 0; i--) {
			var obj = otContents.get(i)
			if (obj instanceof OTLabviewOScopeAssessment) {
				otLastAssessment = obj
				break
			}
		}
		if (otLastAssessment != null) {
			otAssessment = otObjectService.copyObject(otLastAssessment, -1)
			otContents.add(otAssessment)
		}
	}
	//////////
	otAssessment.getIndicatorValues().put("amplitudeCorrect", new java.lang.Float(0.01))
	otAssessment.getIndicatorValues().put("frequencyCorrect", new java.lang.Float(0.04))
	//////////
}

function initStep() {
	timeStepStarted = System.currentTimeMillis()
}

function startStep(step) {
	initStep()
	
	//Show instructions for the current step
	var strCardID = "step" + step + "_text"
	OTCardContainerView.setCurrentCard(otInstAreaCards, strCardID)
	//
	
	otAnswerBox.setText("")
	otUnitChoice.setCurrentChoice(otEmptyUnitChoice)
}

function setReportText() {
	var logs = otMonitor.getLogs()
	var text = ""
	var size = logs.size()
		
	for (var i = 0; i < size; ++i) {
		var report = logs.get(i)
		text += report.getText()
		if (i < size - 1) {
			text += "\n=======================================================================\n\n"
		}
	}
		
	System.out.println(text)
	reportsText.setText(text)
}

var submitButtonHandler = {
	actionPerformed: function(evt) {
		var monitor = controllerService.getRealObject(otMonitor)
		if (monitor.processIsRunning()) {
			JOptionPane.showMessageDialog(null, "Please close the LabVIEW session first and try SUBMIT again.")
			System.out.println("Process running. Try when finished")
			return
		}
		monitor.report()
		setReportText()
	}
};

var clearButtonHandler = {
	actionPerformed: function(evt) {
		otMonitor.getLogs().removeAll()
		reportsText.setText("")
	}
};


var submitButtonListener = new ActionListener(submitButtonHandler)


