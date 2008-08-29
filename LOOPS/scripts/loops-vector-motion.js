importPackage(Packages.org.concord.collisions.engine);
importPackage(Packages.org.concord.collisions.ui);
importPackage(Packages.org.concord.framework.simulation);
importPackage(Packages.java.awt);
importPackage(Packages.java.lang);

importClass(Packages.java.awt.event.ActionListener);
importClass(Packages.java.net.URL);

var showTimer = true;
var blnDoStop = false;
var index;
var tuner;
var world;
var velArray;
var integerTimeToStop = -1;
var playButtonEnabled = true

function init() {
	index = 0;
	
	lblTimer.setText("0")
	lblTimer.setFont(new Font(lblTimer.getFont().getName(), lblTimer.getFont().getStyle(),60))
	
	velArray = new Array(1,3,5,2.5);
	velArray[0] = initialVelocity
	
	world = objView.getWorldModel();
	world.addStepListener(stepsListener,50)
	
	runpause_button.addActionListener(actionListener)
	reset_button.addActionListener(actionListener)
	
	tuner = objView.getWorldToPanelCoordinateTuner();	
	setupView();
	EventQueue.invokeLater(new Runnable() {
			run: function() {
				distributeAll();
				objView.repaint()
			}
		});
	
	return true;
}

function save() {
	world.removeStepListener(stepsListener);
	return true;
}

var actionHandler =
{
	actionPerformed: function(evt)
	{
		if (evt.getSource().equals( runpause_button ))
		{
			blnDoStop = false

			if(world.isRunning())
			{
				// if (!blnStopOnIntegerTime){
				//	objView.stop()
				//	setupPlayButton("play")
				//	objView.repaint()
				//}
				//else{
					blnDoStop = true
				//}
			}
			else
			{
				objView.start()

				setupPlayButton("stop", playButtonEnabled)			 
			}
				
		}
		else if (evt.getSource().equals( reset_button ))
		{
			blnDoStop = false
			
			playButtonEnabled = true
			setupPlayButton("start", playButtonEnabled)
			objView.reset()
			distributeAll();

			lblTimer.setText("0")
			objView.repaint()
		}
//		else if(evt.getSource().equals(timer))
//		{
//			objView.repaint();
//			timer.stop();
//		}
	}
	
};
var actionListener = new ActionListener(actionHandler);

function setupPlayButton(strL, enabled)
{
	if (strL.equals("start"))
	{
//Get rid of icon
//		startButton.setIcon(playIcon);
		runpause_button.setText("Start")
	}
	else if (strL.equals("stop"))
	{
//Get rid of icon
//		startButton.setIcon(pauseIcon);
		runpause_button.setText("Stop")
	}
	runpause_button.setEnabled(enabled)
}

var stepsHandler =
{
	stepFinished: function(evt)
	{
		seconds = evt.getStepTime()/1000

		if (showTimer)
		{
			lblTimer.setText(java.lang.Integer.toString(seconds));
			if ((seconds + 1) > maxTime) {
				blnDoStop = true;
				playButtonEnabled = false
			}
		}
		if (blnDoStop){
			if (integerTimeToStop == -1){
				integerTimeToStop = Math.ceil(seconds)
			}
			//System.out.println(integerTimeToStop+" "+seconds)
			var blnSecondInteger = (integerTimeToStop - seconds <= 0.01)
			if (blnSecondInteger){

				lblTimer.setText(integerTimeToStop);		

				objView.stop()
				setupPlayButton("start", playButtonEnabled)
				objView.repaint()

				integerTimeToStop = -1

				blnDoStop = false
			}
		}
	}
};
var stepsListener = new StepListener(stepsHandler);

var atomIconFile;
var atomIniPosX;

