/**
 * This is the script for the CAPA multimeter activity.
 * It was copied from the original Pedagogica resistance activity and modified to 
 * integrate it with the OTrunk environment.
 * 
 * Authors:
 * Alex Burke (original pedagogica activity)
 * Paul Horwitz, Aaron Unger, Ingrid Moncada
 *
 * Date created: Aug 2007
 */

/**
 * Variables coming from the script OT context:
 * cckModelView			(OTCCKCAPAModelView)		// CCK model view object
 * apparatusPanel		(JPanel)					// Swing panel that contains the CCKPanel (useful to take the screenshot)
 * otNotebookObject		(OTNotebook) 				// OT Notebook object to use to keep track of measurements
 * otInstAreaCards		(OTCardContainer)			// OT card container for the instructons area of the activity. Used to switch between messages by switching to a different card.
 * otInfoAreaCards		(OTCardContainer)			// OT card container for the information area of the activity. Used to switch between messages by switching to a different card.
 * submitAnswerButton	(JButton) 					// Actual swing button used to submit the answer
 * answerBox			(JTextArea)					// Swing text component where the user writes the answer
 * solutionText			(OTTextPane)				// OT Text Pane that holds the text with the solution
 * reportButton			(JButton)					// Button used to show report
 * unitComboBox			(JComboBox)					// Swing combo box with all units 
 * unitChoice			(OTChoice)					// OT Choice object with all the units that can be selected
 * emptyUnitChoice		(OTUnit)					// Empty unit indicating there is no selection 
 */

importPackage(Packages.java.lang);
importPackage(Packages.java.lang.reflect);
importPackage(Packages.java.util);
importPackage(Packages.java.io);
importPackage(Packages.java.awt.event);
importPackage(Packages.java.awt);
importPackage(Packages.java.awt.geom);
importPackage(Packages.java.awt.image);

importPackage(Packages.javax.swing);
importPackage(Packages.javax.imageio);
importClass(Packages.java.text.DecimalFormat);

importPackage(Packages.edu.colorado.phet.cck.model);
importPackage(Packages.edu.colorado.phet.cck.model.components);
importPackage(Packages.edu.colorado.phet.cck.model.analysis);
importPackage(Packages.edu.colorado.phet.cck.piccolo_cck);
importPackage(Packages.edu.colorado.phet.common_cck.model.clock);
importPackage(Packages.edu.colorado.phet.common.phetcommon.view.util);
importPackage(Packages.edu.colorado.phet.common.phetcommon.math);

importPackage(Packages.org.concord.swing.util);
importPackage(Packages.org.concord.otrunk.ui);
importPackage(Packages.org.concord.otrunk.ui.notebook);
importPackage(Packages.org.concord.data.state);
importPackage(Packages.org.concord.framework.otrunk);

importClass(Packages.org.concord.framework.otrunk.view.OTUserListService)
importClass(Packages.org.concord.otrunk.ui.swing.OTCardContainerView);
importClass(Packages.org.concord.otrunk.ui.OTText);
importClass(Packages.org.concord.framework.otrunk.view.OTActionContext);
importClass(Packages.org.concord.otrunkcapa.OTMultimeterAnswerAssessment);
importClass(Packages.org.concord.otrunkcapa.OTMultimeterAssessment);
importClass(Packages.org.concord.otrunkcck.CCKCircuitAnalyzer);
importClass(Packages.org.concord.otrunkcapa.CAPAUnitUtil);


/*
 * Variables from OTScriptContextHelper
 * ====================================
 * otContents
 * viewContext
 */

var activityName = "Using the digital multimeter";

//var startHTML = "<html><blockquote><p><font size=\"4\" face=\"Verdana\">";
//var endHTML = "</font></p></blockquote></html>";

//CCK handy objects 
var cckModule = cckModelView.getModule();	// (CCKPiccoloModule)
var cckModel = cckModule.getCCKModel();		// (CCKModel)
var cckSolver = cckModel.getCircuitSolver(); // (CircuitAnalysisCCKAdapter)
var cckCircuitNode = cckModule.getCckSimulationPanel().getCircuitNode();	// (CircuitNode)
var cckCircuit = cckModule.getCircuit();	// (Circuit)
var cckMultimeter = cckModule.getMultimeterModel();		// (MultimeterModel)
//

// Variables that should be saved (as part of the script state)
var multimeterBrokenStepCount = 0;	// How many times has the DMM been blown up in this step
//

var maxDMMSafeCurrent;				// Maximum current that is safe without blowing up the multimeter

var initializationDone = true;	// Whether the init() function is done or not
var solverFinishedOnce = false;	// ?
var lastMMStateViable = false;	// ?
var logFile;					// Used for logging information
var bLogTextFile = false;		// Whether we log in a test file or not
var xmlText;					// OTXMLText object used for logging information
var firstJunctionsConnected = true;	//Used to put up text the first time a junction is connected.
var firstMeasurement = true; 		//Used to put up text the first time a measurement is made.

var previousMultimeterValue = Double.NaN;	// Value that stores the last multimeter measurement, to avoid repeated measurements
var previousMultimeterState = -1;			// Value

var aTolerance = 0.01;			// Tolerance for current
var vTolerance = 0.01;			// Tolerance for voltage

var helpEnabled = false;		// Help button ??
var notebookEnabled = false;

// Activity Variables
var targetResistor = null;		// (Branch) Resistor that needs to be solved by the user 
var circuitBattery = null;		// (Branch) Battery in the circuit
var circuitSwitch = null;		// (Switch) Switch in the circuit
var measurements = [];			// Array of measurement objects
var answerObj;
var solutionObj;
var solutionMessage = "";
var otAssessment;
var circuitAnalyzer;			// (CCKCircuitAnalyzer)

var activityInitialized;
var currentStep = 1;
var lastStep = 3;
var timeStepStarted = 0;
var measurementIndexStepStarted = 0;
var activityDone = false;
//

/**
 * This function is called when the script starts up
 * It returns a boolean indicating whether the initialization 
 * was successful or not.
 */
function init()
{
	System.out.println("-------------------------- init --------------------------------");
	setupGUI();
	setupApparatusPanel();
	initLogging();
	setupMultimeter();	
	setupCircuitListener();
	setupAnswerButton();
	setupActivity();
	setupAsessmentLogging();
	setupCircuitAnalyzer();
	initializationDone = true;
	return initializationDone;
}

/**
 * This function is called when the view is closed, just before the script object is destroyed
 */
function save()
{
	System.out.println("-------------------------- save--------------------------------");
	
	//Save state variables
	saveStateVariable("initialSetupDone", new java.lang.Boolean(true));	//Marks that the initial setup is done
	saveStateVariable("activityDone", new java.lang.Boolean(activityDone));	//Marks if the activity was done
	saveStateVariable("resistorResistance", new java.lang.Float(targetResistor.getResistance()));	//Saves the resistance
	saveStateVariable("currentStep", new java.lang.Integer(currentStep));	//Saves the current step
	//
	
	finalizeLogging();
}

