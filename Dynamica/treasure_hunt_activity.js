/**
 * This is a test script for the treasure hunt activity, step 1a
 * 
 * All the objects in the collisions window are already in there (they are
 * set up in an initial collisions xml file), so we don't need to create any object
 * in this script.
 * This step allows the user to move displacement vectors (shown as arrows) freely 
 * in the collisions window and start the simulation to get the pirate to find the 
 * treasure. The treasure is hidden initially and it's only shown once the pirate 
 * finds it.
 * Feedback given:
 * - When the pirate finds the treasure
 * - If the player has started the simulation but the arrows are not in the right place:
 * -- There is no arrow at the starting point
 * -- Not all the arrows are forming a continuous path from the starting point
 */

/**
 * Variables coming from the script OT context:
 * ====================================
 * objView		GUIPanel	Collisions visual component (Dynamica)
 * txtFeedback	OTText		Feedback text object
 */

importPackage(Packages.java.lang);
importClass(Packages.java.awt.Color);

importClass(Packages.org.concord.framework.simulation.SimulationListener);
importClass(Packages.org.concord.framework.simulation.StepListener);
importClass(Packages.org.concord.collisions.engine.JPartWorld);
importClass(Packages.org.concord.collisions.event.CollisionsListener);
importClass(Packages.org.concord.collisions.event.DaemonCollListener);
importClass(Packages.org.concord.collisions.event.AreaListener);

/*
 * Variables from OTScriptContextHelper
 * ====================================
 * otContents
 * viewContext
 */

var world;				//Collisions world
var resultDisplDaemon; 	//Resultant displacement vector (in red)
var ball;				//Element that represents the pirate (black guy)
var treasure;			//Element that represents the treasure 

var numCollidedDisplD;	//Number of displacement vectors that have been traveled by pirate
var found = false;		//Indicated whether the treasure has been found or not
var displDColor
var usedDisplDColor = new Color(0.65,0.65,1)
var resultDisplDColor = new Color(1,0,0)

var MSG_WIN = 1;
var MSG_NO_START_ARROW = 20;
var MSG_ARROWS_OUTSIDE = 21;
var MSG_ARROWS_DISCONNECTED = 22;
var MSG_PATH_REPEATED = 25;

/**
 * This function is called when the script starts up
 * It returns a boolean indicating whether the initialization 
 * was successful or not.
 */
function init()
{
	setupActivity()
	initial()
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

/**
 * This is the daemon collisions listener
 * The end of the collision event means that the pirate just finished 
 * going over the arrow. This script listens to this event and updates the
 * resultant displacement vector.
 */
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
		//Update and show resultant displacement vector
		resultDisplDaemon.setDisplacement(d.getX()+d.getDisplacementX()-resultDisplDaemon.getX(),
			d.getY()+d.getDisplacementY()-resultDisplDaemon.getY())
		resultDisplDaemon.setVisible(true)
		objView.repaint()
//		savePath(d)
//		showResultSum(d)
	}
};

/**
 * This is the simulation listener, listening to the simulation
 * start, stop and reset events
 * When the simulation gets reset, it means the player wants to try again, so
 * this script calls the initialization method whenever the player resets
 */
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

/**
 * This is the area listener in the collisions window
 * The listener was set up around the area of the treasure, so it will be fired
 * when the pirate travels on top of the treasure area.
 * This script calls a method that handles when the pirate finds the treasure 
 */
var areaListener = new AreaListener()
{
	areaVisited: function(evt)
	{
		checkWin();
	}
};

/**
 * This is the listener for the collisions steps
 * It gets called every dt step in the collisions engine (like every 
 * simulation cycle)
 * This script checks if the pirate guy is not moving and it hasn't found the
 * treasure yet. That means that the pirate is "stuck" somewhere because 
 * there is no path that can take him to the treasure. We need to tell the 
 * player that there is at least an arrow that is not placed correctly
 */
var stepsListener = new StepListener()
{
	stepFinished: function(evt)
	{
		seconds=Math.round(evt.getStepTime()/1000)
		
		if (!found && seconds>0 && ball.getVx()==0 && ball.getVy()==0 && ball.isCollisionSensitive()){
			checkAdditionalHint()
		}
	}
}

/*
 * Listener for the collisions
 * It gets called inmediately when the pirate collides with an arrow
 */
var collisionsListener = new CollisionsListener()
{
	collisionOccured: function(evt)
	{
		
		//evt.getSource() is the source of the collision (always an atom)
		//evt.getCollidedObject() is the other collided object (atom, wall or daemon)
		if(evt.getID() == JPartWorld.ATOM_WALL_COLLISION)
		{
		}
		else if(evt.getID() == JPartWorld.ATOM_ATOM_COLLISION)
		{
		}
		else if(evt.getID() == JPartWorld.ATOM_DAEMON_COLLISION)
		{
//System.out.println("Collision with a daemon")
			var d
			d = evt.getCollidedObject()
			d.setDraggable(false)
			numCollidedDisplD++

			objView.repaint()
		}
	}
}

/**
 * This method is called only once at the beginning of the activity
 * It sets up the objects in the collisions window and adds listeners as needed 
 */
