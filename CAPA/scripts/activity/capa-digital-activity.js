importClass(Packages.java.awt.Color)
importClass(Packages.java.awt.event.ActionListener)
importClass(Packages.java.lang.Double)
importClass(Packages.java.lang.Float)
importClass(Packages.java.lang.Integer)
importClass(Packages.java.lang.System)
importClass(Packages.java.math.RoundingMode)
importClass(Packages.java.text.SimpleDateFormat)

importClass(Packages.javax.swing.JOptionPane)

importClass(Packages.org.concord.framework.otrunk.view.OTUserListService)
importClass(Packages.org.concord.otrunk.labview.DTSAssessmentUtil)
importClass(Packages.org.concord.otrunk.labview.LabviewMonitor)
importClass(Packages.org.concord.otrunk.labview.LabviewReportConverter)
importClass(Packages.org.concord.otrunk.labview.MADWrapper)
importClass(Packages.org.concord.otrunk.ui.OTText)
importClass(Packages.org.concord.otrunk.ui.swing.OTCardContainerView)
importClass(Packages.org.concord.otrunkcapa.rubric.OTAssessment)
importClass(Packages.org.concord.otrunkcapa.rubric.OTAssessmentView)
importClass(Packages.org.concord.otrunkcapa.rubric.RubricGradeUtil)

/*
 * Variables from context 
 */
var c = {
    // from OTScriptContextHelper
    otContents : otContents,
    viewContext : viewContext,
    controllerService : controllerService,
    // from otml
    assessment : ot_assessment,
    monitor : ot_monitor,
    cards : ot_cards
}

// Other global variables
var g = {
    dateFormat : SimpleDateFormat.getInstance(),
    currentStep : 1,
    lastStep : 1,
    monitor : null, // "real object" for ot_monitor
    madWrapper : null,
    activityLog : "",
    helper : new DTSAssessmentUtil()
}

 /**
 * This function is called when the script starts up
 * It returns a boolean indicating whether the initialization 
 * was successful or not.
 */
function init() {
    System.out.println("Entered: init()")
    g.dateFormat.applyPattern("MM/dd/yyyy HH:mm:ss zzz");
    g.monitor = c.controllerService.getRealObject(c.monitor)
    g.monitor.setExitListener(listeners.labviewExitListener)
    setupAssessmentLogging()
    OTCardContainerView.setCurrentCard(c.cards, "main_card_1")    
    return true
}

function save() {
    System.out.println("Entered: save()")
    return true
}

function setupAssessmentLogging() {
    var userName = getUserName()
    var ms = new Date().getTime()
    var assessment = c.assessment
    assessment.setUserName(userName)
    assessment.setTime(ms)    
    c.otContents.add(assessment)
}

function getUserName() {
    var userListService = c.viewContext.getViewService(OTUserListService)
    var users = userListService.getUserList()
    if (users.size() < 1) {
        return "A student"
    }
    else {
        return users.get(0).getName()
    }
}

function wrap_assess() {
    var converter = new LabviewReportConverter(g.monitor)
    converter.markEndTime()
    g.madWrapper = converter.getMADWrapper()
    var inventory = c.assessment.getInventory()
    var madID = converter.getOTModelActivityData().getGlobalId()
    inventory.put("modelActivityData", madID)
    assess(c.assessment, g.madWrapper)
}

var listeners = {
    labviewExitListener : new LabviewMonitor.ExitListener({
        exited: function() {
            wrap_assess() // must close labVIEW before assess()            
            OTCardContainerView.setCurrentCard(c.cards, "main_card_2")                
        }    
    })
}
