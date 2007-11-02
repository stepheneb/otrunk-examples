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
 * otInfoAreaCards		(OTCardContainer)			// OT card container for the information area of the activity. Used to switch between messages by switching to a different card.
 * submitAnswerButton	(JButton) 					// Actual swing button used to submit the answer
 * answerBox			(JTextArea)					// Swing text component where the user writes the answer
 * solutionText			(OTTextPane)				// OT Text Pane that holds the text with the solution
 * otCalculatorObject	(OTProgrammableCalculatorNotebook)			// OT Calculator-notebook object
 * answerChooser		(OTProgrammableCalculatorResultChooser)		//Allows the user to choose the answer 
 * calculatorButton		(JButton)					//Button that pops up the calculator
 * calculatorHelpAction (OTAction)					//Action to show the calculator help 
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
var shortCircuitCounter = 0;	// How many times has the user caused a short circuit
//

var initializationDone = true;	// Whether the init() function is done or not
var shortCircuit = false;		// Flag used to determine if the user has caused a short circuit in THIS current change  
var solverFinishedOnce = false;	// ?
var lastMMStateViable = false;	// ?
var logFile;					// Used for logging information
var xmlText;					// OTXMLText object used for logging information
var firstJunctionsConnected = true;	//Used to put up text the first time a junction is connected.
var firstMeasurement = true; 		//Used to put up text the first time a measurement is made.
var bCalculatorShow = false;	//Indicates whether the calculator has been showed or not

var previousMultimeterValue = Double.NaN;	// Value that stores the last multimeter measurement, to avoid repeated measurements
var previousMultimeterState = -1;			// Value

var aTolerance = 0.01;			// Tolerance for current
var vTolerance = 0.01;			// Tolerance for voltage

var helpEnabled = false;		// Help button ??

// Activity Variables
var targetResistor = null;		// (Branch) Resistor that needs to be solved by the user 
var measurements = [];			// Array of measurement objects
//

var calculatorEventHandler;		// (OTProgrammableCalculatorEventHandler)
var calculatorListener;
var answerObj;

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
    
	initializationDone = true;
        
	return initializationDone;
}

function setupCalculatorListener()
{
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
	System.out.println("-------------------------- save--------------------------------");
	
	//Save state variables
	saveStateVariable("initialSetupDone", new java.lang.Boolean(true));	//Marks that the initial setup is done
	saveStateVariable("shortCircuitCounter", new java.lang.Integer(shortCircuitCounter));
	//
	
	//Log measurements
	logMeasurements();
	//
	
	finalizeLogging();
}

function getStateVariable(name)
{
	return scriptState.get(name);
}

function saveStateVariable(name, value)
{
	scriptState.put(name, value);
}

/** Initial set up if the GUI. This stuff eventually could be moved to the otml file */
function setupGUI()
{
	answerBox.setBackground(new Color(1,1,0.8));
	answerBox.setEditable(false);
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
	var bInitialSetupDone = getStateVariable("initialSetupDone");
	if (bInitialSetupDone == null) bInitialSetupDone = false;
	else bInitialSetupDone = true;
	
	var bLoadedDone = false;
	
	if (bInitialSetupDone){
	
		bLoadedDone = setupActivityLoaded();
	}
	
	if (!bInitialSetupDone || !bLoadedDone){
	
		setupActivityInitial();
	}
}

/** 
 * Sets up this specific activity
 * This function will be called only when the activity is run for the first time 
 */
function setupActivityInitial()
{
	//Create the resistor that the user has to solve
	targetResistor = createResistor();

	//Show initial text
	OTCardContainerView.setCurrentCard(otInfoAreaCards, "introText");
	
	answerBox.setText("");
	answerObj = null;
	
	deleteCalculatorAndNotebookData();
}

/** 
 * Sets up this specific activity
 * This function will be called only when the activity has already been played, so it needs
 * to load its state in order to be initialized
 */
function setupActivityLoaded()
{
	//Load state variables
	var val = getStateVariable("shortCircuitCounter");
	shortCircuitCounter = val.intValue();
	System.out.println("Number of short circuits: "+shortCircuitCounter);
	//
	
	//Find the target resistor in the saved circuit
	targetResistor = findBranch("#Ringless Resistor");
	if (targetResistor == null){	
		System.err.println("Error, target resistor not found!");
		System.err.println("Error: initialSetupDone was set, but circuit could not be loaded. It will be recreated from scratch");
		return false;
	}
		
	return true;
}

function getLogFilename()
{
	return "capa_resistance_activity_log";
}

/** Creates a text file in the Desktop with logging information. File is called studentName.txt */
function initLogging()
{
	var studentName = getLogFilename();
	var desktop = new File(System.getProperty("user.home") + "/Desktop");
	var outputFile = new File(desktop, studentName + ".txt");
	logFile = new PrintWriter(new FileOutputStream(outputFile));
	// logFile.println(studentName + "\'s log");
	
	//Create an OTText
	xmlText = otObjectService.createObject(OTText);
	xmlText.setText("CAPA - Measuring Resistance 2.0\n");
	//Put logging information into the otContents of the script object
	otContents.add(xmlText);
	
	logInformation("Activity started");
}

function logInformation(info)
{
	info = (new java.util.Date()).toString() + " - " + info;
	//System.out.println("LOG --- " + info);
	logFile.println(info);
	xmlText.setText(xmlText.getText() + info + "\n");
}