function setupActivity()
{
	world = objView.getWorldModel();
	world.addStepListener(stepsListener,1000);
	objView.addSimulationListener(simulationListener);
	objView.addCollisionsListener(collisionsListener);

	//Get the pirate guy
	ball = world.getAtomByName("ball");
	if (ball == null){
		System.err.println("Error, pirate guy not found (atom named ball");
	}
	
	//Get the treasure element
	treasure = objView.getElementByName("treasure");
	if (treasure == null){
		System.err.println("Error, treasure not found (passive element named treasure");
	}

	//Get the resultant displ daemon (invisible for now)	
	resultDisplDaemon = world.getDaemonByName("resDispl");
	if (resultDisplDaemon == null){
		System.err.println("Error, resultant displacement vector not found (displ daemon named resDispl");
	}
	
	//Add listeners to all displ. daemons to detect when the pirate goes through each arrow
	var daemons = world.getDaemons();
	var i
	for (i = 0; i < daemons.size(); i++){
		var d = daemons.elementAt(i);
		if (d.getName().startsWith("displ")){
			displDColor = d.getActiveColor()
			d.addDaemonListener(daemonListener)
		}
	}
	
	//Add area listener to detect when the pirate reaches the treasure
	ball.addAreaListener(areaListener, treasure);
//			objView.getPanelToWorldCoordinateTuner().tuneX(JPartWorld.getPxFromCm(tx))-2,
//			objView.getPanelToWorldCoordinateTuner().tuneY(JPartWorld.getPxFromCm(ty))-2,4,4)
	
}

/**
 * This method is called when the pirate finds the treasure.
 * If it hasn't been shown before, it gives the winning feedback to the player 
 */
function checkWin()
{
	if (!found){
		found = true;
		treasure.setVisible(true);
		showFeedback(MSG_WIN)
	}
}

/**
 * This method is called every time the simulation is reset.
 * It resets some of the objects in the screen so it's ready for
 * the player to try again.
 */
function initial()
{
	numCollidedDisplD = 0;
	found = false;
	treasure.setVisible(false);
	txtFeedback.setText("")
	resetArrows()
	resultDisplDaemon.setVisible(false)
	objView.repaint()
}

/**
 * This method resets the displacement arrows to the original state
 */
function resetArrows()
{
	var daemons = world.getDaemons();
	var i
	for (i = 0; i < daemons.size(); i++){
		var d = daemons.elementAt(i);
		if (d.getName().startsWith("displ")){
			d.setActiveColor(displDColor);
			d.setDraggable(true);
		}
	}
}

/**
 * This method checks for possible failure scenarios (determine why the pirate
 * hasn't found the treasure yet 
 */
function checkAdditionalHint()
{
	var msgC=0;

	//Check if there's no displacement daemon in the blue cross
	if (numCollidedDisplD==0){
	//No collision has happened yet
		msgC=MSG_NO_START_ARROW
	}
	else if (!checkArrowsInMap()){
		//Some of the arrows haven't been dragged to the map yet
		msgC=MSG_ARROWS_OUTSIDE
	}
	else {
		var daemons = world.getDaemons();
		if (numCollidedDisplD!=daemons.size()){
		//The pirate couldn't traverse all the arrows
			msgC=MSG_ARROWS_DISCONNECTED
		}
	}
	if (msgC!=0){
		showFeedback(msgC)
	}
}

/**
 * Check whether all the arrows have been moved into the map or not
 */
function checkArrowsInMap()
{
	var i
	var ini

	ini=false
	var daemons = world.getDaemons();
	var i
	for (i = 0; i < daemons.size(); i++){
		var d = daemons.elementAt(i);
		if (d!=null){
			//Hack! If one of the arrows is too much to the right then is not in the map
			if (Math.round(JPartWorld.getCmFromPx(d.getX()))>11){
				return false
			}
		}
	}
	
	return true
}

/**
 * Show feedback depending on a code
 */
function showFeedback(msgCode)
{
	var strMessage = "";

	strMessage = getMessage(msgCode)

	System.out.println(strMessage);
	txtFeedback.setText(strMessage)	
}

function getMessage(code)
{
	var strText = ""

	if (code == MSG_WIN){
		strText = "You found the treasure!";
	}
	if (code==MSG_NO_START_ARROW){
		strText = strText + "Place an arrow where the pirate is" 
//			"Place the tail of the first <FONT color='2222FF'>blue</FONT> vector arrow "+
//			"in the <FONT color='000000'>black</FONT> cross, so Bluebeard can start walking."
	}
	else if (code==MSG_ARROWS_OUTSIDE){
		strText = strText + "Drag all the arrows into the map"
//			"Place ALL the <FONT color='2222FF'>blue</FONT> vector arrows "+
//			"in the map, to make a continous path for Bluebeard."
	}
	else if (code==MSG_ARROWS_DISCONNECTED){
		strText = strText + "Make a continuous path with all the arrows"
//			"The <FONT color='2222FF'>blue</FONT> vector arrows "+
//			"should make a continous path for Bluebeard."
	}
	else if (code==MSG_PATH_REPEATED){
		strText = strText + 
			"Make a different path to the treasure."
	}
	return strText
}
