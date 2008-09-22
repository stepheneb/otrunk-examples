/**
 * This is the script for the CAPA resistance activity.
 * It was copied from the original Pedagogica activity and modified to 
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
 * otCalculatorObject	(OTProgrammableCalculatorNotebook)			// OT Calculator-notebook object
 * calculatorButton		(JButton)					//Button that pops up the calculator
 * calculatorHelpAction (OTAction)					//Action to show the calculator help 
 * answerLabel			(JComponent)				//Text pane (inside of a scroll pane) with label
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

importClass(Packages.org.concord.otrunk.ui.swing.OTCardContainerView);
importClass(Packages.org.concord.otrunk.ui.OTText);
importClass(Packages.org.concord.framework.otrunk.view.OTActionContext);
importClass(Packages.org.concord.calculator.state.OTProgrammableCalculatorEventHandler);
importClass(Packages.org.concord.calculator.state.OTProgrammableCalculatorEvent);
importClass(Packages.org.concord.calculator.state.OTProgrammableCalculatorListener);

importClass(Packages.org.concord.otrunkcapa.rubric.OTAssessment);
importClass(Packages.org.concord.otrunkcapa.CAPAUnitUtil);

importClass(Packages.org.concord.framework.otrunk.view.OTUserListService)

/*
 * Variables from OTScriptContextHelper
 * ====================================
 * otContents
 * viewContext
 */
 
 /*
  * Variables from otml
  * ===================
  * otAssessment
  */


var otQuestion = otAssessment.getQuestions().get(0)

var activityName = "Measuring Resistance 3.0";

var startHTML = "<html><blockquote>";
var endHTML = "</blockquote></html>";

//CCK handy objects 
var cckModule = cckModelView.getModule();	// (CCKPiccoloModule)
var cckModel = cckModule.getCCKModel();		// (CCKModel)
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
var bCalculatorShow = false;	//Indicates whether the calculator has been showed or not
var bLogNotebook = false;		//Indicated whether the notebook entries will be logged after closing the activity

var previousMultimeterValue = Double.NaN;	// Value that stores the last multimeter measurement, to avoid repeated measurements
var previousMultimeterState = -1;			// Value

var aTolerance = 0.01;			// Tolerance for current
var vTolerance = 0.01;			// Tolerance for voltage

var helpEnabled = false;		// Help button ??

// Activity Variables
var targetResistor = null;		// (Branch) Resistor that needs to be solved by the user 
var circuitBattery = null;		// (Branch) Battery in the circuit
var measurements = [];			// Array of measurement objects
//

var calculatorEventHandler;		// (OTProgrammableCalculatorEventHandler)
var calculatorListener;
var answerObj;
var solutionObj;
var solutionMessage = "";

var activityInitialized;
var timeStepStarted = 0;
var activityDone = false;

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
	
	setupCalculatorListener();
	
	setupActivity();
    
	setupAsessmentLogging();

	initializationDone = true;
        
	return initializationDone;
}

function setupCalculatorListener()
{
	/*
	var calculatorHandler =
	{
		variableChanged : function(evt)
		{
			//Log when a variable gets a new value (dragged from notebook)
			//or when the user changes units
			if (evt.getOperation().equals(OTProgrammableCalculatorEvent.VariableEvent.OP_CHANGE_VALUE) ||
					evt.getOperation().equals(OTProgrammableCalculatorEvent.VariableEvent.OP_CHANGE_UNIT)){
				logInformation("Calculator - Variable " + evt.getDescription());
			}
		},
		
		constantChanged : function(evt)
		{
			//Log when a constant is added, changed or removed
			logInformation("Calculator - Constant " + evt.getDescription());
		},
		
		formulaChanged : function(evt)
		{
			//Log when a formula gets added, edited, removed 
			logInformation("Calculator - Formula  " + evt.getDescription());
		},
		
		resultChanged : function (evt)
		{
			//Log when a formula result gets a value
			logInformation("Calculator - Formula Result " + evt.getDescription());
		}
	}

	calculatorListener = new OTProgrammableCalculatorListener(calculatorHandler);	
	
	calculatorEventHandler = new OTProgrammableCalculatorEventHandler(otCalculatorObject);//, controllerService);
	calculatorEventHandler.setCalculator(otCalculatorObject.getCalculator());
	
	calculatorEventHandler.addCalculatorListener(calculatorListener);
	
	var otHandler =
	{
		//Called when the user selects a value in the calculator window
		stateChanged:function(evt)
		{
			//System.out.println("ot change: "+evt.getDescription());
			if (evt.getProperty().equals("selectedAnswer")){
				answerObj = evt.getValue();
				if (answerObj != null){
					var val = answerObj.getValue();
					if (!Float.isNaN(val)){
						val = roundValue(val);
						var txtValue = val + " " + answerObj.getUnit();
						answerBox.setText(txtValue);
						
						//TODO: Close the calculator window
					}
				}
			}
		}
	}
	var otListener = new OTChangeListener(otHandler);
	answerChooser.addOTChangeListener(otListener);
	*/
	
	var calculatorButtonHandler =
	{
		actionPerformed : function(evt)
		{
		    showCalculatorHelp();
		}
	}
	var calculatorButtonListener = new ActionListener(calculatorButtonHandler);
	calculatorButton.addActionListener(calculatorButtonListener);
}

