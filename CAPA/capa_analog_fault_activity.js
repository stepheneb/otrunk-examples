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
importClass(Packages.org.concord.otrunk.labview.AnalogDCUtil)

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
var ot_assessment
var ot_cards
var otc_reportButton
 	
var glob = {
	dateFormat : SimpleDateFormat.getInstance(),
	currentStep : 1,
	lastStep : 1,
	monitor : null, // "real object" for ot_monitor
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
    glob.monitor.setExitListener(listeners.labviewExitListener)
    setupAssessmentLogging()
	OTCardContainerView.setCurrentCard(ot_cards, "main_card_1")	
	return true
}

function save() {
	System.out.println("Entered: save()")
	return true
}

function setupAssessmentLogging() {
	// Create assessment object
	otContents.add(ot_assessment)
}

function setupGUI() {
	otc_reportButton.setVisible(false)	
}

function endActivity() {
	otc_reportButton.setVisible(true)
	OTCardContainerView.setCurrentCard(ot_cards, "main_card_2")
}

function wrap_assess() {
	var ms = new Date().getTime()
	ot_assessment.setTime(ms)	
	var converter = new LabviewReportConverter(glob.monitor)
	converter.markEndTime()
	var madWrapper = converter.getMADWrapper()
	var inventory = ot_assessment.getInventory()
	var madID = converter.getOTModelActivityData().getGlobalId()
	inventory.put("modelActivityData", madID)
	assess(ot_assessment, madWrapper)
}

var listeners = {
	labviewExitListener : new LabviewMonitor.ExitListener({
		exited: function() {
    		wrap_assess() // must close labVIEW before assess()			
			OTCardContainerView.setCurrentCard(ot_cards, "main_card_2")				
		}	
	})
}
