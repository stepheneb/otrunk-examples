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
 * OTCCKCAPAModelView 	cckModelView; 		// CCK model view object
 * JPanel 				apparatusPanel;		// Swing panel that contains the CCKPanel (useful to take the screenshot)
 * OTNotebook 			otNotebookObject;	// OT Notebook object to use to keep track of measurements
 * OTCardContainer 		otInfoAreaCards;	// OT card container for the information area of the activity. Used to switch between messages by switching to a different card.
 * JButton 				submitAnswerButton; // Actual swing button used to submit the answer
 * JTextArea 			answerBox;			// Swing text component where the user writes the answer
 * OTTextPane			solutionText;		// OT Text Pane that holds the text with the solution
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

var accuracyMessage = "<p> <font size=5 color=blue>Note: at the moment the digital multimeter doesn't report out voltages and currents to sufficient accuracy for you to be able to figure out the resistance to the nearest ohm. This will be corrected soon. For the moment, be aware that we are restricting our unknown resistance to be evenly divisible by 5. </font> </p>";
var branchAddedMsg = " added";
var endHTML = "</blockquote></html>";
var junctionA = " junction A";
var junctionB = " junction B";
var junctionsConnectedMsg = " connected to:";
var junctionsDisconMsg = " disconnected from each other.";
var notebookAnnouncement = "<p><font size='5'>You've connected the digital multimeter to the circuit. Remember, you can make it a voltmeter or an ammeter by turning the dial. If you're having trouble seeing it, you can make it bigger by right-clicking on it.</font></p>";
var shortCircuitMsg1 = "<p><font color=red size = 5>You shortcircuited the battery once.</font></p>";
var shortCircuitMsg2 = "<p><font color=red size = 5>You shortcircuited the battery twice. Shame on you!!</font></p>";
var shortCircuitMsg3 = "<p><font color=red size = 5>You shortcircuited the battery $shortCircuitCounter$ times.  OUCH!!</font></p>";
var shortCircuitStr = "SHORT CIRCUIT WARNING!!! Cut all power immediately!";
var solutionString = "";
var solutionString1 = "<p><font size=5>That's right! You measured the voltage drop across the resistor as $firstVoltmeterMeasurement$ at a time when the current through it was $firstAmmeterMeasurement$. Ohm's Law, solved for resistance, is R = V/I, where V is in volts and I is in amperes, so the resistance is $calculatedResistance$ ohms. </p>";
var solutionString2 = "<p><font size=5>That's not the right resistance, but you did make the right measurements.<br><br> You measured the current through the resistor as $firstAmmeterMeasurement$ at a time when the voltage drop across it was $firstVoltmeterMeasurement$. The ratio of those two numbers (in volts per ampere) is $calculatedResistance$ ohms, which is the resistance you were trying to measure. </p>";
var solutionString3 = "<p><font size=5> You got the right resistance, but you didn't do it the way I expected because you never measured the voltage across the resistor and the current through it.<br><br> <font color=red size=5>How did you get the right answer?</font> </p>";
var solutionString4 = "<p><font size=5> That's not the right answer, and you didn't make the right measurements. In order to figure out the resistance you need to measure the current through it and the voltage across it, and then use <font color=red>Ohm's Law</font>. </p>";
var startHTML = "<html><blockquote>";
var unitsNotReported = "<p><font size=5 color=red> You did not report the units (ohms) correctly in your answer. </font>";
var unitsReported = "<p> <font size=5 color=red> You reported the units (ohms) correctly in your answer. Well done! </font>";

var stringClass = Class.forName("java.lang.String");
var moduleClass = Class.forName("edu.colorado.phet.common_cck.application.Module");
var cckModule = cckModelView.getModule();	// CCKPiccoloModule
var cckModel = cckModule.getCCKModel();		// CCKModel
var circuitNode = cckModule.getCckSimulationPanel().getCircuitNode();

var disableMenus = true;
var multiMeterVisible = true;
var voltMeterVisible = false;
var initializationDone = true;
var application;
var shortCircuit = false;
var typeHash = new HashMap();
var branchInitCounter = 0;
var measurementCounter = 1;
var shortCircuitCounter = 0;
var solverFinishedOnce = false;
var lastMMStateViable = false;
var unitsGiven;
var logFile;	//Used for logging information
var previousValue = Double.NaN;

var firstJunctionsConnected = true; //Used to put up text the first time a junction is connected.
var firstMeasurement = true; //Used to put up text the first time a measurement is made.

var branchArray = new Object();  //This is an array of branchObjects, which store the properties of each branch.
var junctionArray = new Object(); //This is an array of all the branches connected to the indexed junction.
var branchDimensions = new Object();
var multimeterMeasurements = new Object();

var aTolerance = 0.01;
var vTolerance = 0.01;

//This handles variable substitution in string variables.
// var subst = new VariableSubstitution();
var substMap = new HashMap();

var branchDrag = [ "Add Wire", "Add Resistor", "Add Battery", "Add Light Bulb", "Add Switch" ];
var sourceList = new Vector();

var helpEnabled = false;

var myResistor = null;

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
		
	setupLogFile(getStudentName());

	setupMultimeter();	
	
	setupCircuitListener();
	
	setupAnswerButton();
	
    initializationDone = true;
    
    //FIXME: This should only be called when the activity is launched for the first time
    setupActivity();
    //
    
    return initializationDone;
}