/**
 * This function is called when the view is closed, just before the script object is destroyed
 */
function save()
{
	//Delete the notebook data because it's too big
	if (!bLogNotebook){
		deleteCalculatorAndNotebookData();
	}
	//

	System.out.println("-------------------------- save--------------------------------");
	
	//Save state variables
	saveStateVariable("initialSetupDone", new java.lang.Boolean(true));	//Marks that the initial setup is done
	saveStateVariable("activityDone", new java.lang.Boolean(activityDone));	//Marks if the activity was done
	saveStateVariable("resistorResistance", new java.lang.Float(targetResistor.getResistance()));	//Saves the resistance
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
//	answerBox.setEditable(false);
}

/** 
 * Specific things to set up in this activity. 
 * Checks if the activity has been loaded or if it's run for the first time 
 */
function setupActivity()
{
	//Disable ohmmeter
	cckMultimeter.setStateDisabled(MultimeterModel.OHMMETER_STATE);
	//
	
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
	
	//Record start time
	timeStepStarted = System.currentTimeMillis();
	
	answerBox.setText("");
	unitChoice.setCurrentChoice(emptyUnitChoice);
	
	answerObj = null;
	reportButton.setVisible(false);

	deleteCalculatorAndNotebookData();

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
	timeStepStarted = System.currentTimeMillis();
	multimeterBrokenStepCount = 0;
	
	//Load state variables
	var resVal = getStateVariable("resistorResistance").doubleValue();
	targetResistor.setResistance(resVal);
	
	logInformation("The target resistor's resistance is " + targetResistor.getResistance() + " ohms");	
		
	return true;
}

function getLogFilename()
{
	return "capa_resistance3_activity_log";
}