function getStateVariable(name)
{
	return scriptState.get(name);
}

function getStateVariableBln(name)
{
	var bVar = getStateVariable(name);
	if (bVar == null) return false;
	else return bVar.booleanValue();
}

function saveStateVariable(name, value)
{
	scriptState.put(name, value);
}

/** Initial set up if the GUI. This stuff eventually could be moved to the otml file */
function setupGUI()
{
	answerBox.setBackground(new Color(1,1,0.7));
	unitComboBox.setBackground(new Color(1,1,0.7));
}

function setupCircuitAnalyzer()
{
	circuitAnalyzer = new CCKCircuitAnalyzer(cckCircuit, false);
}

/** 
 * Specific things to set up in this activity. 
 * Checks if the activity has been loaded or if it's run for the first time 
 */
function setupActivity()
{
	//Find out if the activity has been run already
	var bInitialSetupDone = getStateVariableBln("initialSetupDone");
	
	//Check whether the activity has been completed before or not
	var bActivityDone = getStateVariableBln("activityDone");
		
	//Find the target resistor in the circuit
	targetResistor = findBranch("#Ringless Resistor");
	if (targetResistor == null){	
		System.err.println("Error, target resistor not found!");
		System.err.println("Error: initialSetupDone was set, but circuit could not be loaded.");
		return;
	}
	//
	//Find the battery in the circuit
	circuitBattery = findBranch("#Battery");
	if (circuitBattery == null){	
		System.err.println("Error, battery not found!");
		return;
	}
	//	
	//Find the switch in the circuit
	circuitSwitch = findBranch("#Switch");
	if (circuitSwitch == null){	
		System.err.println("Error, switch not found!");
		return;
	}
	//	
	
	//Find the maximum current to be safe before blowing up the multimeter (in amps)
	//current = voltage / resistance
	maxDMMSafeCurrent = circuitBattery.getVoltageDrop() / circuitBattery.getResistance();
	System.out.println("maxDMMSafeCurrent: "+maxDMMSafeCurrent)
	//
	
	var bLoadedDone = false;	
	if (bInitialSetupDone && !bActivityDone){
	
		bLoadedDone = setupActivityLoaded();
	}
	
	if (!bInitialSetupDone || !bLoadedDone || bActivityDone){
	
		setupActivityInitial();
		activityInitialized = true;
	}
	else{
		activityInitialized = false;
	}
	
	calculateSolution();
}

/** 
 * Sets up this specific activity
 * This function will be called only when the activity is run for the first time 
 */
function setupActivityInitial()
{
	//Show initial text
	OTCardContainerView.setCurrentCard(otInfoAreaCards, "introText");
	
	//Show initial text
	startStep(currentStep);
	
	answerBox.setText("");
	unitChoice.setCurrentChoice(emptyUnitChoice);
	
	answerObj = null;
	reportButton.setVisible(false);
	
	deleteNotebookData();

	//Randomize the resistance
	var randomGen = new java.util.Random;
	var random = (randomGen.nextInt(20) * 5) + 5;

	targetResistor.setResistance(java.lang.Double(random));

	logInformation("The new target resistor's resistance is " + targetResistor.getResistance() + " ohms");	
}

/** 
 * Sets up this specific activity
 * This function will be called only when the activity has already been played, so it needs
 * to load its state in order to be initialized
 */
function setupActivityLoaded()
{
	currentStep = getStateVariable("currentStep").intValue();
	initStep();

	var resVal = getStateVariable("resistorResistance").doubleValue();
	targetResistor.setResistance(resVal);
	
	logInformation("The target resistor's resistance is " + targetResistor.getResistance() + " ohms");	
	
	return true;
}

function getLogFilename()
{
	return "capa_multimeter_activity_log";
}

/** Creates a text file in the Desktop with logging information. */
function initLogging()
{
	if (bLogTextFile){
		var studentName = getLogFilename();
		var desktop = new File(System.getProperty("user.home") + "/Desktop");
		var outputFile = new File(desktop, studentName + ".txt");
		logFile = new PrintWriter(new FileOutputStream(outputFile));
		// logFile.println(studentName + "\'s log");
	}
		
	//Create an OTText
	xmlText = otObjectService.createObject(OTText);
	xmlText.setText("<b>CAPA - " + activityName + " - Logging information</b>\n");
	//Put logging information into the otContents of the script object
	otContents.add(xmlText);
		
	logInformation("Activity started");
}

