importClass(Packages.java.lang.System)
importClass(Packages.java.lang.Integer)
importClass(Packages.java.lang.Float)
importClass(Packages.java.lang.Double)
importClass(Packages.java.text.SimpleDateFormat)
importClass(Packages.java.awt.Color)
importClass(Packages.java.awt.event.ActionListener)
importClass(Packages.javax.swing.JOptionPane)
importClass(Packages.java.math.RoundingMode)

importClass(Packages.org.concord.framework.otrunk.view.OTUserListService)
importClass(Packages.org.concord.otrunk.ui.OTText)
importClass(Packages.org.concord.otrunk.ui.swing.OTCardContainerView)
importClass(Packages.org.concord.otrunkcapa.rubric.OTAssessment)
importClass(Packages.org.concord.otrunkcapa.rubric.OTAssessmentView)
importClass(Packages.org.concord.otrunkcapa.rubric.RubricGradeUtil)
importClass(Packages.org.concord.otrunk.labview.LabviewMonitor)
importClass(Packages.org.concord.otrunk.labview.LabviewReportConverter)
importClass(Packages.org.concord.otrunk.labview.MADWrapper)


/*
 * Variables from OTScriptContextHelper
 * ====================================
 * otContents
 * viewContext
 * controllerService
 */
 
/*
 * Variables from otml 
 * otc_ : component variables
 */
 
var ot_monitor
var ot_cards
 	
var glob = {
	dateFormat : SimpleDateFormat.getInstance(),
	currentStep : 1,
	lastStep : 1,
	monitor : null, // "real object" for ot_monitor
	otAssessment : null,
	madWrapper : null,
	activityLog : ""
}

 /**
 * This function is called when the script starts up
 * It returns a boolean indicating whether the initialization 
 * was successful or not.
 */
function init() {
	System.out.println("Entered: init()")
	glob.dateFormat.applyPattern("MM/dd/yyyy HH:mm:ss zzz");
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
	var userName = getUserName()
	var ms = new Date().getTime()
	var assessment = ot_assessment
	assessment.setUserName(userName)
	assessment.setTime(ms)	
	otContents.add(assessment)
	glob.otAssessment = assessment
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

function wrap_assess() {
	var converter = new LabviewReportConverter(glob.monitor)
	converter.markEndTime()
	glob.madWrapper = converter.getMADWrapper()
	var inventory = glob.otAssessment.getInventory()
	var madID = converter.getOTModelActivityData().getGlobalId()
	inventory.put("modelActivityData", madID)
	assess(glob.otAssessment, glob.madWrapper)
}

var listeners = {
	labviewExitListener : new LabviewMonitor.ExitListener({
		exited: function() {
	    	wrap_assess() // must close labVIEW before assess()			
			OTCardContainerView.setCurrentCard(ot_cards, "main_card_2")				
		}	
	})
}