function distributeAll()
{
	objView.reset()

	if (distributeSpecific()){

		objView.clearAll()

		//Set origin ot the world where the car starts
		objView.setWorldOrigin(originPositionPx,objView.getHeight()-20)  //JPartWorld.getPxFromCm(2.5))
		//System.out.println(JPartWorld.getPxFromCm(0.5+atomIniPosX));
		// Car

		ball=createBall(atomIniPosX,0,velArray[index],0,"Location Mark")
		ball.setDraggable(false)
		ball.setIconFromURL(new URL(atomIconFile))//,132,36,false)
		//ball.setVelColor(totalVelColor)
		ball.setVelocityLineThickness(2)

		
//Let's add another stupid thing to this activity: a BALL that travels with the car. The AA collisions are OFF anyway!
		startLine = createBall(atomIniPosX,-0.1,velArray[index],0,"ball2")
		startLine.setShowVelocity(false)
		startLine.setR(4)

//WHAT??????????? MAKING A GRID BY CREATING LINES ON THE GUIPANEL??????????? WHAT????????????????????????????? 

		for(var i = 0; i <= (18 * simulationScale); i+=simulationScale)
		{
				createText(i, i,75);
		}
	} 
}
function createText(text,x,y)
{
	var ele
	var xx,yy
	
	xx=objView.getWorldToPanelCoordinateTuner().tuneX(JPartWorld.getPxFromCm(x))
	//yy=objView.getWorldToPanelCoordinateTuner().tuneY(JPartWorld.getPxFromCm(y))

	ele = PassiveElement.createText(text,xx,y)	
	ele.setLocation(xx,y)

	objView.addPassiveElement(ele)
	return ele
}
function createLine(x0,y0,x1,y1,thickness,center)
{
	var ele
	var xx,yy,ww,hh
	ww=y1
	
	xx=objView.getWorldToPanelCoordinateTuner().tuneX(JPartWorld.getPxFromCm(x0))
	ele = PassiveElement.createLine(xx,y0,xx,ww,thickness)	
	ele.setLocation(xx,y0)

	objView.addPassiveElement(ele)
	return ele
}

function setAtom(atom, mass, color)
{
	atom.setMass(mass);
	atom.setColor(color);
	
	atom.setR(getRadiusFromMass(atom.getMass()))
	atom.setProperty("showvel",true);
	//atom.setProperty("showvelnumber",true);
	atom.setProperty("dotrace",true);
	atom.setTraceProperties(0,1,0.2*objView.getWorldModel().getPxFromCm(1));
}

function createBall(x,y,vx,vy,nameStr)
{
	//Create balls
	var atom = JAtom.createAtom(JPartWorld.getPxFromCm(x),JPartWorld.getPxFromCm(y),vx,vy)
	atom.setMass(1);
	atom.setR(15);
	atom.setName(nameStr)
	objView.addElement(atom);
	//atom.setProperty("showvel",true);
	//atom.setProperty("showvelnumber",true);

	return atom 
}

function createIcon(filename,x,y,w,h,center)
{
	var ele
	var xx,yy,ww,hh
	ww=w
	hh=h
	xx=objView.getWorldToPanelCoordinateTuner().tuneX(JPartWorld.getPxFromCm(x))
	yy=objView.getWorldToPanelCoordinateTuner().tuneY(JPartWorld.getPxFromCm(y))

	ele = PassiveElement.createIcon(filename,xx,yy,ww,hh)	
	ele.setLocation(xx,yy,center)

	objView.addPassiveElement(ele)
	return ele
}

function setupView()
{
	objView.setWorldOrigin(20,60);
	objView.setNeedScreenResolution(30 / simulationScale)
	world.setDesirableSimulationDT(30)
	objView.setBackground(new Color(140/255,214/255,240/255));

	//objView.setGrid(0,objView.getHeight()-30,objView.getWidth(),15)
	objView.setGrid(0,objView.getHeight()-30,620,15)
	objView.getGrid().setIntervalCm(simulationScale,simulationScale)
	objView.setSnapToGrid(true, true)
	world.setDoAACollisions(false)
	objView.setAtomsDragMode(GUIPanel.DRAG_MODE_NONE);
	objView.setDaemonsDragMode(GUIPanel.DRAG_MODE_NONE);
	objView.setShowUnitLabels(true);
	objView.getGrid().setColor(Color.black, Color.black)
}