function setupAsessmentLogging()
{
	if (activityInitialized) {
		var userName = getUserName();
		var ms = new Date().getTime();
		
		//Create assessment object
		otAssessment = otObjectService.createObject(OTMultimeterAssessment);
		otAssessment.setTitle(activityName);
		otAssessment.setUserName(userName);
		otAssessment.setTime(ms);	
		otContents.add(otContents.size() - 1, otAssessment);
	}
	else{
		//If the activity was already run, take the last assessment object, copy it and continue it
		var otLastAssessment = null;
		for (var i = otContents.size() - 1; i >= 0; i--){
			var obj = otContents.get(i);
			if (obj instanceof OTMultimeterAssessment){
				otLastAssessment = obj;
				break;
			}
		}
		if (otLastAssessment != null){
			otAssessment = otObjectService.copyObject(otLastAssessment, -1);
			otContents.add(otContents.size() - 1, otAssessment);
		}
	}
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

function logInformation(info)
{
	info = (new java.util.Date()).toString() + " - " + info;
	System.out.println("LOG --- " + info);
	if (bLogTextFile){
		logFile.println(info);
	}
	xmlText.setText(xmlText.getText() + info + "\n");
}

// Log without timestamp/prefix
function logInfo(info) 
{
	if (bLogTextFile){
		logFile.println(info);
	}
	xmlText.setText(xmlText.getText() + info + "\n");
}

function finalizeLogging()
{
	logInformation("Activity finished");
	if (bLogTextFile){
		logFile.close();
	}	
}

function initStep()
{
	timeStepStarted = System.currentTimeMillis();
	measurementIndexStepStarted = measurements.length;
	multimeterBrokenStepCount = 0;
}

function startStep(step)
{
	initStep();
	
	//Show instructions for the current step
	var strCardID = "step" + step + "Text";
	OTCardContainerView.setCurrentCard(otInstAreaCards, strCardID);
	//
	
	answerBox.setText("");
	unitChoice.setCurrentChoice(emptyUnitChoice);
}

function setupApparatusPanel()
{
	//Listener for the apparatus panel size changes. Not sure what for
	var panelHandler =
	{
		componentResized: function(event)
		{
			System.out.println(apparatusPanel.getSize() + " is the size of the apparatus panel after change");
		}
	};
	var panelListener = new ComponentListener(panelHandler);
	apparatusPanel.addComponentListener(panelListener);
	System.out.println(apparatusPanel.getSize() + " is the size of the apparatus panel at initialization");
	//
}

function addMeasurement(type, value, unit, extra)
{
	//Create a measurement object
	var measurement = new Object();
	measurement.type = type;
	measurement.value = value;
	measurement.unit = unit;
	measurement.extra = extra;	//extra information on the measurement
	
	//Add it to the array
	measurements[measurements.length] = measurement;

	return measurement;
}

function printMeasurements()
{
	System.out.println(measurements.toSource());
}

function logMeasurements()
{
	var strLog;
	logInfo("\n<b>Measurements Summary - "+measurements.length+" measurements</b>");
	for (var i=0; i<measurements.length; i++){
		var m = measurements[i];
		strLog = "" + i + ") type=" + m.type + " value=" + m.value + " unit=" + m.unit;
		if (m.extra != null){
			strLog = strLog + " " + getExtraInfo(m.extra);
		}
		logInfo(strLog); 
	}
}

// Extract string to write to log
function getExtraInfo(e) {
	var s = "{";
	s += "blackLead: " + e.blackLead + ", ";
	s += "redLead: " + e.redLead + ", ";
	s += "blackLeadBetweenWires: " + e.blackLeadBetweenWires + ", ";	
	s += "redLeadBetweenWires: " + e.redLeadBetweenWires + ", ";
	s += "switchClosed: " + e.switchClosed + ", ";		
	s += "brokenDMM: " + e.brokenDMM + "}";
	return s;			
}

function setupMultimeter()
{	
	// cckModule.setWiggleMeVisible(false);	//this method doesn't exist anymore in cck
	cckModel.setInternalResistanceOn(true);

	var solverListener = new CircuitSolutionListener() 
	{
		//The way this works now is assuming that this function gets called when the multimeter gets a measurement
		circuitSolverFinished: function()
		{
			//System.out.println("ENTER: JS setupMultimeter::solverListener.circuitSolverFinished()");				
			var value = cckMultimeter.getCurrentValue();
			var state = cckMultimeter.getState();
			
			//If the multimeter is not connected to anything then it ignores the measurement 
			if (!cckMultimeter.isConnected()){
				//Forget last measurement
				previousMultimeterState = -1;
				previousMultimeterValue = Double.NaN;
				return;
			}
			
			//Checks that the value measured it not the same as the previous value captured
			//if the measurement was the same kind of measurement
			if(Double.isNaN(value) || Double.isInfinite(value) || 
				(MathUtil.isApproxEqual(previousMultimeterValue, value, 0.001) &&
				previousMultimeterState == state)) {
				
			//Repeated measurement
				previousMultimeterValue = value;
				return;
			}
			else {			
			//Measurement
				previousMultimeterValue = value;
				previousMultimeterState = state;

				var roundedValue = roundValue(value);
				var type = "";
				var units = cckMultimeter.getRangePrefix();
				
				var targetResistorVoltage;
				var targetResistorCurrent;
				
				if (state == MultimeterModel.AMMETER_STATE) {
					type = "current";
					units = units + "A";
					logInformation("Multimeter measurement (Ammeter mode): " + roundedValue + " " + units);
				}
				else if (state == MultimeterModel.OHMMETER_STATE) {
					type = "resistance";
					units = units + "Ohms";
					logInformation("Multimeter measurement (Ohmmeter mode): " + roundedValue + " " + units);
				}
				else if (state == MultimeterModel.VOLTMETER_STATE) {
					type = "voltage";
					units = units + "V";
					logInformation("Multimeter measurement (Voltmeter mode): " + roundedValue + " " + units);
				}
				else if (state == MultimeterModel.OFF_STATE) {
					type = "off";
					units = "?";
					logInformation("The multimeter is set to off");
					lastMMStateViable = false;
					solverFinishedOnce = false;
					return;
				}
				
				//Get the voltage drop and the current that is going through the target resistor at the time of the measurement				
				//Since these values are in volts and amperes, we need to "range" them so they are in the same units
				//as the measurement values (this is so we can compare them)
				targetResistorVoltage = targetResistor.getVoltageDrop();
				targetResistorCurrent = targetResistor.getCurrent();				
				var targetResistorVoltageString = rangeValue(targetResistorVoltage) + "V";
				var targetResistorCurrentString = rangeValue(targetResistorCurrent) + "A";
				//
				
				//System.out.println("Target resistor voltage drop: " + targetResistorVoltage + " -> " + targetResistorVoltageString);	
				//System.out.println("Target resistor current: " + targetResistorCurrent + " -> " + targetResistorCurrentString);	
							
				showFirstMeasurementMessage();

				logNotebook(roundedValue, units);
				lastMMStateViable = true;
				solverFinishedOnce = true;
				
				var extra = new Object();
				
				//Analyze circuit
				analyzeCircuitSetting(type, extra);
				analyzeMultimeterLeads(extra);
				
				//See if the DMM was blown up
				//System.out.println("battery current: " + circuitBattery.getCurrent());
				extra.brokenDMM = false;
				var currentToCheck = circuitBattery.getCurrent();
				if (currentToCheck >= (maxDMMSafeCurrent * 0.99)){
					logInformation("DMM blown up, battery current: " + currentToCheck);
					multimeterBrokenStepCount++;
					extra.brokenDMM = true;
				}
				//
				
				extra.resistorVoltage = targetResistorVoltageString;
				extra.resistorCurrent = targetResistorCurrentString;
				
				System.out.println(extra.toSource());
				
				//Record the measurement, including the voltage and current of the target resistor
				var m = addMeasurement(type, roundedValue, units, extra);
				//				
				
				//more debug info
				//System.out.println(m.toSource());
				//printMeasurements();
				//
			}
		} // end of multimeterChanged: function()
		
	}; // end of var multimeterListener = new MultimeterModel.Listener() 

	cckSolver.addSolutionListener(solverListener);

}// end of setupMultimeter()

function analyzeMultimeterLeads(extra)
{					
	//Get multimeter connections
	var redConn = cckMultimeter.getRedLeadModel().getConnection();
	var blackConn = cckMultimeter.getBlackLeadModel().getConnection();

	//Check if the leads are in between two wires or not
	//NOTE: This HAS to be called before simplfying the circuit
	extra.redLeadBetweenWires = circuitAnalyzer.isBetweenWires(redConn.getJunction());
	extra.blackLeadBetweenWires = circuitAnalyzer.isBetweenWires(blackConn.getJunction());
	
	//Simplify te circuit
	circuitAnalyzer.simplifyCircuit();

	//Check where the leads are connected to
	var redLead = 0;
	var blackLead = 0;	
	if (redConn != null){
		if (circuitAnalyzer.isBetween(redConn.getJunction(), targetResistor, circuitBattery)){
			redLead = 1;
		}
		if (circuitAnalyzer.isBetween(redConn.getJunction(), circuitBattery, circuitSwitch)){
			redLead = 3;
		}
		if (circuitAnalyzer.isBetween(redConn.getJunction(), circuitSwitch, targetResistor)){
			redLead = 2;
		}
	}
	if (blackConn != null){
		if (circuitAnalyzer.isBetween(blackConn.getJunction(), targetResistor, circuitBattery)){
			blackLead = 1;
		}
		if (circuitAnalyzer.isBetween(blackConn.getJunction(), circuitBattery, circuitSwitch)){
			blackLead = 3;
		}
		if (circuitAnalyzer.isBetween(blackConn.getJunction(), circuitSwitch, targetResistor)){
			blackLead = 2;
		}
	}
		
	extra.redLead = redLead;
	extra.blackLead = blackLead;	
}

/**
 * Determines details about the circuit when a measurement is made
 * (whether it was closed, open, etc)
 * Assumes that the circuit analyzer has already analyzed the circuit 
 */
function analyzeCircuitSetting(type, extra)
{
	circuitAnalyzer.analyzeCircuit();
				
	var redConn = cckMultimeter.getRedLeadModel().getConnection();
	var blackConn = cckMultimeter.getBlackLeadModel().getConnection();
	
	//Handle null pointer exception (shouldn't happen)
	if (redConn == null || blackConn == null) return;
	
	//Check that the leads in the DMM are connected to each other
	extra.leadsConnected = circuitAnalyzer.isConnectedInCircuit(redConn.getJunction(), blackConn.getJunction());

	//Check if the resistor is in the circuit measured by the DMM
	if (circuitAnalyzer.isConnectedInCircuit(targetResistor, redConn.getJunction()) &&
		circuitAnalyzer.isConnectedInCircuit(targetResistor, blackConn.getJunction())){
		extra.targetResistorConnected = true;
	}
	else{
		extra.targetResistorConnected = false;
	}
	
	//Check if the battery is in the circuit measured by the DMM
	if (circuitAnalyzer.isConnectedInCircuit(targetResistor, redConn.getJunction()) &&
		circuitAnalyzer.isConnectedInCircuit(targetResistor, blackConn.getJunction())){
		extra.batteryConnected = true;
	}
	else{
		extra.batteryConnected = false;
	}
	
	//Check if the switch is in the circuit measured by the DMM
	if (circuitAnalyzer.isConnectedInCircuit(targetResistor, redConn.getJunction()) &&
		circuitAnalyzer.isConnectedInCircuit(targetResistor, blackConn.getJunction())){
		extra.switchConnected = true;
	}
	else{
		extra.switchConnected = false;
	}
	
	//Check if the switch is closed
	extra.switchClosed = circuitSwitch.isClosed();
	
	//Check if the circuit is closed
	if (circuitAnalyzer.isConnectedInCircuit(targetResistor, targetResistor)){
		extra.circuitClosed = true;
	}
	else{
		extra.circuitClosed = false;
	}
}

function showFirstMeasurementMessage()
{
	if (firstMeasurement)
	{
		firstMeasurement = false;
//		OTCardContainerView.setCurrentCard(otInfoAreaCards, "firstMeasurementText");
	}
}

function showFirstJunctionMessage()
{
	if(firstJunctionsConnected)
	{
		firstJunctionsConnected = false;
//		OTCardContainerView.setCurrentCard(otInfoAreaCards, "firstJunctionText");
	}
}

/**
 * Sets up the circuit listener which will handle adding branches, connect and disconnect junctions, etc
 * It will also add a current and voltage listener to the resistor or multimeter
 */
function setupCircuitListener()
{
	//circuitHandler handles all changes in the circuit
	var circuitHandler = new CircuitListener() 
	{
		branchesMoved: function(branches)
		{
		},

		junctionRemoved: function(junction)
		{
		},
		
		branchRemoved: function(branch)
		{
		},

		junctionAdded: function(junction)
		{
		},
	
		/** junctionsConnected is called when two junctions are joined */
		junctionsConnected: function(a, b, newTarget)
		{
			if(!initializationDone)	return;
			
			showFirstJunctionMessage();
		},

		/** Junctions Split is called every time one branch is disconnected from other branches via the deletion of a junction */
		junctionsSplit: function(old, j) // j is the array of all the new junctions created by the split of old
		{
		},
		
		/* This method is called every time a branch is added */
		branchAdded: function(branch)
		{
			if(!initializationDone)	return;
			
			//Check if it's battery or -> change pop up menu
			var className = branch.getClass().getName();
			var names = className.split("\\.");
			var typeName = names[names.length - 1];

			if(typeName.equals("Battery"))
			{
				//Random voltage
				var randomGen = new java.util.Random;
				var random = randomGen.nextInt(2) + 7;
				branch.setVoltageDrop(random);
				//Different internal resistance
				branch.setInternalResistance(5);

				//Disable options in the pop up menu
				var menuComponent = cckCircuitNode.getBranchNode(branch).getMenu();
				var menuItems = menuComponent.getSubElements();
				menuItems[0].setEnabled(false);		//"Change voltage" option
				menuItems[1].setEnabled(false);		//"Change internal resistance" option
				menuItems[3].setEnabled(false);		//"Show vale" option
			}
		}
		
	};// end of var circuitHandler = new CircuitListener()

	cckCircuit.addCircuitListener(circuitHandler);
	
	/*
	var circuitSolutionListener = new CircuitSolutionListener() 
	{
		circuitSolverFinished: function()
		{
			System.out.println("----________ circuitSolverFinished! _________----");
			System.out.println("targetResistor getVoltageDrop(): " + targetResistor.getVoltageDrop());
		},
	};
	
	var circuitSolver = cckModel.getCircuitSolver();
	circuitSolver.addSolutionListener(circuitSolutionListener);
	*/

}// End of setupCircuitListener()

function setupAnswerButton()
{	
	var submitAnswerButtonHandler =
	{
		/**
		 * This function is called when the submit button is pressed
		 */ 
		actionPerformed: function(evt)
		{
			checkAnswer();
		}
	}
		
	var submitAnswerButtonListener = new ActionListener(submitAnswerButtonHandler);
	submitAnswerButton.addActionListener(submitAnswerButtonListener);

}// end of setupAnswerButton()

function roundValue(value)
{
	//var rounder = new DecimalFormat("#.##");
	//return rounder.format(value).toString();
	return Math.round(value*100)/100;
}

function roundValue2(value)
{
	//var rounder = new DecimalFormat("#.##");
	//return rounder.format(value).toString();
	return Math.round(value*10000)/10000;
}

/** Copy/pasted from the original CCK */
function rangeValue(value) 
{
	var unitPrefix;
	var sign = "";
	var displayValue;
     	     	
	if(value < 0){
		sign = "-";
		value = Math.abs(value);
	}
	
	//System.out.println("Value to range is: " + value);
	
	if(value >= 1000) {
		unitPrefix = " k";
		displayValue = value / 1000;
	}
	else if(value >= 1) {
		unitPrefix = " ";
		displayValue = value;
	}
	else {
		unitPrefix = " m";
		displayValue = value * 1000;
	}
	
	if (MathUtil.isApproxEqual(displayValue, 0, 0.001)){
		return "0 " + unitPrefix;
	}
	
	displayValue = roundValue(displayValue);
	
	return "" + sign + displayValue + unitPrefix;
	
}// end of rangeValue()

/** Logs a measurement in the notebook */
function logNotebook(value, unit) 
{
	if (!notebookEnabled) return;

	var list = otNotebookObject.getEntries(); //OTObjectList
	var measurement = null; //OTNotebookMeasurement
	var image = null; //OTImage
	var uv = null; //OTUnitValue
	var notes = null; //OTText
	var transform = AffineTransform.getScaleInstance(0.30, 0.30);
	var scaleTransform = new AffineTransformOp(transform, null);

	measurement = otNotebookObject.getOTObjectService().createObject(OTNotebookMeasurement);
	image = otNotebookObject.getOTObjectService().createObject(OTImage);
	uv = otNotebookObject.getOTObjectService().createObject(OTUnitValue);
	notes = otNotebookObject.getOTObjectService().createObject(OTText);

	//creating screenshot for image
	var bi = ComponentScreenshot.getScreenshot(apparatusPanel); //BufferedImage
	//var biScale = new BufferedImage(java.lang.Integer(bi.getWidth() * 0.30), java.lang.Integer(bi.getHeight() * 0.30), bi.getType());
	//scaleTransform.filter(bi, biScale);
	// FIXME try adding this to a RunLater so that it won't affect the ui experience in CCK
	var baos = new ByteArrayOutputStream(1024);
	ImageIO.write(bi, "png", baos);
	baos.flush();
	image.setImageBytes(baos.toByteArray());
	baos.close();

	notes.setText("Screenshot taken at " + (new java.util.Date()));
			
	uv.setValue(value);
	uv.setUnit(unit);
			
	measurement.setImage(image);
	measurement.setNotes(notes);
	measurement.setUnitValue(uv);
			
	list.add(measurement);
}

function deleteNotebookData()
{
	//Notebook
	otNotebookObject.setCurrentMeasurement(null);
	var list = otNotebookObject.getEntries(); //OTObjectList
	list.removeAll();
}

/**
 * Looks in the circuit and finds the first branch with the given name and returns it
 */
function findBranch(name)
{
	var branches = cckCircuit.getBranches();
	for (var i=0; i<branches.length; i++){
		var branch = branches[i];
		if (branch.getName().equals(name)) return branch;
	}
	return null;
}

/** Checks the answer and creates messages according to the answer submitted */
function checkAnswer()
{
	var questionObj
	
	/////
	//Get answer
	//The answer is at: 
	//answerBox(JTextField)
	//unitChoice(OTChoice)
	var strAnswer = answerBox.getText();
	//Get rid of return char
	strAnswer = strAnswer.replaceAll("\n", "");
	answerBox.setText(strAnswer);
	
	var val = 0;
	var unit = "";
	try{
		val = Float.valueOf(strAnswer).floatValue();
	}
	catch(ex){
		JOptionPane.showMessageDialog(null, "Value invalid: " + strAnswer + ".\n" + "Please try again.");
		return;
	}
	
	var otUnit = unitChoice.getCurrentChoice();
	if (otUnit != null){
		unit = otUnit.getAbbreviation();
	}
	
	answerObj = otObjectService.createObject(OTUnitValue);
	answerObj.setValue(val);
	answerObj.setUnit(unit);

	/////
	//Get correct answer
	var correctAnswerObj = null;
	if (getCurrentAnswerType().equalsIgnoreCase("voltage")){
		correctAnswerObj = solutionObj.voltage;
		questionObj = question1	
	}
	else if (getCurrentAnswerType().equalsIgnoreCase("current")){
		correctAnswerObj = solutionObj.current;
		questionObj = question2
	}
	else if (getCurrentAnswerType().equalsIgnoreCase("resistance")){
		correctAnswerObj = solutionObj.resistance;
		questionObj = question3
	}
	/////
	questionObj.setInput(answerObj)
	questionObj.setCorrectAnswer(correctAnswerObj)

	checkAnswerValue(correctAnswerObj);

	currentStep++;
	if (currentStep <= lastStep){
		startStep(currentStep);
		return;
	}
	
	//End of the activity
	endActivity();
}

/** Checks the answer and creates messages according to the answer submitted */
function checkAnswerValue(correctAnswer)
{
	if (answerObj == null || correctAnswer == null) return;
	
	//System.out.println("Checking answer " + answerObj.getValue() + " " + answerObj.getUnit() +
	//	"    Correct answer is " + correctAnswer.getValue() + " " + correctAnswer.getUnit());
	
	//Check value and unit
	var answerValueType = "";
	var value = answerObj.getValue();
	var answerUnitType = "";
	var unit = answerObj.getUnit();	
	var correctValue = correctAnswer.getValue();
	var correctUnit = correctAnswer.getUnit();
	var tolerance = CAPAUnitUtil.getAppropriateTolerance(value, correctValue);
	
	if (CAPAUnitUtil.compareValues(answerObj, correctAnswer)){
		//Answer might be given in different units but still correct
		answerValueType = "correct";
		answerUnitType = "correct";
	}
	else if (CAPAUnitUtil.compareValues(answerObj, correctAnswer, true, false)){
		//Answer considered correct but wrong sign
		//Answer might be given in different units but still correct 
		answerValueType = "correct wrong sign";
		answerUnitType = "correct";
	}
	else if (CAPAUnitUtil.compareValues(answerObj, correctAnswer, false, true)){
		//Answer might not have any units but the value is correct
		answerValueType = "correct";
		if (unit == null || unit.equals("")){
			answerUnitType = "no unit";
		}
		else{
			//This shouldn't happen
			answerUnitType = "correct";
		}
	}
	else if (CAPAUnitUtil.compareValues(answerObj, correctAnswer, true, true)){
		//Answer might not have any units but the value is correct (wrong sign)
		answerValueType = "correct wrong sign";
		if (unit == null || unit.equals("")){
			answerUnitType = "no unit";
		}
		else{
			//This shouldn't happen
			answerUnitType = "correct";
		}
	}
	else{
		//Combination value/type is not correct
		
		if (unit == null || unit.equals("")){
			answerUnitType = "no unit";
			
			if (CAPAUnitUtil.isApproxEqual(value, correctValue, tolerance)){
				answerValueType = "correct";
			}
			else if (CAPAUnitUtil.isApproxEqual(value, -correctValue, tolerance)){
				answerValueType = "correct wrong sign";
			}
			else if (correctValue != 0 && value != 0 && 
					(MathUtil.isApproxEqual(value*1000, correctValue, 0.1) ||
					MathUtil.isApproxEqual(value/1000, correctValue, 0.001))){
				answerValueType = "correct in other unit";
			}			
			else if (correctValue != 0 && value != 0 && 
					(MathUtil.isApproxEqual(value*1000, -correctValue, 0.1) ||
					MathUtil.isApproxEqual(value/1000, -correctValue, 0.001))){
				answerValueType = "correct in other unit wrong sign";
			}
			else{
				answerValueType = "incorrect";
			}
		}
		else if (unit.equalsIgnoreCase(correctAnswer.getUnit())){

			if (correctValue != 0 && value != 0 && 
					(MathUtil.isApproxEqual(value*1000, correctValue, 0.1) ||
					MathUtil.isApproxEqual(value/1000, correctValue, 0.001))){
				answerValueType = "correct in other unit";			
				answerUnitType = "incorrect but compatible";
			}
			else if (correctValue != 0 && value != 0 && 
					(MathUtil.isApproxEqual(value*1000, -correctValue, 0.1) ||
					MathUtil.isApproxEqual(value/1000, -correctValue, 0.001))){
				answerValueType = "correct in other unit wrong sign";			
				answerUnitType = "incorrect but compatible";
			}
			else{
				answerValueType = "incorrect";
				answerUnitType = "correct";
			}
		}
		else if (CAPAUnitUtil.isUnitCompatible(answerObj, correctAnswer)){
			answerUnitType = "incorrect but compatible";

			if (correctValue != 0 && value != 0 && 
					(CAPAUnitUtil.isApproxEqual(value, correctValue, tolerance) ||
					MathUtil.isApproxEqual(value*1000, correctValue, 0.1) ||
					MathUtil.isApproxEqual(value/1000, correctValue, 0.001))){
				answerValueType = "correct in other unit";			
			}
			else if (correctValue != 0 && value != 0 && 
					(CAPAUnitUtil.isApproxEqual(value, -correctValue, tolerance) ||
					MathUtil.isApproxEqual(value*1000, -correctValue, 0.1) ||
					MathUtil.isApproxEqual(value/1000, -correctValue, 0.001))){
				answerValueType = "correct in other unit wrong sign";			
			}
			else{
				answerValueType = "incorrect";
			}
		}			
		else{
			answerUnitType = "incorrect";

			if (correctValue != 0 && value != 0 && 
					(CAPAUnitUtil.isApproxEqual(value, correctValue, tolerance) ||
					MathUtil.isApproxEqual(value*1000, correctValue, 0.1) ||
					MathUtil.isApproxEqual(value/1000, correctValue, 0.001))){
				answerValueType = "correct in other unit";			
			}
			else if (correctValue != 0 && value != 0 && 
					(CAPAUnitUtil.isApproxEqual(value, -correctValue, tolerance) ||
					MathUtil.isApproxEqual(value*1000, -correctValue, 0.1) ||
					MathUtil.isApproxEqual(value/1000, -correctValue, 0.001))){
				answerValueType = "correct in other unit wrong sign";			
			}
			else{
				answerValueType = "incorrect";
			}
		}
		
	}
	//
	
	//System.out.println("checkAnswerValue, answerValueType: " + answerValueType + " answerUnitType: "+ answerUnitType);
	
	showSolution(answerValueType, answerUnitType, false);
	
	logAnswerAssessment(answerObj, correctAnswer, answerValueType, answerUnitType);
}

function endActivity()
{
	activityDone = true;
	submitAnswerButton.setVisible(false);
	answerBox.setVisible(false);
	unitComboBox.setVisible(false);
	OTCardContainerView.setCurrentCard(otInfoAreaCards, "endText");
	showSolutionMessage();
	
	reportButton.setVisible(true);
	
	//Log measurements
	logMeasurements();
}

function logAnswerAssessment(answer, correctAnswer, answerValueType, answerUnitType)
{
	var answerAssess = otObjectService.createObject(OTMultimeterAnswerAssessment);
	
	answerAssess.setAnswerType(getCurrentAnswerType());
	answerAssess.setLabel(getCurrentAnswerTypeLabel());
	answerAssess.setAnswerValue(answer);
	answerAssess.setCorrectValue(correctAnswer);
	
	var answerAssessIndicators = answerAssess.getIndicatorValues();
	
	if (answerValueType.equals("correct")){
		answerAssessIndicators.put("valueCorrect", new java.lang.Integer(1));
	}
	else if (answerValueType.equals("correct wrong sign")){
		answerAssessIndicators.put("valueCorrect", new java.lang.Integer(2));
	}
	else if (answerValueType.equals("correct in other unit")){
		answerAssessIndicators.put("valueCorrect", new java.lang.Integer(3));
	}
	else if (answerValueType.equals("correct in other unit wrong sign")){
		answerAssessIndicators.put("valueCorrect", new java.lang.Integer(4));
	}
	else if (answerValueType.equals("incorrect")){
		answerAssessIndicators.put("valueCorrect", new java.lang.Integer(0));
	}
	
	if (answerUnitType.equals("no unit")){
		answerAssessIndicators.put("unitCorrect", new java.lang.Integer(0));
	}
	else if (answerUnitType.equals("correct")){
		answerAssessIndicators.put("unitCorrect", new java.lang.Integer(1));
	}
	else if (answerUnitType.equals("incorrect but compatible")){
		answerAssessIndicators.put("unitCorrect", new java.lang.Integer(2));
	}
	else if (answerUnitType.equals("incorrect")){
		answerAssessIndicators.put("unitCorrect", new java.lang.Integer(3));
	}
	
	//How long did the student take completing this step (in seconds, rounded so it shows 1 decimal)
	var time = (System.currentTimeMillis() - timeStepStarted) / 1000;
	answerAssessIndicators.put("time", Math.round(time * 10) / 10);
	
	//How many measurements did the student make in this step
	answerAssessIndicators.put("numberMeasurements", new java.lang.Integer(measurements.length - measurementIndexStepStarted));
	
	var measurement = findMeasurement(answer);
	if (measurement != null){
		//The answer the student provided matches some measurmement they made
		//Note: we are not checking that it matches a measurement that they did DURING this specific step
		//      (maybe they got the answer in the step before and they wrote it down or something...)
		//      We are also assuming this was the measurement the student paid attention when copying the value
		//      It it not guaranteed, since more measurements could give the same value but could measure different things
		//      We are assuming this activity is simple enough that that won't happen.
		answerAssessIndicators.put("valueMatchesMeasurement", new java.lang.Integer(1));
		if (answerAssess.getAnswerType().equalsIgnoreCase(measurement.type)){
			//The multimeter was in the correct setting when measured
			answerAssessIndicators.put("multimeterSetting", new java.lang.Integer(1));
		}
		else{
			answerAssessIndicators.put("multimeterSetting", new java.lang.Integer(0));
		}		
		
		//Correct lead placement?
		//Give values of 0 (really bad), 1 (bad), 2 (not bad), 3 (good)
		//And take points off if any of the DMM leads are connected to 2 wires instead of
		//directly connected to the component -> 4 (good, but no ideal)
		var valLeadPlacement = -1;
		if (getCurrentAnswerType().equalsIgnoreCase("voltage")){
			//To measure voltage correctly, the leads have to placed in zone 1 and 2
			if (	 (measurement.extra.redLead == 1 && measurement.extra.blackLead == 2) ||
					 (measurement.extra.redLead == 2 && measurement.extra.blackLead == 1)){
				//Check if any lead is between wires
				if (measurement.extra.redLeadBetweenWires || measurement.extra.blackLeadBetweenWires){
					valLeadPlacement = 4;
				}
				else{
					valLeadPlacement = 3;
				}
			}
			else if ((measurement.extra.redLead == 1 && measurement.extra.blackLead == 3) ||
					 (measurement.extra.redLead == 3 && measurement.extra.blackLead == 1)){
				valLeadPlacement = 2;
			}
			else if ((measurement.extra.redLead == 2 && measurement.extra.blackLead == 3) ||
					 (measurement.extra.redLead == 3 && measurement.extra.blackLead == 2)){
				valLeadPlacement = 1;
			}
			else if ((measurement.extra.redLead == measurement.extra.blackLead)){
				valLeadPlacement = 0;
			}
		}
		else if (getCurrentAnswerType().equalsIgnoreCase("current")){
			//To measure voltage correctly, the leads have to placed in zone 2 and 3
			if (	 (measurement.extra.redLead == 2 && measurement.extra.blackLead == 3) ||
					 (measurement.extra.redLead == 3 && measurement.extra.blackLead == 2)){
				//Check if any lead is between wires
				if (measurement.extra.redLeadBetweenWires || measurement.extra.blackLeadBetweenWires){
					valLeadPlacement = 4;
				}
				else{
					valLeadPlacement = 3;
				}
			}
			else{
				valLeadPlacement = 0;
			}
		}
		else if (getCurrentAnswerType().equalsIgnoreCase("resistance")){
			//To measure voltage correctly, the leads have to placed in zone 1 and 2
			if (	 (measurement.extra.redLead == 1 && measurement.extra.blackLead == 2) ||
					 (measurement.extra.redLead == 2 && measurement.extra.blackLead == 1)){
				//Check if any lead is between wires
				if (measurement.extra.redLeadBetweenWires || measurement.extra.blackLeadBetweenWires){
					valLeadPlacement = 4;
				}
				else{
					valLeadPlacement = 3;
				}
			}
			else{
				valLeadPlacement = 0;
			}
		}
		answerAssessIndicators.put("leadPlacement", new java.lang.Integer(valLeadPlacement));
		//	
		
		//Circuit setting
		//FIXME: This is still temporary.
		//Right now it assumes that the circuit cannot be broken
		if (getCurrentAnswerType().equalsIgnoreCase("voltage")){
			answerAssessIndicators.put("circuitSetting", new java.lang.Integer(0));
			
			//Check that the resistor and battery are included
			if (measurement.extra.leadsConnected && 
					measurement.extra.targetResistorConnected && measurement.extra.batteryConnected){
				//Check that the circuit is closed
				//Assuming the only way to open it is by opening it the switch
				if (measurement.extra.switchConnected && measurement.extra.switchClosed){
					answerAssessIndicators.put("circuitSetting", new java.lang.Integer(1));
				}
			}
		}
		else if (getCurrentAnswerType().equalsIgnoreCase("current")){
			answerAssessIndicators.put("circuitSetting", new java.lang.Integer(0));

			//Check that the resistor and battery are included
			if (measurement.extra.leadsConnected && 
					measurement.extra.targetResistorConnected && measurement.extra.batteryConnected){
				//Check that the circuit is open
				//Assuming the only way to open it is by opening it the switch
				if (measurement.extra.switchConnected && !measurement.extra.switchClosed){
					answerAssessIndicators.put("circuitSetting", new java.lang.Integer(1));
				}
			}
		}
		else if (getCurrentAnswerType().equalsIgnoreCase("resistance")){
			answerAssessIndicators.put("circuitSetting", new java.lang.Integer(0));
			
			//Check that the resistor is included
			if (measurement.extra.leadsConnected && 
					measurement.extra.targetResistorConnected){
				//Check that the circuit is open
				//Assuming the only way to open it is by opening it the switch
				if (measurement.extra.switchConnected && !measurement.extra.switchClosed){
					answerAssessIndicators.put("circuitSetting", new java.lang.Integer(1));
				}
			}
		}
		//
	}
	else{
		answerAssessIndicators.put("valueMatchesMeasurement", new java.lang.Integer(0));
		// When the value doesn't match a measurement, the following indicators are N/A
		answerAssessIndicators.put("multimeterSetting", new java.lang.Integer(-2));
		answerAssessIndicators.put("leadPlacement", new java.lang.Integer(-2));
		answerAssessIndicators.put("circuitSetting", new java.lang.Integer(-2));
	}
	
	//Whether the student blew up the DMM or not
	if (multimeterBrokenStepCount > 0){
		answerAssessIndicators.put("brokenDMM", new java.lang.Integer(1));
	}
	else{
		answerAssessIndicators.put("brokenDMM", new java.lang.Integer(0));
	}
		
	otAssessment.getAnswers().add(answerAssess);
}

/**
 * From all the measurements made, finds the first one that has a value close enough to 
 * the value provided (with a threshold, ignoring the sign and the unit) 
 * Also, consider unit conversion
 */
function findMeasurement(valueObj)
{
	var measurement = null;
	//Look in the last measurements first
	if (measurement == null){
		measurement = findMeasurementInRange(valueObj, measurementIndexStepStarted, measurements.length, true);
	}
	//Then look in the previous measurements
	if (measurement == null){
		measurement = findMeasurementInRange(valueObj, 0, measurementIndexStepStarted, true);
	}
	//Now compare just the value without paying attention to the units
	if (measurement == null){
		measurement = findMeasurementInRange(valueObj, 0, measurements.length, false);
	}
	
	return measurement;
}

function findMeasurementInRange(valueObj, startIndex, endIndex, bIncludeUnits)
{
	var measurementValueObj = otObjectService.createObject(OTUnitValue);
	
	//for (var i = startIndex; i < endIndex; i++){
	//Start at the end of the list (the last measurement is the one more likely to be the one)
	for (var i = endIndex - 1; i >= startIndex; i--){
		var measurement = measurements[i];
		measurementValueObj.setValue(measurement.value);
		if (bIncludeUnits){
			measurementValueObj.setUnit(measurement.unit);
		}
		
		if (CAPAUnitUtil.compareValues(measurementValueObj, valueObj, true, true)){
			logInformation("Answer matches measurement "+i);
			return measurement;
		}
	}
	
	return null;
}

function calculateSolution()
{
	var valueObj;
	
	solutionObj = new Object();
	
	//Calculate current using battery voltage and total resistance
	valueObj = otObjectService.createObject(OTUnitValue);
	var current = circuitBattery.getVoltageDrop() / (targetResistor.getResistance() + circuitBattery.getResistance());
	valueObj.setValue(current);
	valueObj.setUnit("A");
	solutionObj.current = valueObj;
	//
	
	//Calculate voltage drop in the resistor using current and resistor's resistance
	valueObj = otObjectService.createObject(OTUnitValue);
	var voltage = current * targetResistor.getResistance();
	valueObj.setValue(voltage);
	valueObj.setUnit("V");
	solutionObj.voltage = valueObj;
	//
	
	//Resistance (we got it from the resistor)
	valueObj = otObjectService.createObject(OTUnitValue);
	valueObj.setValue(targetResistor.getResistance());
	valueObj.setUnit("Ohms");
	solutionObj.resistance = valueObj;
	//
	
	logInformation("Solution is:"+
		"  voltage = " + roundValue2(solutionObj.voltage.getValue()) + " " + solutionObj.voltage.getUnit() +
		"  current = " + roundValue2(solutionObj.current.getValue()) + " " + solutionObj.current.getUnit() +
		"  resistance = " + roundValue2(solutionObj.resistance.getValue()) + " " + solutionObj.resistance.getUnit());
}

/** Shows a message as feedback after submitting an answer */
function showSolution(answerValueType, answerUnitType, bShowNow)
{
	var solutionMsg = "";
	
	if (answerValueType.equals("correct")){
		if (answerUnitType.equals("no unit")){
			solutionMsg = "Correct but no units supplied.";
		}
		else if (answerUnitType.equals("correct")){
			solutionMsg = "Correct!";
		}
		else if (answerUnitType.equals("incorrect but compatible")){
			solutionMsg = "Correct numerically but unit supplied is incorrect.";
		}
		else if (answerUnitType.equals("incorrect")){
			solutionMsg = "Correct numerically but unit supplied is inappropriate (incompatible).";
		}
	}
	else if (answerValueType.equals("correct wrong sign")){
		if (answerUnitType.equals("no unit")){	
			solutionMsg = "Correct but wrong sign and no units supplied.";
		}
		else if (answerUnitType.equals("correct")){
			solutionMsg = "Correct but wrong sign";
		}
		else if (answerUnitType.equals("incorrect but compatible")){
			solutionMsg = "Correct numerically but wrong sign and unit supplied is incorrect.";
		}
		else if (answerUnitType.equals("incorrect")){
			solutionMsg = "Correct numerically but wrong sign and unit supplied is inappropriate (incompatible).";
		}
	}
	else if (answerValueType.equals("correct in other unit")){
		if (answerUnitType.equals("no unit")){
			solutionMsg = "Value is correct in other unit but no units supplied.";
		}
		else if (answerUnitType.equals("correct")){
			solutionMsg = "Value correct but not in conjunction with the unit supplied.";
		}
		else if (answerUnitType.equals("incorrect but compatible")){
			solutionMsg = "Value correct but not in conjunction with the unit supplied.";
		}
		else if (answerUnitType.equals("incorrect")){
			solutionMsg = "Value correct but unit supplied is inappropriate (incompatible).";
		}
	}
	else if (answerValueType.equals("correct in other unit wrong sign")){
		if (answerUnitType.equals("no unit")){
			solutionMsg = "Value is correct in other unit wrong sign but no units supplied.";
		}
		else if (answerUnitType.equals("correct")){
			solutionMsg = "Value correct in other unit wrong sign but not in conjunction with the unit supplied.";
		}
		else if (answerUnitType.equals("incorrect but compatible")){
			solutionMsg = "Value correct in other unit wrong sign but not in conjunction with the unit supplied.";
		}
		else if (answerUnitType.equals("incorrect")){
			solutionMsg = "Value correct in other unit wrong sign but unit supplied is inappropriate (incompatible).";
		}
	}
	else if (answerValueType.equals("incorrect")){
		if (answerUnitType.equals("no unit")){
			solutionMsg = "Incorrect value and no units supplied.";
		}
		else if (answerUnitType.equals("correct")){
			solutionMsg = "Incorrect value.";
		}
		else if (answerUnitType.equals("incorrect but compatible")){
			solutionMsg = "Incorrect value.";
		}
		else if (answerUnitType.equals("incorrect")){
			solutionMsg = "Incorrect value and unit supplied is inappropriate (incompatible).";
		}
	}

	//Show solution	
	var strPrefix = getCurrentAnswerType() + " answer: ";
	
	solutionMessage = solutionMessage + "<br/>" + strPrefix + solutionMsg;
	if (bShowNow){
		showSolutionMessage();
	}
	//

	var strMsg = "Answer Submitted (" + getCurrentAnswerType() + "): "+answerObj.getValue()+" "+answerObj.getUnit();
	strMsg = strMsg + "  (Value:" + answerValueType + ", Unit:" + answerUnitType +"): "
	strMsg = strMsg + solutionMsg
	logInformation(strMsg);
}

function getCurrentAnswerType()
{
	if (currentStep == 1){
		return "voltage"
	}
	else if (currentStep == 2){
		return "current"
	}
	else if (currentStep == 3){
		return "resistance"
	}
}

function getCurrentAnswerTypeLabel()
{
	if (currentStep == 1){
		return "1. Voltage"
	}
	else if (currentStep == 2){
		return "2. Current"
	}
	else if (currentStep == 3){
		return "3. Resistance"
	}
}

function showSolutionMessage()
{
	//Solution message is now overriden by the report button
	//var otxml = new OTXMLString(startHTML + solutionMessage + endHTML);
	//solutionText.setText(otxml);
	//
	
	OTCardContainerView.setCurrentCard(otInstAreaCards, "solutionText");
}

/** Show and Hide Help button */
function setupHelpButton()
{
	helpButton.setText("Show Help");
	
	var helpButtonHandler =
	{
		actionPerformed: function(evt)
		{
			helpEnabled = !helpEnabled;
	
			if(helpEnabled)
			{
				helpButton.setText("Hide Help");
				cckModule.setHelpEnabled(helpEnabled);
			}
			else
			{
				helpButton.setText("Show Help");
				cckModule.setHelpEnabled(helpEnabled);
			}
		}
	}
	
	var helpButtonListener = new ActionListener(helpButtonHandler);
	helpButton.addActionListener(helpButtonListener);
}

