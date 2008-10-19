/**
 * This is a test script for the treasure hunt activity.
 * 
 */

/**
 * Variables coming from the script OT context:
 * ====================================
 * objView	GUIPanel	Collisions visual component (Dynamica)
 */

importPackage(Packages.java.lang);
importClass(Packages.java.awt.Color);

importClass(Packages.org.concord.collisions.event.DaemonCollListener);
importClass(Packages.org.concord.framework.simulation.SimulationListener);

/*
 * Variables from OTScriptContextHelper
 * ====================================
 * otContents
 * viewContext
 */

var resultDisplDaemon; 	//Resultant displacement vector (in red)
var world;				//Collisions world

var displDColor
var usedDisplDColor = new Color(0.65,0.65,1)
var resultDisplDColor = new Color(1,0,0)

/**
 * This function is called when the script starts up
 * It returns a boolean indicating whether the initialization 
 * was successful or not.
 */
function init()
{
	setupActivity()
}

/**
 * This function is called when the view is closed, just before the script object is destroyed
 */
function save()
{
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

var daemonListener =  new DaemonCollListener()
{
	daemonStarted: function(evt)
	{
	},
	
	daemonActivated: function(evt)
	{
	},
	daemonDeactivated: function(evt)
	{
	},
	daemonFinished: function(evt)
	{
	},
	daemonEndCollision: function(evt)
	{
		var d
		d = evt.getSource()
		d.setActiveColor(usedDisplDColor)
		//Show resultant arrow
		resultDisplDaemon.setDisplacement(d.getX()+d.getDisplacementX()-resultDisplDaemon.getX(),
			d.getY()+d.getDisplacementY()-resultDisplDaemon.getY())
		resultDisplDaemon.setVisible(true)
		objView.repaint()
//		savePath(d)
//		showResultSum(d)
	}
};

var simulationListener = new SimulationListener()
{
	simulationStarted: function(evt)
	{
	},
	simulationStopped: function(evt)
	{
	},
	simulationReset: function(evt)
	{
		initial();
	}
};

function setupActivity()
{
	world = objView.getWorldModel();
	objView.addSimulationListener(simulationListener);
	
	//Create the resultant displ daemon (invisible for now)	
	resultDisplDaemon = world.getDaemonByName("resDispl");
	System.out.println(resultDisplDaemon);
	
	//Add listeners to all displ. daemons
	var daemons = world.getDaemons();
	var i
	for (i = 0; i < daemons.size(); i++){
		var d = daemons.elementAt(i);
		if (d.getName().startsWith("displ")){
			displDColor = d.getActiveColor()
			d.addDaemonListener(daemonListener)
		}
	}
}

function initial()
{
	resetColorArrows()
	resultDisplDaemon.setVisible(false)
	objView.repaint()
}

function resetColorArrows()
{
	var daemons = world.getDaemons();
	var i
	for (i = 0; i < daemons.size(); i++){
		var d = daemons.elementAt(i);
		if (d.getName().startsWith("displ")){
			d.setActiveColor(displDColor);
		}
	}
}
