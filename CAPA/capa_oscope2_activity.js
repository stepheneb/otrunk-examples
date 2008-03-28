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
 * Variables from OTScriptObject
 * 
 * otContents
 * controllerService
 */
 
/*
 * Variables from otml 
 * otc_ : component variables
 */
 
var ot_monitor
var ot_infoAreaCards
var ot_instAreaCards
var ot_unitChoiceCarrierFrq
var ot_unitChoiceModFrq
var ot_emptyUnitChoice
var otc_submitAnswerButton
var otc_reportButton
var otc_answerBoxCarrierFrq
var otc_answerBoxModFrq
var otc_answerBoxModIndex
var otc_unitComboBoxCarrierFrq 
var otc_unitComboBoxModFrq
var otc_carrierFrqLabel
var otc_modFrqLabel
var otc_modIndexLabel
var otc_valueLabel
var otc_unitLabel
var otc_percentLabel
var otc_launchButton 
 	
var glob = {
	dateFormat : null,		
	info : null, // text to be added to the report
	currentStep : 1,
	lastStep : 1,
	monitor : null, // "real object" for ot_monitor
	otAssessment : null,
}

 /**
 * This function is called when the script starts up
 * It returns a boolean indicating whether the initialization 
 * was successful or not.
 */
function init() {
	System.out.println("Entered: init()")
	
	glob.dateFormat = SimpleDateFormat.getInstance()
    glob.monitor = controllerService.getRealObject(ot_monitor)		
	setupGUI()
    setupAssessmentLogging()
	initLogging()
	
	OTCardContainerView.setCurrentCard(ot_infoAreaCards, "intro_text")
	startStep(glob.currentStep)
	return true
}

function save() {
	System.out.println("Entered: save()")
    otc_submitAnswerButton.removeActionListener(listeners.submitAnswerButtonListener)
	return true
}

function setupAssessmentLogging() {
	// Create assessment object
	glob.otAssessment = otObjectService.createObject(OTAssessment)
	glob.otAssessment.setTitle("Amplitude Modulation - Student Report")
	otContents.add(glob.otAssessment)
}

function initLogging() {
	glob.info = otObjectService.createObject(OTText)
	glob.info.setText("")
	otContents.add(glob.info)
}

function log(msg) {
	glob.info.setText(glob.info.getText() + msg)
}

function setupGUI() {
	otc_reportButton.setVisible(false)
		
	otc_answerBoxCarrierFrq.setBackground(new Color(1,1,0.7))	
	otc_answerBoxModFrq.setBackground(new Color(1,1,0.7))		
	otc_answerBoxModIndex.setBackground(new Color(1,1,0.7))
	otc_unitComboBoxCarrierFrq.setBackground(new Color(1,1,0.7))
	otc_unitComboBoxModFrq.setBackground(new Color(1,1,0.7))	

	otc_submitAnswerButton.addActionListener(listeners.submitAnswerButtonListener)
}

function startStep(step) {
	//Show instructions for the current step
	var strCardID = "step" + step + "_text"
	OTCardContainerView.setCurrentCard(ot_instAreaCards, strCardID)
	
	otc_answerBoxCarrierFrq.setText("")	
	ot_unitChoiceCarrierFrq.setCurrentChoice(ot_emptyUnitChoice)	
}

function endActivity()
{
	otc_submitAnswerButton.setVisible(false)
	otc_answerBoxCarrierFrq.setVisible(false)
	otc_answerBoxModFrq.setVisible(false)
	otc_answerBoxModIndex.setVisible(false)	
	otc_unitComboBoxCarrierFrq.setVisible(false)
	otc_unitComboBoxModFrq.setVisible(false)
	otc_carrierFrqLabel.setVisible(false)
	otc_modFrqLabel.setVisible(false)
	otc_modIndexLabel.setVisible(false)
	otc_valueLabel.setVisible(false)
	otc_unitLabel.setVisible(false)
	otc_percentLabel.setVisible(false)	
	otc_launchButton.setVisible(false)
	
	OTCardContainerView.setCurrentCard(ot_infoAreaCards, "end_text")
	OTCardContainerView.setCurrentCard(ot_instAreaCards, "solution_text")
	
	otc_reportButton.setVisible(true)
}

function wrap_assess() {
	var converter = new LabviewReportConverter(glob.monitor)
	converter.markEndTime()
	var madWrapper = converter.getMADWrapper()
	var scopeHelper = new ScopeAssessmentUtil(madWrapper)
	glob.otAssessment.setLabel("Oscilloscope")
	var inventory = glob.otAssessment.getInventory()
	inventory.put("modelActivityData", converter.getOTModelActivityData())
	assess(glob.otAssessment, scopeHelper, madWrapper)
}

var listeners = {
	submitAnswerButtonListener : new ActionListener({
		actionPerformed: function(evt) {
	    	if (validateAnswers() == false) {
	    		return
	    	}
			var msg = "This will end your activity and close the LabVIEW window. Do you want to continue?"
			var option = JOptionPane.showConfirmDialog(null, msg, "Submitting Answer", JOptionPane.OK_CANCEL_OPTION)
		
			if (option == JOptionPane.OK_OPTION) {
	  			glob.monitor.close()

	    		wrap_assess() // must close labVIEW before assess()
	    	
				++ glob.currentStep
				if (glob.currentStep <= glob.lastStep) {
					startStep(glob.currentStep)
				}
				else {
					endActivity()
				}
			}
		}
	})
}

// for debugging
function p(s) {
	System.out.println(s)
}