/**
 * This function is called when the view is closed, just before the script object is destroyed
 */
function save()
{
	System.out.println("-------------------------- save--------------------------------");
	logFile.close();
}

/** Initial set up if the GUI. This stuff eventually could be moved to the otml file */
function setupGUI()
{
	answerBox.setBackground(Color.yellow);
}

/** This function will be called only when the activity is run for the first time */
function setupActivity()
{
	//Find out if the activity has been run already
	var bInitialSetupDone = scriptState.get("initialSetupDone");
	if (bInitialSetupDone == null) bInitialSetupDone = false;
	else bInitialSetupDone = true;
	
	if (!bInitialSetupDone){
		createResistor();
	}
	else{
	
	}
	
	//Save the state of the script marking that the initial setup is done
	scriptState.put("initialSetupDone", new Boolean(true));
}

function getStudentName()
{
	return "student";
	// FIXME: should handle this elsewhere		
	/* var allLetters = false;
	do
	{
		var studentName = new java.lang.String(JOptionPane.showInputDialog("Please enter your name"));
		if(studentName != null)
			if(studentName.matches("[a-zA-Z\\s]*"))
				allLetters = true;
	} while(!allLetters); */
	//
}

/** Creates a text file in the Desktop with logging information. File is called studentName.txt */
function setupLogFile(studentName)
{
	var desktop = new File(System.getProperty("user.home") + "/Desktop");
	var outputFile = new File(desktop, studentName + ".txt");
	logFile = new PrintWriter(new FileOutputStream(outputFile));
	// logFile.println(studentName + "\'s log");
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

function setupMultimeter()
{
	var multimeter = cckModule.getMultimeterModel();
	multimeter.setStateDisabled(MultimeterModel.OHMMETER_STATE);
	// cckModule.setWiggleMeVisible(false);	//this method doesn't exist anymore in cck
	cckModel.setInternalResistanceOn(false);

	var multimeterListener = new MultimeterModel.Listener() 
	{			
		multimeterChanged: function()
		{				
			var value = multimeter.getCurrentValue();

			if(Double.isNaN(value) || MathUtil.isApproxEqual(previousValue, value, 0.01)) {
				previousValue = value;
				return;
			}
			else {			//we've made a valid measurement
				previousValue = value;
				var units = "?";
				var state = multimeter.getState();
				if (state == MultimeterModel.AMMETER_STATE) {
					units = multimeter.getRangePrefix() + "A";
					System.out.println("The multimeter is set to ammeter");
					System.out.println("Multimeter value in ammeter mode is " + multimeter.getCurrentValue());
					System.out.println("");
					logFile.println("The multimeter is set to ammeter");
					logFile.println("Multimeter value in ammeter mode is " + multimeter.getCurrentValue());
				}
				else if (state == MultimeterModel.OHMMETER_STATE) {
					units = multimeter.getRangePrefix() + "Ω";
				}
				else if (state == MultimeterModel.VOLTMETER_STATE) {
					units = multimeter.getRangePrefix() + "V";
					System.out.println("The multimeter is set to voltmeter");
					System.out.println("Multimeter value in voltmeter mode is " + multimeter.getCurrentValue());
					System.out.println("");
					logFile.println("The multimeter is set to voltmeter");
					logFile.println("Multimeter value in voltmeter mode is " + multimeter.getCurrentValue());
				}
				else if (state == MultimeterModel.OFF_STATE) {
					System.out.println("The multimeter is off");
					logFile.println("The multimeter is off");
					lastMMStateViable = false;
					solverFinishedOnce = false;
				}
				
				var rangedMMValueString = new Packages.java.lang.String(value + " " + units);

				System.out.println("multimeterValue = " + value);
				System.out.println("rangedMMValueString = " + rangedMMValueString);
		
				var branchObjectResistor = branchArray["#Ringless Resistor"];
				if (branchObjectResistor == null) {
					System.err.println("Didn't find #Ringless Resistor");
					return;
				}
				var branchResistor = branchObjectResistor.branch;
				System.out.println("branchResistor:"+branchResistor);
				
				//////////
				System.out.println("///////////////");
				System.out.println("branchResistor getVoltageDrop(): " + branchResistor.getVoltageDrop());
				System.out.println("branchResistor getCurrent(): " + branchResistor.getCurrent());
				System.out.println("myResistor getVoltageDrop(): " + myResistor.getVoltageDrop());
				System.out.println("myResistor getCurrent(): " + myResistor.getCurrent());
				System.out.println("///////////////");
				/////////
				
				var rangedBRVoltageValueString = new Packages.java.lang.String(rangeValue(branchResistor.getVoltageDrop()) + "V");
				var rangedBRAmperageValueString = new Packages.java.lang.String(rangeValue(branchResistor.getCurrent()) + "A");

				System.out.println("rangedBRVoltageValueString = " + rangedBRVoltageValueString);
				System.out.println("rangedBRAmperageValueString = " + rangedBRAmperageValueString);
						
				if(rangedMMValueString.contains("???")) return;
				
				var rangedMMValueArray = rangedMMValueString.split("\\s");
				var rangedBRVoltageValueArray = rangedBRVoltageValueString.split("\\s");
				var rangedBRAmperageValueArray = rangedBRAmperageValueString.split("\\s");

				if (rangedMMValueArray.length == 1) {
					rangedMMValueArray = new Array(rangedMMValueArray[0], "");
				}
				
				// array contains four elements. [0] is ranged number from the DMM, 
				// 	[1] is its unit (e.g., mV),
				//	[2] is the voltage through the ringless resister, and 
				//  [3] is the amperage through the ringless resister
				var array = [ java.lang.Math.abs(java.lang.Double(rangedMMValueArray[0])), 
					rangedMMValueArray[1],
					java.lang.Math.abs(java.lang.Double(rangedBRVoltageValueArray[0])),
					java.lang.Math.abs(java.lang.Double(rangedBRAmperageValueArray[0]))];

				/*
				var array = [ java.lang.Math.abs(java.lang.Double(rangedMMValueArray)), 
					multimeter.actingAsVoltmeter() ? (rangedMMValueArray + "V") : multimeter.actingAsAmmeter() ? (rangedMMValueArray + "A") : "",
					java.lang.Math.abs(java.lang.Double(rangedBRVoltageValueArray)),
					java.lang.Math.abs(java.lang.Double(rangedBRAmperageValueArray))];
				*/
				
				multimeterMeasurements[("Measurement " + measurementCounter)] = array;
				measurementCounter++;
				
				showFirstMeasurementMessage();

				logNotebook(value, units);
				lastMMStateViable = true;
				solverFinishedOnce = true;
				
				//more debug info
				printMeasurements();
			}
		} // end of multimeterChanged: function()
		
	}; // end of var multimeterListener = new MultimeterModel.Listener() 

	multimeter.addListener(multimeterListener);
	// cckModule.setMultimeterVisible(multiMeterVisible);

}// end of setupMultimeter()

function showFirstMeasurementMessage()
{
	if (firstMeasurement)
	{
		firstMeasurement = false;
		OTCardContainerView.setCurrentCard(otInfoAreaCards, "firstMeasurementText");
		Toolkit.getDefaultToolkit().beep();
	}
}

/** Debug purposes */
function printMeasurements()
{
	for (var i = 1; i < measurementCounter; i++){
		var currentMeasurement = "Measurement " + i;
		var array = multimeterMeasurements[currentMeasurement];
		System.out.println("Measurement "+currentMeasurement + " with " + array[0] + " '" + array[1] + "' measured while there were " + array[2] + " and " + array[3] + " through the resistor.");
		logFile.println("Measurement "+currentMeasurement + " with " + array[0] + " '" + array[1] + "' measured while there were " + array[2] + " and " + array[3] + " through the resistor.");
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
			var multimeter = cckModule.getMultimeterModel();
			var branchObject = branchArray[branch.getName()];
			var presentVoltage = branch.getVoltageDrop();
			var presentCurrent = branch.getCurrent();
			var deltaVoltage = Math.abs(presentVoltage - branchObject.voltage);
			var deltaCurrent = Math.abs(presentCurrent - branchObject.current);

			//System.out.println("A voltage of " + presentVoltage + " with a current of " + presentCurrent + " is flowing through " + branch.getLabel());
			// var multimeter = cckModule.getMultimeterModel();

			if(deltaVoltage > vTolerance)
			{
				branchObject.voltage = presentVoltage;
			}

			if(deltaCurrent > aTolerance)
			{
				branchObject.current = presentCurrent;
			}

			if(lastMMStateViable)
			{
				if(deltaVoltage < aTolerance && deltaCurrent < vTolerance)
				{
					return;
				}
			}
			logFile.println("A voltage of " + presentVoltage + " with a current of " + presentCurrent + " is flowing through " + branch.getName());

			solverFinishedOnce = false;

			//Detect shortcircuit
			if(Math.abs(presentCurrent) > 10 && shortCircuit == false)
			{
				var warningDialog = new JOptionPane();
				warningDialog.showMessageDialog(frame, shortCircuitStr, "", JOptionPane.WARNING_MESSAGE);
				shortCircuit = true;
				shortCircuitCounter++;
			}
			else if(!(Math.abs(presentCurrent) > Math.abs(presentVoltage) + 1))
			{
				shortCircuit = false;			
			}
		}
	}

	//circuitHandler handles all changes in the circuit, updating junctionArray and branchArray as needed. 
	var circuit = cckModule.getCircuit();
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
			var branchObject = branchArray[branch.getName()];
			System.out.println(branchObject + " removed from the circuit");
		},

		junctionAdded: function(junction)
		{
		},
	
		/** junctionsConnected is called when two junctions are joined */
		junctionsConnected: function(a, b, newTarget)
		{
			if(!initializationDone)
				return;
			if(firstJunctionsConnected)
			{
				firstJunctionsConnected = false;
				Toolkit.getDefaultToolkit().beep();
				OTCardContainerView.setCurrentCard(otInfoAreaCards, "firstJunctionText");
			}

			var branchList = new Vector();
			var branchAList = junctionArray[a.getName()];
			var myBranchName = "";
			if (branchAList == null) { branchAList = new Vector(); }
			var e = branchAList.elements();

			//This while loop checks all the elements of the Vector branchAList, which are branches, and adds a comma between 
			//the names of each branch name. Additionally, it checks if the junction a represents the start junction
			//(A) or the end junction (B) for the branches to which junction a is connected.

			while (e.hasMoreElements()) 
			{
				var temp = e.nextElement();
				var branchObject = branchArray[temp.getName()];
				myBranchName += branchObject.name;

				if(newTarget == temp.getStartJunction()) 	myBranchName += junctionA;
				if(newTarget == temp.getEndJunction())		myBranchName += junctionB;
				if(e.hasMoreElements())						myBranchName += ", ";
			}
			
			
			//Adds the message "connected to: " and puts that at the end of all the branch names above.
			myBranchName += junctionsConnectedMsg;
			System.out.print(myBranchName + " ");			
			logFile.print(myBranchName + " ");
			myBranchName = "";

			//This while loop does the same as above, except it's for branchBList
			var branchBList = junctionArray[b.getName()];
			if (branchBList == null) { branchBList = new Vector(); }
			for (var e = branchBList.elements() ; e.hasMoreElements() ;) 
			{
				var temp = e.nextElement();
				var branchObject = branchArray[temp.getName()];
				myBranchName += branchObject.name;

				if(newTarget == temp.getStartJunction())
					myBranchName += junctionA;
				if(newTarget == temp.getEndJunction())
					myBranchName += junctionB;
				if(e.hasMoreElements())
					myBranchName += ", ";
			}
			
			branchList.addAll(branchAList);
			branchList.addAll(branchBList);

			System.out.println(myBranchName);
			logFile.println(myBranchName);

			junctionArray[newTarget.getName()] = branchList;

			///////////////////////////Unused script for recording 0.0 measurements/////////////////////////						
			/*var multimeter = cckModule.getMultimeter();
			var multimeterValue = multimeter.getMultimeterValue();
			var branchObjectResistor = branchArray["#Ringless Resistor"];
			var branchResistor = branchObjectResistor.branch;
			var isOKValue = ! java.lang.Double.isNaN(multimeterValue);

			if(!isOKValue)
				return;

			if(multimeterValue == 0)
			{
				var array = [ java.lang.Math.abs(java.lang.Double(roundedValue(multimeterValue))), 
					multimeter.actingAsVoltmeter() ? "V" : multimeter.actingAsAmmeter() ? "A" : "",
					java.lang.Math.abs(java.lang.Double(roundedValue(branchResistor.getVoltageDrop()))) + " V",
					java.lang.Math.abs(java.lang.Double(roundedValue(branchResistor.getCurrent()))) + " A"];
				multimeterMeasurements[("Measurement " + measurementCounter)] = array;
				measurementCounter++;
			}*/
			///////////////////////////Unused script for recording 0.0 measurements////////////////////////
		},

		/** Junctions Split is called every time one branch is disconnected from other branches via the deletion of a junction.
		 * The script in this function prints all the names of all the branches involved (with each name seperated by a comma)
		 * and then adds the string " disconnected from each other." at the end.
		 */
		junctionsSplit: function(old, j) // j is the array of all the new junctions created by the split of old
		{
			var branchList = junctionArray[old.getName()];
			var branchNames = "";

			//The first loop iterates through the branchList vector and assigns the branch(es) in branchList to tempBranch
			for(var e = branchList.elements(); e.hasMoreElements();)
			{
				var tempBranch = e.nextElement();
				var branchObject = branchArray[tempBranch.getName()];
				var tempJunctionLabel;
				var i = 0;
				
				//The second loop iterates through the array of junctions, "j", and tests
				for(var i = 0; i < j.length; i++)
				{
					var tempStartJunction = tempBranch.getStartJunction();
					var tempEndJunction = tempBranch.getEndJunction();
					var newBranchList = new Vector();
					tempJunctionLabel = j[i].getName();
					newBranchList.add(tempBranch);

					if(tempStartJunction.getName() == j[i].getName())
					{
						junctionArray[tempJunctionLabel] = newBranchList;
						branchNames += branchObject.name;
						break;
					}
					else if(tempEndJunction.getName() == j[i].getName())
					{
						junctionArray[tempJunctionLabel] = newBranchList;
						branchNames += branchObject.name;
						break;
					}
				}

				if(e.hasMoreElements())
					branchNames += ", ";
			}


			branchNames += junctionsDisconMsg;
			logFile.println(branchNames);
		},
		
		/* This method is called every time a graphic is added (really, every time a branch is added). The script in the
		 * function sets all the needed values (the branch's name, label, voltage, current, and the branch itself)
		 * to an associative array called "branchObject". branchObject is then stored in another associative array called
		 * "branchArray", and uses a key (which is also the label of the branch) of branchObject as the index. This way, 
		 * when other functions want to access the values of a particular branchObject, they need the label of the branch 
		 *(a string returned by the method branch.getLabel()).
		 */
		branchAdded: function(branch)
		{
			if(!initializationDone)	return;

			var startJunctionList = new Vector();
			var endJunctionList = new Vector();
			var startJunction = branch.getStartJunction();
			var endJunction = branch.getEndJunction();

			var branchObject = new Object();
			branchObject.branch = branch;
			branchObject.key = branch.getName();
			branchObject.voltage = 0.0;
			branchObject.current = 0.0;
			if(branch.getName().startsWith("#")){
				branchObject.name = branch.getName();
			}
			else{
				branchObject.name = getBranchName(branch);
			}
			System.out.println("Adding object to branchArray: " + branchObject.key + ", " + branchObject);
			branchArray[branchObject.key] = branchObject;

			var nameTest = new Packages.java.lang.String(branchObject.name);

			//Adds a volt listener
			if(nameTest.equals("#Multimeter Resistor") || nameTest.equals("#Ringless Resistor"))
			{
				branch.addCurrentVoltListener(currentVoltListener);
			}

			startJunctionList.add(branch);
			endJunctionList.add(branch);

			junctionArray[startJunction.getName()] = startJunctionList;
			junctionArray[endJunction.getName()] = endJunctionList;

			var className = branch.getClass().getName();
			var names = className.split("\\.");
			var typeName = names[names.length - 1];

			if(typeName.equals("Battery"))
			{				
				var randomGen = new java.util.Random;
				var random = randomGen.nextInt(10) + 11;
				branch.setVoltageDrop(9);

				// var menu = circuitGraphic.getGraphic(branch).getMenu();
				var menuComponent = circuitNode.getBranchNode(branch).getMenu();
				var menuItems = menuComponent.getSubElements();
				menuItems[0].setEnabled(false);
				menuItems[1].setEnabled(false);
				menuItems[3].setEnabled(false);
			}
			if(typeName.equals("Resistor"))
			{
				var menuComponent = circuitNode.getBranchNode(branch).getMenu();
				var menuItems = menuComponent.getSubElements();
				
				menuItems[0].setEnabled(false);
				menuItems[1].setEnabled(false);
			}
			System.out.println(branchObject.name + " added to the circuit");
			logFile.println(branchObject.name + " added to the circuit");
		}
		
	};// end of var circuitHandler = new CircuitListener()

	circuit.addCircuitListener(circuitHandler);
	
	var circuitSolutionListener = new CircuitSolutionListener() 
	{
		circuitSolverFinished: function()
		{
			System.out.println("----________ circuitSolverFinished! _________----");
			System.out.println("myResistor getVoltageDrop(): " + myResistor.getVoltageDrop());
		},
	};
	
	var circuitSolver = cckModel.getCircuitSolver();
	circuitSolver.addSolutionListener(circuitSolutionListener);


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
			var enteredText = answerBox.getText();
			System.out.println(enteredText);
			var valuePosition = enteredText.search(/\d+(.\d*)?/);
			var unitsPosition = enteredText.search(/ohms?/i);
			var answer = -1;
			unitsGiven = false;
			if (valuePosition > -1)
			{
				answer = enteredText.match(/\d+(.\d*)?/)[0];
			}
			if (unitsPosition > -1)
			{
				unitsGiven = true;
			}
			//infoArea.setText(valuePosition + ", " + unitsPosition + ", " + answer + ", " + unitsGiven);
			checkAnswer(answer);
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

	var newBranch = new Resistor(cckModule.getCircuit().getKirkhoffListener(), startJunction, endJunction, resistorLength, resistorHeight);
	newBranch.setResistance(java.lang.Double(random));
	newBranch.setVisibleColorBands(false);
	// newBranch.setMovable(true);
	newBranch.setName("#Ringless Resistor");
	
	cckModule.getCircuit().addBranch(newBranch);

	//Disable the pop up menu
	newBranch.setMenuEnabled(false);

	System.out.println("The Ringless Resistor's Resistance is " + newBranch.getResistance());
	logFile.println("The Ringless Resistor's Resistance is " + newBranch.getResistance());

	var branchObject = new Object();
	branchObject.branch = newBranch;
	branchObject.key = newBranch.getName();
	branchObject.voltage = 0.0;
	branchObject.current = 0.0;
	if(newBranch.getName().startsWith("#")){
		branchObject.name = newBranch.getName();
	}
	else{
		branchObject.name = getBranchName(newBranch);
	}
	System.out.println("Adding object to branchArray: " + branchObject.key + ", " + branchObject);
	branchArray[branchObject.key] = branchObject;
	
	myResistor = newBranch;
	
}// end of createResistor()

