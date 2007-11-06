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
importClass(Packages.org.concord.otrunkcapa.OTMultimeterAnswerAssessment);

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

var previousMultimeterValue = Double.NaN;	// Value that stores the last multimeter measurement, to avoid repeated measurements
var previousMultimeterState = -1;			// Value

var aTolerance = 0.01;			// Tolerance for current
var vTolerance = 0.01;			// Tolerance for voltage

var helpEnabled = false;		// Help button ??

// Activity Variables
var targetResistor = null;		// (Branch) Resistor that needs to be solved by the user 
var measurements = [];			// Array of measurement objects
var answerObj;
var solutionObj;
var battery = null;				// (Branch) Battery 
var solutionMessage = "";

var currentStep = 1;
var lastStep = 3;
var timeStepStarted;
var measurementIndexStepStarted;
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
	answerBox.setBackground(new Color(1,1,0.7));
	
	reportButton.setVisible(false);
}

/** 
 * Specific things to set up in this activity. 
 * Checks if the activity has been loaded or if it's run for the first time 
 */
function setupActivity()
{
	//Find out if the activity has been run already
	var bInitialSetupDone = getStateVariable("initialSetupDone");
	if (bInitialSetupDone == null) bInitialSetupDone = false;
	else bInitialSetupDone = true;
	
	var bLoadedDone = false;
	
	if (bInitialSetupDone){
	
		bLoadedDone = setupActivityLoaded();
	}
	
	//Find the target resistor in the circuit
	targetResistor = findBranch("#Ringless Resistor");
	if (targetResistor == null){	
		System.err.println("Error, target resistor not found!");
		System.err.println("Error: initialSetupDone was set, but circuit could not be loaded.");
		return;
	}
	//
	//Find the battery in the circuit
	battery = findBranch("#Battery");
	if (battery == null){	
		System.err.println("Error, battery not found!");
		return;
	}
	//	
	
	if (!bInitialSetupDone || !bLoadedDone){
	
		setupActivityInitial();
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
	showInstructions(currentStep);
	
	answerBox.setText("");
	answerObj = null;
	
	deleteNotebookData();

	//Randomize the resistance
	var randomGen = new java.util.Random;
	var random = (randomGen.nextInt(20) * 5) + 5;

	targetResistor.setResistance(java.lang.Double(random));

	logInformation("The target resistor's resistance is " + targetResistor.getResistance() + " ohms");	
}

/** 
 * Sets up this specific activity
 * This function will be called only when the activity has already been played, so it needs
 * to load its state in order to be initialized
 */
function setupActivityLoaded()
{
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
	System.out.println("LOG --- " + info);
	logFile.println(info);
	xmlText.setText(xmlText.getText() + info + "\n");
}

function finalizeLogging()
{
	logInformation("Activity finished");
	
	logFile.close();	
}

function showInstructions(step)
{
	timeStepStarted = System.currentTimeMillis();
	measurementIndexStepStarted = measurements.length;
	var strCardID = "step" + step + "Text";
	OTCardContainerView.setCurrentCard(otInfoAreaCards, strCardID);
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
//		OTCardContainerView.setCurrentCard(otInfoAreaCards, "firstJunctionText");
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
	/////
	//Get answer
	//The answer is at: 
	//answerBox(JTextField)
	var strAnswer = answerBox.getText();
	//Separate the value from the unit (space separator)
	var answerParts = strAnswer.split(" ", 2);
	var val = 0;
	var unit = answerParts[1];
	if (unit == undefined){
		unit = "";
	}
	try{
		val = Float.valueOf(answerParts[0]).floatValue();
	}
	catch(ex){
		JOptionPane.showMessageDialog(null, "Value invalid: " + strAnswer + ".\n" + "Please try again.");
		return;
	}
	
	answerObj = otObjectService.createObject(OTUnitValue);
	answerObj.setValue(val);
	answerObj.setUnit(unit);
	/////

	/////
	//Get correct answer
	var correctAnswerObj = null;
	if (getCurrentMeasurementType().equalsIgnoreCase("voltage")){
		correctAnswerObj = solutionObj.voltage;
	}
	else if (getCurrentMeasurementType().equalsIgnoreCase("current")){
		correctAnswerObj = solutionObj.current;
	}
	else if (getCurrentMeasurementType().equalsIgnoreCase("resistance")){
		correctAnswerObj = solutionObj.resistance;
	}
	/////

	checkAnswerValue(answerObj, correctAnswerObj);

	currentStep++;
	if (currentStep <= lastStep){
		showInstructions(currentStep);
		return;
	}
	
	//End of the activity
	endActivity();
}

/** Checks the answer and creates messages according to the answer submitted */
function checkAnswerValue(answer, correctAnswer)
{
	if (answer == null || correctAnswer == null) return;
	
	System.out.println("Checking answer " + answer.getValue() + " " + answer.getUnit() +
		"    Correct answer is " + correctAnswer.getValue() + " " + correctAnswer.getUnit());
	
	//Check value
	var answerValueType = "";
	var value = answer.getValue();
	var correctValue = correctAnswer.getValue();
	if (MathUtil.isApproxEqual(value, correctValue, 0.1)){
		answerValueType = "correct"
	}
	else{
		if (correctValue != 0 && value != 0 && 
				(MathUtil.isApproxEqual(value*1000, correctValue, 0.1) ||
				MathUtil.isApproxEqual(value/1000, correctValue, 0.1))){
			answerValueType = "correct in other unit"
		}
		else{
			answerValueType = "incorrect"
		}
	}
	//
	//Check unit
	var answerUnitType = "";
	var unit = answer.getUnit();
	if (unit == null || unit.equals("")){
		answerUnitType = "no unit"
	}
	else if (unit.equalsIgnoreCase(correctAnswer.getUnit())){
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
		
	showSolution(answerValueType, answerUnitType, false);
	
	logAnswerAssessment(answer, correctAnswer, answerValueType, answerUnitType);
}

function endActivity()
{
	submitAnswerButton.setVisible(false);
	answerBox.setVisible(false);
	//OTCardContainerView.setCurrentCard(otInfoAreaCards, "endText");
	showSolutionMessage();
	
	reportButton.setVisible(true);
}

function logAnswerAssessment(answer, correctAnswer, answerValueType, answerUnitType)
{
	var answerAssess = otObjectService.createObject(OTMultimeterAnswerAssessment);
	
	answerAssess.setMeasurementType(getCurrentMeasurementType());
	answerAssess.setAnswerValue(answer);
	answerAssess.setCorrectValue(correctAnswer);
	
	if (answerValueType.equals("correct")){
		answerAssess.setValueCorrect(1);
	}
	else if (answerValueType.equals("correct in other unit")){
		answerAssess.setValueCorrect(2);
	}
	else if (answerValueType.equals("incorrect")){
		answerAssess.setValueCorrect(0);
	}
	if (answerUnitType.equals("no unit")){
		answerAssess.setUnitCorrect(0);
	}
	else if (answerUnitType.equals("correct")){
		answerAssess.setUnitCorrect(1);
	}
	else if (answerUnitType.equals("incorrect but other good unit")){
		answerAssess.setUnitCorrect(2);
	}
	else if (answerUnitType.equals("incorrect")){
		answerAssess.setUnitCorrect(3);
	}
	
	answerAssess.setTime((System.currentTimeMillis() - timeStepStarted)/1000);
	answerAssess.setNumberMeasurements(measurements.length - measurementIndexStepStarted);
	
	answerAssess.setMultimeterSetting(0);
	answerAssess.setValueMatchesMeasurement(0);
	var measurement = findMeasurement(answer);
	if (measurement != null){
	
		answerAssess.setValueMatchesMeasurement(1);
		if (answerAssess.getMeasurementType().equalsIgnoreCase(measurement.type)){
			answerAssess.setMultimeterSetting(1);
		}
	}
		
	otContents.add(answerAssess);
}

function findMeasurement(valueObj)
{
	for (var i = 0; i < measurements.length; i++){
		var measurement = measurements[i];
		if (MathUtil.isApproxEqual(measurement.value, valueObj.getValue(), 0.1)){
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
	var current = battery.getVoltageDrop() / (targetResistor.getResistance() + battery.getResistance());
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
	var strPrefix = getCurrentMeasurementType() + " answer: ";
	
	solutionMessage = solutionMessage + "<br/>" + strPrefix + solutionMsg + shortCircuitMsg;
	if (bShowNow){
		showSolutionMessage();
	}
	//

	var strMsg = "Answer Submitted: "+answerBox.getText();
	strMsg = strMsg + "  (Value:" + answerValueType + ", Unit:" + answerUnitType +"): "
	strMsg = strMsg + solutionMsg
	logInformation(strMsg);
}

function getCurrentMeasurementType()
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

function showSolutionMessage()
{
	var otxml = new OTXMLString(startHTML + solutionMessage + endHTML);
	solutionText.setText(otxml);
	OTCardContainerView.setCurrentCard(otInfoAreaCards, "solutionText");
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
