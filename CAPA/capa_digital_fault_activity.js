importClass(Packages.java.lang.System)
importClass(Packages.java.lang.Integer)
importClass(Packages.java.lang.Float)
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
var ot_cards
var otc_submitButton
var otc_reportButton
 	
var glob = {
	dateFormat : SimpleDateFormat.getInstance(),
	info : null, // text to be added to the report
	currentStep : 1,
	lastStep : 1,
	monitor : null, // "real object" for ot_monitor
	otAssessment : null,
	activityLog : ""
}

 /**
 * This function is called when the script starts up
 * It returns a boolean indicating whether the initialization 
 * was successful or not.
 */
function init() {
	System.out.println("Entered: init()")
	glob.dateFormat.applyPattern("MM/dd/yyyy HH:mm:ss zzz")	
	setupGUI();
    glob.monitor = controllerService.getRealObject(ot_monitor)		
    setupAssessmentLogging()
	initLogging()
	OTCardContainerView.setCurrentCard(ot_cards, "main_card_1")	
	return true
}

function save() {
	System.out.println("Entered: save()")
    otc_submitButton.removeActionListener(listeners.submitButtonListener)
	return true
}

function setupAssessmentLogging() {
	// Create assessment object
	glob.otAssessment = otObjectService.createObject(OTAssessment)
	glob.otAssessment.setTitle("Faults - Student Report")
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
	otc_submitButton.addActionListener(listeners.submitButtonListener)
}

function endActivity() {
	otc_reportButton.setVisible(true)
	OTCardContainerView.setCurrentCard(ot_cards, "main_card_2")
}

function wrap_assess() {
	var converter = new LabviewReportConverter(glob.monitor)
	converter.markEndTime()
	var madWrapper = converter.getMADWrapper()
	glob.otAssessment.setLabel("Fault")
	var inventory = glob.otAssessment.getInventory()
	var madID = converter.getOTModelActivityData().getGlobalId()
	inventory.put("modelActivityData", madID)
	assess(glob.otAssessment, madWrapper)
}

var listeners = {
	submitButtonListener : new ActionListener({
		actionPerformed: function(evt) {
			p("Enter: submitButtonListener.actionPerformed()")

	    	if (glob.monitor.hasNeverRun()) {
	    		var msg = "You must do the activity first before submission. Click on \"show circuit\".";
	    		var option = JOptionPane.showMessageDialog(null, msg, "Alert", JOptionPane.WARNING_MESSAGE)
	    		return
	    	}
			var msg = "This will end your activity and close the LabVIEW window. Do you want to continue?"
			var option = JOptionPane.showConfirmDialog(null, msg, "Submitting Answer", JOptionPane.OK_CANCEL_OPTION)
			if (option == JOptionPane.OK_OPTION) {
	  			glob.monitor.close()
	    		wrap_assess() // must close labVIEW before assess()
				endActivity()
			}
		}
	})
}

// for debugging
function p(s) {
	System.out.println(s)
}