/** */
function rangeValue(value) 
{
	var unitPrefix;
	var sign = "";
	var displayValue;
	var exponent;
	var leftOfDecimalDigits;
	var rightOfDecimalZeroes;
	var displayDigits = 4;
     	
	if(value < 0){
		sign = "-";
		value = Math.abs(value);
	}
	
	System.out.println("Value to range is: " + value);
	
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
	
	exponent = Packages.java.lang.Math.log10(Math.abs(displayValue));
	
	if(exponent >= 0) {
	   	leftOfDecimalDigits = exponent + 1;
	   	rightOfDecimalZeroes = 0;	
	}
	else {
	   	leftOfDecimalDigits = 0;
	   	rightOfDecimalZeroes = -exponent + 1;
	}
	
	if(leftOfDecimalDigits < displayDigits) {
		var temp = displayValue + 5 * Math.pow(10, leftOfDecimalDigits - displayDigits - 1);
		temp = (temp * Math.pow(10, displayDigits - leftOfDecimalDigits));
		displayValue = temp / Math.pow(10, displayDigits - leftOfDecimalDigits);
	}
	
	// System.out.println("displayValue is a: " + displayValue.getClass().getName());
	var displayString = new Packages.java.lang.String(displayValue);
	// System.out.println(displayString.getClass().getName());
	// displayString = displayString + "a"; // + displayValue;
	// System.out.println(displayString.getClass().getName());
	// System.out.println("Display string: " + displayString /*+ " is a " + displayString.getClass().getName()*/);
	var addZeroes = (displayDigits + 1) - (displayString.length());
	
	if(displayValue < 100){
		if(displayString.length() < displayDigits + 1){
			for(var i = 0; i < addZeroes; i++){
				displayString += "0";
			}
		}
	}
	
	//System.out.println(sign + displayString + unitPrefix);
	if(displayValue < 1000){
		return sign + displayString + unitPrefix;
	}
	else if (displayValue < 0.001){
		return sign + 0 + unitPrefix;
	}
	else{
		return "???";
	}
	
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

/** 
 * This function gets the name of the branch from the branch's classpath, 
 * and then returns the name of the branch plus 
 * the latest number of branches of that type in the CCK program.
 */
function getBranchName(branch)
{
	var typeNumber = new Integer(1);
	var className = branch.getClass().getName();
	var names = className.split("\\.");
	var typeName = names[names.length - 1];

	if (typeName.equals("Branch"))
	{
		typeName = "Wire";
	}

	if(typeHash.containsKey(typeName))
	{
		typeNumber = typeHash.get(typeName);
		typeNumber++;
		typeHash.put(typeName, new Integer(typeNumber));
	}
	else
	{
		typeHash.put(typeName, typeNumber);
	}
		
	return typeName + " " + typeHash.get(typeName);
}

/** A function that cuts down all values to the third decimal place when used, and rounding when neccessary */
function roundedValue(number)
{
	var rounder = new DecimalFormat("#.###");
	
	return rounder.format(number);
}

/** Function for creating a branch of any type */
//FIXME: This function is not currently being used but it might be useful (maybe in java)?
function createBranch(x1, y1, branchType)
{
	var newBranch;
	var changex;
	var startJunction;
	var endJunction; 
	var x2;
	var y2;

	var kirkhoffListener = cckModule.getCircuit().getKirkhoffListener();

	if(branchType.equals("Wire"))
	{
		changex = cckModule.getCCKModel().WIRE_LENGTH / 2;
		x1 -= changex;
		x2 = x1 + cckModule.getCCKModel().WIRE_LENGTH;
		y2 = y1;

		startJunction = new Junction(x1, y1);
		endJunction = new Junction(x2, y2);

		newBranch = new Branch(kirkhoffListener, startJunction, endJunction);	
		//newBranch = new ScriptBranch();
	}
	else if(branchType.equals("Resistor"))
	{
		var resistorLength = cckModule.getCCKModel().RESISTOR_DIMENSION.getLength();
		var resistorHeight = cckModule.getCCKModel().RESISTOR_DIMENSION.getHeight();
		changex = resistorLength / 2;
		x1 -= changex;
		x2 = x1 + resistorLength;
		y2 = y1;

		startJunction = new Junction(x1, y1);
		endJunction = new Junction(x2, y2);

		newBranch = new Resistor(kirkhoffListener, startJunction, endJunction, resistorLength, resistorHeight);
		//newBranch = new ScriptResistor();
		//newBranch.setHeight(resistorHeight);
		//newBranch.setLength(resistorLength);
		newBranch.setResistance(10.0);
		newBranch.setVisibleColorBands(false);
	}
	else if(branchType.equals("Battery"))
	{
		var batteryLength = cckModule.getCCKModel().BATTERY_DIMENSION.getLength();
		var batteryHeight = cckModule.getCCKModel().BATTERY_DIMENSION.getHeight();
		changex = batteryLength / 2;
		x1 -= changex;
		x2 = x1 + batteryLength;
		y2 = y1;
		
		startJunction = new Junction(x1, y1);
		endJunction = new Junction(x2, y2);

		//newBranch = new ScriptBattery();
		newBranch = new Battery(kirkhoffListener, startJunction, endJunction, batteryLength, batteryHeight, 0.001, true);
	}
	else if(branchType.equals("Light Bulb"))
	{
		var bulbLength = cckModule.getCCKModel().BULB_DIMENSION.getLength();
		var bulbHeight = cckModule.getCCKModel().BULB_DIMENSION.getHeight();
		var bulbWidth = 0.95;
		var junctDist = cckModule.getCCKModel().BULB_DIMENSION.getDistBetweenJunctions();

		/*var changex = junctDist / 2;
		var changey = junctDist / 2;
		x1 -= changex;
		y1 -= changey;*/
		x2 = x1 + java.lang.Math.sqrt((junctDist * junctDist) / 2);
		y2 = y1 + java.lang.Math.sqrt((junctDist * junctDist) / 2);

		startJunction = new Junction(x1, y1);
		endJunction = new Junction(x2, y2);
		newBranch = new Bulb(kirkhoffListener, startJunction, endJunction, bulbWidth, junctDist, bulbHeight, false);
	}
	else if(branchType.equals("Switch"))
	{
		var switchLength = cckModule.getCCKModel().SWITCH_DIMENSION.getLength();
		var switchHeight = cckModule.getCCKModel().SWITCH_DIMENSION.getHeight();
		changex = switchLength / 2;
		x1 -= changex;
		x2 = x1 + switchLength;
		y2 = y1;
		
		startJunction = new Junction(x2, y2);
		endJunction = new Junction(x1, y1);

		//newBranch = new ScriptBattery();
		newBranch = new Switch(kirkhoffListener, startJunction, endJunction, false, switchLength, switchHeight);
	}
	else
	{
		changex = cckModule.WIRE_LENGTH / 2;
		x1 -= changex;
		x2 = x1 + cckModule.WIRE_LENGTH;
		y2 = y1;
		
		startJunction = new Junction(x1, y1);
		endJunction = new Junction(x2, y2);

		//newBranch = new ScriptBranch();
		newBranch = new Branch(kirkhoffListener, startJunction, endJunction);
	}	

	
	//Add these when the classes for the no argument constructors are working
	//
	//newBranch.setStartJunction(startJunction);
	//newBranch.setEndJunction(endJunction);
	//newBranch.addKirkhoffListener(cckModule.getKirkhoffListener());	
	var circuit = cckModule.getCircuit();
	circuit.addBranch(newBranch);
	// circuitGraphic.addGraphic(newBranch);

	// FIXME: This doesn't seem to do anything...
	/* if(branchType.equals("Resistor"))
	{
		var graphic = circuitGraphic.getGraphic(newBranch);
	} */
	
	// newBranch.setMovable(true);
	var menu = circuitNode.getBranchNode(newBranch).getMenu();

	for(var i = 0; i < menuItems.length; i++)
	{
		var item = menuItems[i];
		System.out.println(item);
	}

	menuItems[0].setEnabled(false);
	//circuitGraphic.getGraphic(newBranch).setVisible(false);
}

/** Checks the answer and creates messages according to the answer submitted */
function checkAnswer(answerValue)
{
	System.out.println("All measurements: ");
	logFile.println("All measurements: " );
	for(var i = 1; i < measurementCounter; i++)
	{
		var currentMeasurement = "Measurement " + i;
		var array = multimeterMeasurements[currentMeasurement];
		System.out.println(currentMeasurement + " with " + array[0] + " '" + array[1] + "' measured while there were " + array[2] + " and " + array[3] + " through the resistor.");
		logFile.println(currentMeasurement + " with " + array[0] + " '" + array[1] + "' measured while there were " + array[2] + " and " + array[3] + " through the resistor.");
	}

	var correctAmmeterMeasurements = new Array();
	var correctVoltmeterMeasurements = new Array();
	var numCorrectAmmeterMeasurements = 0;

	//Finds the number of correct ammeter measurements and stores them in the array correctAmmeterMeasurements
	for(var i = 1; i < measurementCounter; i++)
	{
		var currentMeasurement = "Measurement " + i;
		var array = multimeterMeasurements[currentMeasurement];
		correctAmmeterMeasurements[i] = null;

		if(array != null)
		{
			if(Math.abs((array[0]-array[3])/array[3]) < 0.001 && (array[1].equals("A") || array[1].equals("mA") || array[1].equals("kA")))
			{
				correctAmmeterMeasurements[i] = currentMeasurement;
				numCorrectAmmeterMeasurements++;
			}
		}
	}

	var bestVoltMeasurement;
	var numCorrectVoltMeasurements = 0;

	//Checks every voltage measurement against the voltage value of every correct ammeter measurement
	for(var i = 1; i < measurementCounter; i++)
	{	
		var array = multimeterMeasurements["Measurement " + i];
			
		if(array[0] > 0 && (array[1].equals("V") || array[1].equals("mV") || array[1].equals("kV")))
		{
			bestVoltMeasurement = "Measurement " + i;
		}

		for(var j = 1; j < measurementCounter; j++)
		{
			array = multimeterMeasurements["Measurement " + j];
			var bestVoltMeasurementTest = multimeterMeasurements[bestVoltMeasurement];

			System.out.println("array = " + array[0] + " " + array[1] + " " + array[2] + " " + array[3]);
			System.out.println("bestVoltMeasurement" + bestVoltMeasurement);

			if(bestVoltMeasurementTest != null && correctAmmeterMeasurements[j] != null)
			{
				if((bestVoltMeasurementTest[0]-array[2])/array[2] < 0.0001)
				{
					if(numCorrectVoltMeasurements != 0)
					{
						if(correctVoltmeterMeasurements[numCorrectVoltMeasurements - 1].equals(bestVoltMeasurement))
						{
							continue;
						}
					}

					correctVoltmeterMeasurements[numCorrectVoltMeasurements] = bestVoltMeasurement;
					numCorrectVoltMeasurements++;
					break;
				}
			}
		}
	}

	if(numCorrectAmmeterMeasurements == 0)
	{
		System.out.println("There are no correct ammeter measurements.");
		logFile.println("There are no correct ammeter measurements.");
	}
	else
	{
		for(var i = 0; i < correctAmmeterMeasurements.length; i++)
		{
			if(correctAmmeterMeasurements[i] != null)
			{
				System.out.println("A correct ammeter measurement is: " + correctAmmeterMeasurements[i]);
				logFile.println("A correct ammeter measurement is: " + correctAmmeterMeasurements[i]);
			}
		}
	}

	if(numCorrectVoltMeasurements == 0) 
	{
		System.out.println("There are no correct volt measurements");
		logFile.println("There are no correct volt measurements");
	}
	else
	{
		for(var i = 0; i < numCorrectVoltMeasurements; i++)
		{
			System.out.println("A correct volt measurement is: " + correctVoltmeterMeasurements[i]);
			logFile.println("A correct volt measurement is: " + correctVoltmeterMeasurements[i]);
		}
	}
	
	System.out.println("Number of short circuits: " + shortCircuitCounter);
	logFile.println("Number of short circuits: " + shortCircuitCounter);

	var answerType = null;
	var branchObjectResistor = branchArray["#Ringless Resistor"];
	var branchResistor = branchObjectResistor.branch;
	
	//Tests for each kind of answer type:
	//
	//Answer Type 1: Measured at least one correct volt measurement and ammeter measurement and reported the correct resistance
	//Answer Type 2: Measured at least one correct volt measurement and ammeter measurement and reported the incorrect resistance
	//Answer Type 3: Did not measure at least one correct volt measurement or ammeter measurement, and guessed the correct resistance
	//Answer Type 4: None of the above (did nothing correct) 

	if(numCorrectAmmeterMeasurements > 0 && numCorrectVoltMeasurements > 0 && answerValue == branchResistor.getResistance())
	{
		answerType = 1;
	}
	else if((numCorrectAmmeterMeasurements > 0 && numCorrectVoltMeasurements > 0) && answerValue != branchResistor.getResistance())
	{
		answerType = 2;
	}
	else if((numCorrectAmmeterMeasurements == 0 || numCorrectVoltMeasurements == 0) && answerValue == branchResistor.getResistance())
	{
		answerType = 3;
	}
	else
	{
		answerType = 4;
	}

	showSolution(answerType, correctAmmeterMeasurements, correctVoltmeterMeasurements);
}

/** Shows a message as feedback after submitting an answer */
function showSolution(answerType, correctAmmeterMeasurements, correctVoltmeterMeasurements)
{
	var firstAmmeterMeasurement;
	var firstAmmeterMeasurementUnits;
	var firstVoltmeterMeasurement = null;
	var firstVoltmeterMeasurementUnits = "V";
	var actualCurrentThroughResistor;

	var array;

	if(answerType == 1 || answerType == 2)
	{
		for(var i = 0; i < correctAmmeterMeasurements.length; i++)
		{
			var ammeterVoltageMeasurement;

			if(correctAmmeterMeasurements[i] != null)
			{
				array = multimeterMeasurements[correctAmmeterMeasurements[i]];

				System.out.println("In function solution, array = " + array[0] + ", " + array [1] + ", " + array [2] + ", " + array [3]);

				firstAmmeterMeasurement = array[3];
				firstAmmeterMeasurementUnits = array[1];
				ammeterVoltageMeasurement = array[2];

				for(var j = 0; j < correctVoltmeterMeasurements.length; j++)
				{
					array = multimeterMeasurements[correctVoltmeterMeasurements[j]];
				
					System.out.println("multimeterMeasurements[correctVoltmeterMeasurements["+j+"] = " + array[0] + ", " + array [1] + ", " + array [2] + ", " + array [3]);
					System.out.println("ammeterVoltageMeasurement:"+ammeterVoltageMeasurement);
				
					if(ammeterVoltageMeasurement == array[2])
					{
						firstVoltmeterMeasurement = array[0];
						break;
					}
				}
			}

			if(firstVoltmeterMeasurement != null)
				break;
		}

		if (firstAmmeterMeasurementUnits == "mA")
		{
			actualCurrentThroughResistor = firstAmmeterMeasurement / 1000;
		}
	}
	
	var calculatedResistance = (firstVoltmeterMeasurement / actualCurrentThroughResistor);
	calculatedResistance = java.lang.Math.round(calculatedResistance);

	//Put variables into hash map so we can construct the report.
	substMap.put("firstVoltmeterMeasurement",String(firstVoltmeterMeasurement) + " " + firstVoltmeterMeasurementUnits);
	substMap.put("firstAmmeterMeasurement",String(firstAmmeterMeasurement) + " " + firstAmmeterMeasurementUnits);
	substMap.put("calculatedResistance",String(calculatedResistance));
	substMap.put("shortCircuitCounter",String(shortCircuitCounter));

	// FIXME Replace with OTVelocity templates...
	if(answerType == 1)
	{
		solutionString = substitute(solutionString1, substMap);
	}
	else if(answerType == 2)
	{
		solutionString = substitute(solutionString2, substMap);
	}
	else if(answerType == 3)
	{
		solutionString = substitute(solutionString3, substMap);
	}
	else if(answerType == 4 )
	{
		solutionString = substitute(solutionString4, substMap);
	}

	var shortCircuitMsg = "";

	if (shortCircuitCounter!= 0)
	{
		if (shortCircuitCounter == 1)
		{
			shortCircuitMsg = shortCircuitMsg1;
		}
		else if (shortCircuitCounter == 2)
		{
			shortCircuitMsg = shortCircuitMsg2;
		}
		else
		{
			shortCircuitMsg = substitute(shortCircuitMsg3, substMap);
		}
	}

	//Check for units reported
	var unitsMsg = unitsNotReported;
	if (unitsGiven) unitsMsg = unitsReported;
	var otxml = new OTXMLString(startHTML + solutionString + unitsMsg + shortCircuitMsg + endHTML);
	// System.out.println("Solution message is: ");
	// System.out.println(startHTML + solutionString + unitsMsg + shortCircuitMsg + endHTML);
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
		
		System.out.println("variable map: "+ variable+": "+value);
		
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