function finalizeLogging()
{
	logInformation("Activity finished");
	
	logFile.close();	
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
	logInformation("Measurements Summary - "+measurements.length+" measurements");
	for (var i=0; i<measurements.length; i++){
		var m = measurements[i];
		strLog = "type=" + m.type + " value=" + m.value + " unit=" + m.unit;
		if (m.extra != null){
			strLog = strLog + " " + m.extra.toSource();
		}
		logInformation(strLog); 
	}
}

function setupMultimeter()
{	
	// cckModule.setWiggleMeVisible(false);	//this method doesn't exist anymore in cck
	cckModel.setInternalResistanceOn(false);

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
				
				//Record the measurement, including the voltage and current of the target resistor
				var m = addMeasurement(type, roundedValue, units, {'resistorVoltage':targetResistorVoltageString, 'resistorCurrent':targetResistorCurrentString} );
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

function showFirstMeasurementMessage()
{
	if (firstMeasurement)
	{
		firstMeasurement = false;
		OTCardContainerView.setCurrentCard(otInfoAreaCards, "firstMeasurementText");
	}
}

function showFirstJunctionMessage()
{
	if(firstJunctionsConnected)
	{
		firstJunctionsConnected = false;
		OTCardContainerView.setCurrentCard(otInfoAreaCards, "firstJunctionText");
	}
}

/**
 * Sets up the circuit listener which will handle adding branches, connect and disconnect junctions, etc
 * It will also add a current and voltage listener to the resistor or multimeter
 */
function setupCircuitListener()
{
	//the current and voltage listener is added to the resistor or to the multimeter
	var currentVoltListener = new CurrentVoltListener() 
	{
		/**
		* This function is called every time the current or voltage changes. 
		* Within the function, there are statements which filter out 
		* insignificant changes (on the order of variables vTolerance and aTolerance) 
		* to the current or voltage, as the values change slightly when a branch is moved. 
		* If the changes are signficant, they are printed.
		*/	
		currentOrVoltageChanged: function(branch)
		{
			var branchVoltage = branch.getVoltageDrop();
			var branchCurrent = branch.getCurrent();
			
			logInformation("A voltage of " + branchVoltage + " with a current of " + branchCurrent + " is flowing through " + branch.getName());

			solverFinishedOnce = false;

			//Detect shortcircuit
			if(Math.abs(branchCurrent) > 10 && shortCircuit == false)
			{
				var warningDialog = new JOptionPane();
				var shortCircuitStr = "shortCircuitStr";
				warningDialog.showMessageDialog(frame, shortCircuitStr, "", JOptionPane.WARNING_MESSAGE);
				shortCircuit = true;
				shortCircuitCounter++;
				System.out.println("++++ SHORT CIRCUIT ++++");
			}
			else if(!(Math.abs(branchCurrent) > Math.abs(branchVoltage) + 1))
			{
				shortCircuit = false;			
			}
			//
		}
	}

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

/** Creates the initial resistorfor this activity */
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
	//The answer is at: 
	//answerObj (OTValueUnit) and answerBox(JTextField)
	if (answerObj == null) return;
	
	//Check value
	var answerValueType = "";
	var value = answerObj.getValue();
	if (MathUtil.isApproxEqual(value, targetResistor.getResistance(), 0.1)){
		answerValueType = "correct"
	}
	else{
		if (MathUtil.isApproxEqual(value*1000, targetResistor.getResistance(), 0.1) ||
				MathUtil.isApproxEqual(value/1000, targetResistor.getResistance(), 0.1)){
			answerValueType = "correct in other unit"
		}
		else{
			answerType = 2;
			answerValueType = "incorrect"
		}
	}
	//
	//Check unit
	var answerUnitType = "";
	var unit = answerObj.getUnit();
	if (unit == null || unit.equals("")){
		answerUnitType = "no unit"
	}
	else if (unit.equalsIgnoreCase("ohms")){
		answerUnitType = "correct"
	}
	else if (unit.equalsIgnoreCase("mohms") || unit.equalsIgnoreCase("miliohms") ||
			unit.equalsIgnoreCase("kohms") || unit.equalsIgnoreCase("kiloohms")){
		answerUnitType = "incorrect but other good unit"
	}
	else {
		answerUnitType = "incorrect"
	}
	//
		
	showSolution(answerValueType, answerUnitType);
}

/** Shows a message as feedback after submitting an answer */
function showSolution(answerValueType, answerUnitType)
{
	var solutionMsg = "";
	var shortCircuitMsg = "";
	
	if (answerValueType.equals("correct")){
		if (answerUnitType.equals("no unit")){
			solutionMsg = "Correct but no units supplied.";
		}
		else if (answerUnitType.equals("correct")){
			solutionMsg = "Correct!";
		}
		else if (answerUnitType.equals("incorrect but other good unit")){
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
		else if (answerUnitType.equals("incorrect but other good unit")){
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
		else if (answerUnitType.equals("incorrect but other good unit")){
			solutionMsg = "Incorrect and not in ohms.";
		}
		else if (answerUnitType.equals("incorrect")){
			solutionMsg = "Incorrect and inappropriate units supplied.";
		}
	}

	//Show solution	
	var otxml = new OTXMLString(startHTML + solutionMsg + shortCircuitMsg + endHTML);
	solutionText.setText(otxml);
	OTCardContainerView.setCurrentCard(otInfoAreaCards, "solutionText");
	//

	var strMsg = "Answer Submitted: "+answerBox.getText();
	strMsg = strMsg + "  (Value:" + answerValueType + ", Unit:" + answerUnitType +"): "
	strMsg = strMsg + solutionMsg
	logInformation(strMsg);
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