/** Initializes logging in the otContents section */
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
		
		otAssessment.setTime(ms);			
		otAssessment.setUserName(userName);
		
		//Create assessment object

		otAssessment.setLabel("resistance");
		otContents.add(otContents.size() - 1, otAssessment);
	}
	else{
		//If the activity was already run, take the last assessment object, copy it and continue it
		var otLastAssessment = null;
		for (var i = otContents.size() - 1; i >= 0; i--){
			var obj = otContents.get(i);
			if (obj instanceof OTAssessment){
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

function setupApparatusPanel()
{
	//Listener for the apparatus panel size changes. Not sure what for
	var panelHandler =
	{
		componentResized: function(event)
		{
			//System.out.println(apparatusPanel.getSize() + " is the size of the apparatus panel after change");
		}
	};
	var panelListener = new ComponentListener(panelHandler);
	apparatusPanel.addComponentListener(panelListener);
	//System.out.println(apparatusPanel.getSize() + " is the size of the apparatus panel at initialization");
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
	s += "correctVoltageMeasurement: " + e.correctVoltageMeasurement + ", ";
	s += "correctCurrentMeasurement: " + e.correctCurrentMeasurement + ", ";	
	s += "brokenDMM: " + e.brokenDMM + "}";
	return s;			
}

function setupMultimeter()
{	
	// cckModule.setWiggleMeVisible(false);	//this method doesn't exist anymore in cck
	cckModel.setInternalResistanceOn(true);

	var multimeterListener = new MultimeterModel.Listener() 
	{
		//The way this works now is assuming that this function gets called when the multimeter gets a measurement
		multimeterChanged: function()
		{				
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
					units = units + "Ω";
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
				
				//Analyze if measurement is useful
				analyzeMeasurement(type, roundedValue, units, extra);
				
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

	cckMultimeter.addListener(multimeterListener);

}// end of setupMultimeter()

function analyzeMeasurement(type, roundedValue, unit, extra)
{
	//Check if the measurement is useful for what we need
	var valueObj = otObjectService.createObject(OTUnitValue);
	valueObj.setValue(roundedValue);
	valueObj.setUnit(unit);
	
	//Check if it matches the voltage
	if (CAPAUnitUtil.compareValues(solutionObj.voltage, valueObj, true, false)){
		extra.correctVoltageMeasurement = true;
	}
	else{
		extra.correctVoltageMeasurement = false;
	}
	//Check if it matches the current
	if (CAPAUnitUtil.compareValues(solutionObj.current, valueObj, true, false)){
		extra.correctCurrentMeasurement = true;
	}
	else{
		extra.correctCurrentMeasurement = false;
	}
}

function showFirstMeasurementMessage()
{
	if (firstMeasurement)
	{
		firstMeasurement = false;
		OTCardContainerView.setCurrentCard(otInstAreaCards, "firstMeasurementText");
	}
}

function showFirstJunctionMessage()
{
	if(firstJunctionsConnected)
	{
		firstJunctionsConnected = false;
//		OTCardContainerView.setCurrentCard(otInstAreaCards, "firstJunctionText");
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
			if(typeName.equals("Resistor"))
			{
//				var menuComponent = circuitNode.getBranchNode(branch).getMenu();
//				var menuItems = menuComponent.getSubElements();
				
//				menuItems[0].setEnabled(false);
//				menuItems[1].setEnabled(false);
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

/** Creates the initial resistor for this activity */
function createResistor()
{
	var resistorLength = 1.7 * cckModule.getCCKModel().RESISTOR_DIMENSION.getLength();
	var resistorHeight = 1.7 * cckModule.getCCKModel().RESISTOR_DIMENSION.getHeight();
	var x1 = 4.5;
	var y1 = 2;
	var x2 = x1 + resistorLength;
	var y2 = y1;
	var randomGen = new java.util.Random;
	var random = (randomGen.nextInt(20) * 5) + 5;

	startJunction = new Junction(x1, y1);
	endJunction = new Junction(x2, y2);

	var newBranch = new Resistor(cckCircuit.getKirkhoffListener(), startJunction, endJunction, resistorLength, resistorHeight);
	newBranch.setResistance(java.lang.Double(random));
	newBranch.setVisibleColorBands(false);
	// newBranch.setMovable(true);
	newBranch.setName("#Ringless Resistor");
	
	cckCircuit.addBranch(newBranch);

	//Disable the pop up menu
	newBranch.setMenuEnabled(false);

	logInformation("The target Resistor's resistance is " + newBranch.getResistance() + " ohms");

	return newBranch;
	
}// end of createResistor()

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

function deleteCalculatorAndNotebookData()
{
	//Notebook
	otNotebookObject.setCurrentMeasurement(null);
	var list = otNotebookObject.getEntries(); //OTObjectList
	list.removeAll();
	
	//Calculator
	var calc = otCalculatorObject.getCalculator();
	list = calc.getFormulas();
	if (list != null){
		list.setCurrentExpression(null);
		list.getExpressions().removeAll();
	}
	list = calc.getConstants();
	if (list != null){
		list.setCurrentSymbol(null);
		list.getSymbols().removeAll();
	}
	list = calc.getVariables();
	if (list != null){
		list.setCurrentSymbol(null);
		list.getSymbols().removeAll();
	}
	list = calc.getResultValues();
	if (list != null){
		list.setCurrentSymbol(null);
		list.getSymbols().removeAll();
	}
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
	/////
	//Get answer
	//The answer is at: 
	//answerBox(JTextField)
	//unitChoice(OTChoice)
	//if (answerObj == null) return;
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
	
	otQuestion.setInput(answerObj)
	
	/////
	//Correct answer is at
	//solutionObj.resistance
	/////

	checkAnswerValue(solutionObj.resistance);
	
	endActivity();
}
	
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
	
	var tolerance = solutionObj.tolerance * 2;
	if (tolerance == 0){
		tolerance = CAPAUnitUtil.getAppropriateTolerance(value, correctValue);
	}
	System.out.println("tolerance: "+tolerance);
	
/*	if (unit.equalsIgnoreCase(correctAnswer.getUnit())){
		if (CAPAUnitUtil.equalWithTolerance(answerObj.getValue(), 
				correctAnswer.getValue(), tolerance)){
			//Answer in the same units as correct answer
			answerValueType = "correct";
			answerUnitType = "correct";
		}
	}
*/
	
	if (CAPAUnitUtil.compareValues(answerObj, correctAnswer, false, false, tolerance)){
		//Answer might be given in different units but still correct
		answerValueType = "correct";
		answerUnitType = "correct";
	}
	else if (CAPAUnitUtil.compareValues(answerObj, correctAnswer, true, false, tolerance)){
		//Answer considered correct but wrong sign
		//Answer might be given in different units but still correct 
		answerValueType = "correct wrong sign";
		answerUnitType = "correct";
	}
	else if (CAPAUnitUtil.compareValues(answerObj, correctAnswer, false, true, tolerance)){
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
	else if (CAPAUnitUtil.compareValues(answerObj, correctAnswer, true, true, tolerance)){
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
	answerLabel.setVisible(false);
	OTCardContainerView.setCurrentCard(otInfoAreaCards, "endText");
	showSolutionMessage();
	
	reportButton.setVisible(true);
	
	//Log measurements
	logMeasurements();
}

function logAnswerAssessment(answer, correctAnswer, answerValueType, answerUnitType)
{
	var answerAssess = otAssessment;
		
	var answerAssessIndicators = answerAssess.getIndicatorValues();
	
	answerAssess.setNotes("Answer submitted: " + 
		answer.getValue() + " " + answer.getUnit() + ". Correct Answer: " + 
		correctAnswer.getValue() + " " + correctAnswer.getUnit());
	
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
	answerAssessIndicators.put("numberMeasurements", new java.lang.Integer(measurements.length));
	
	//Check whether the student ever measured the voltage or the current correctly
	//I calculate the number of all voltage and current measurements even though it's not necessary (just in case)
	var numberVoltageMeasurements = 0;
	var numberGoodVoltageMeasurements = 0;
	var numberCurrentMeasurements = 0;
	var numberGoodCurrentMeasurements = 0;
	for (var i=0; i<measurements.length; i++){
		var m = measurements[i];
		
		if (m.type.equals("voltage")){
			//The student measured voltage
			numberVoltageMeasurements++;
		}
		if (m.extra.correctVoltageMeasurement){
			//The student measured voltage CORRECTLY at least once
			numberGoodVoltageMeasurements++;
		}

		if (m.type.equals("current")){
			//The student measured current
			numberCurrentMeasurements++;
		}
		if (m.extra.correctCurrentMeasurement){
			//The student measured current CORRECTLY at least once
			numberGoodCurrentMeasurements++;
		}
	}
	if (numberGoodVoltageMeasurements > 0){
		answerAssessIndicators.put("voltageMeasurement", new java.lang.Integer(1));	//Voltage was measured correctly at least once
	}
	else if (numberVoltageMeasurements > 0){
		answerAssessIndicators.put("voltageMeasurement", new java.lang.Integer(2));	//Voltage was measured but incorrectly
	}
	else{
		answerAssessIndicators.put("voltageMeasurement", new java.lang.Integer(0));	//Voltage was never measured
	}
	if (numberGoodCurrentMeasurements > 0){
		answerAssessIndicators.put("currentMeasurement", new java.lang.Integer(1));	//Current was measured correctly at least once
	}
	else if (numberCurrentMeasurements > 0){
		answerAssessIndicators.put("currentMeasurement", new java.lang.Integer(2));	//Current was measured but incorrectly
	}
	else{
		answerAssessIndicators.put("currentMeasurement", new java.lang.Integer(0));	//Current was never measured
	}
	//
	
	//Whether the student blew up the DMM or not
	if (multimeterBrokenStepCount > 0){
		answerAssessIndicators.put("brokenDMM", new java.lang.Integer(1));
	}
	else{
		answerAssessIndicators.put("brokenDMM", new java.lang.Integer(0));
	}
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
	
	otQuestion.setCorrectAnswer(valueObj)
	
	//Calculate the resistance from the voltage and current rounded (like the multimeter does)
	solutionObj.tolerance = 0;
	var v = solutionObj.voltage.getValue();
	if (Math.abs(v) > 1){
		var c = solutionObj.current.getValue();
		if (Math.abs(c) < 1){
			c = c * 1000;
			var r = roundValue(v) / roundValue(c);
			r = r * 1000;
			//System.out.println("v: "+v+" c: "+c+" r: "+r);
			solutionObj.tolerance = Math.abs(solutionObj.resistance.getValue() - r);
			//System.out.println("solutionObj.tolerance: "+solutionObj.tolerance);
		}
	}
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
			solutionMsg = "Correct numerically but unit supplied was not ohms.";
		}
		else if (answerUnitType.equals("incorrect")){
			solutionMsg = "Correct numerically but inappropriate units supplied.";
		}
	}
	else if (answerValueType.equals("correct in other unit")){
		if (answerUnitType.equals("no unit")){
			solutionMsg = "Correct but value not in ohms and no units supplied.";
		}
		else if (answerUnitType.equals("correct")){
			solutionMsg = "Correct but not in ohms.";
		}
		else if (answerUnitType.equals("incorrect but compatible")){
			solutionMsg = "Correct but value not in ohms.";
		}
		else if (answerUnitType.equals("incorrect")){
			solutionMsg = "Correct but value not in ohms and inappropriate unit supplied.";
		}
	}
	else if (answerValueType.equals("incorrect")){
		if (answerUnitType.equals("no unit")){
			solutionMsg = "Incorrect and no units supplied.";
		}
		else if (answerUnitType.equals("correct")){
			solutionMsg = "Incorrect value.";
		}
		else if (answerUnitType.equals("incorrect but compatible")){
			solutionMsg = "Incorrect and not in ohms.";
		}
		else if (answerUnitType.equals("incorrect")){
			solutionMsg = "Incorrect and inappropriate units supplied.";
		}
	}

	//Show solution	
	solutionMessage = solutionMessage + "<br/>" + solutionMsg;
	if (bShowNow){
		showSolutionMessage();
	}
	
	OTCardContainerView.setCurrentCard(otInfoAreaCards, "endText");

	var strMsg = "Answer Submitted: "+answerObj.getValue()+" "+answerObj.getUnit();
	strMsg = strMsg + "  (Value:" + answerValueType + ", Unit:" + answerUnitType +"): "
	strMsg = strMsg + solutionMsg
	logInformation(strMsg);
}

function showSolutionMessage()
{
	//Solution message is now overriden by the report button
	//var otxml = new OTXMLString(startHTML + solutionMessage + endHTML);
	//solutionText.setText(otxml);
	//
	
	//There is no otInstAreaCards to show, and the solution message is empty
	//OTCardContainerView.setCurrentCard(otInstAreaCards, "solutionText");
}

function showCalculatorHelp()
{
	if (bCalculatorShow) return;
	
	var actionContextHandler =
	{
		getViewContext : function()
		{
			return viewContext;
		}
	}
	var actionContextImpl = new OTActionContext(actionContextHandler); 
	calculatorHelpAction.doAction(actionContextImpl);
	bCalculatorShow = true;
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

/** Convenience mathod (copied from Pedagogica) to substitute variables on a string */
function substitute(text, map) 
{
	var prefix = "$";
	var suffix = "$";
	var keys = map.keySet().iterator();
	
	while (keys.hasNext())
	{
		var variable = keys.next();
		var value = map.get(variable);
		
		//System.out.println("variable map: "+ variable+": "+value);
		
		text = replaceAll(new Packages.java.lang.String(text), new Packages.java.lang.String(prefix + variable + suffix), new Packages.java.lang.String(value));
	}
    return text;
}

/** Convenience mathod (copied from Pedagogica) to substitute variables on a string */
function replaceAll(text, searchValue, replaceValue)
{
	if (replaceValue.indexOf(searchValue) > -1) return text;
		
	var n = searchValue.length();
	for (var i = text.indexOf(searchValue); i > -1; i = text.indexOf(searchValue, i + 1))
	{
		text = text.substring(0, i) + replaceValue + text.substring(i + n);
	}
	return text;
}
