importPackage(Packages.java.awt);
importPackage(Packages.java.awt.event);
importPackage(Packages.java.lang);
importPackage(Packages.javax.swing);

importPackage(Packages.org.concord.mw2d.models);
importPackage(Packages.org.concord.modeler);
importPackage(Packages.org.concord.modeler.event);
importPackage(Packages.org.concord.framework.data.stream);

var runButton;
var stopButton;
var resetButton;

////
//
// variables for graph
//
////
var timer;
var dt = 0.5; 
var dataProducer,dataProducer;
var d1Values = datastore1.getValues();
var d2Values = datastore2.getValues();
var temp =0,temp2=0;
var a = 0.02
var f = 2; // K.E. scale factor
var n = (1.6/1.38 * 10000.00);
var b = 20;
var m1 = 1;
var m2 = 0.002;
var constant = 0;   // 273
var timeCounter = 0;
var viewContainer;
var xMax = 56;
var yMax = 100;
var yMin = 0;
var xMin = -2;

var page = modelComponent.getComponent(0);
var model;

var mouseHandler =
{
	mouseClicked:function(evt)
	{
		// System.err.println("Mouse clicked. Src: " + evt.getSource());
		if (evt.getSource().equals(viewContainer))
		{
			// System.err.println("viewContainer clicked");
			if (evt.getSource().getAction() == Packages.org.concord.mw2d.UserAction.HEAT_ID)
			{
				temp = (1*m2)*(n*f*model.getKinForType(Element.ID_CK)-constant)+b*1
				temp2 = (1*m2)*(n*f*model.getKinForType(Element.ID_WS)-constant)+b*1
				graphHeater(temp,temp2);
			}
		}

	}
}
var mouseListener = new MouseListener(mouseHandler);

var runButtonHandler =
{
	actionPerformed :function(evt)
	{
		// System.err.println("Start action recieved");
		if (! timer.isRunning()) {
			if (timeCounter == 0)
			{
					temp = (1*m2)*(n*f*model.getKinForType(Element.ID_CK)-constant)+b*1;
					temp2 =(1*m2)*(n*f*model.getKinForType(Element.ID_WS)-constant)+b*1;
					graphHeater(temp, temp2);
			}
			
			// System.err.println("Starting timer");
			timer.start();
		}
	}
}
var runButtonListener = new ActionListener(runButtonHandler);

var stopButtonHandler =
{
	actionPerformed :function(evt)
	{
		// System.err.println("Stop action recieved");
			if (timer.isRunning())
			{
				// System.err.println("Stopping timer");
				timer.stop();
			}
	}
}
var stopButtonListener = new ActionListener(stopButtonHandler);

var resetButtonHandler =
{
	actionPerformed :function(evt)
	{
		// System.err.println("Reset action recieved");
			if (timer.isRunning())
			{
				// System.err.println("Stopping timer");
				timer.stop();
			}
			resetGraph();
	}
}
var resetButtonListener = new ActionListener(resetButtonHandler);

var pageListener = new PageListener() {
	pageUpdate: function(event) {
		if (event.getType() == PageEvent.PAGE_READ_END) {
			postMWInit();
		}
	}
}
page.addPageListener(pageListener);

var timerHandler =
{ 
	actionPerformed:function(evt)
	{
		// System.err.println("timer run");
		temp = a*((1*m2)*(n*f*model.getKinForType(Element.ID_CK)-constant)+1*b)+(1-a)*temp;
		temp2 = a*((1*m2)*(n*f*model.getKinForType(Element.ID_WS)-constant)+1*b)+(1-a)*temp2;
		graphValues(temp, temp2);

		// graph.repaint()
		timeCounter +=0.5
		//if (timeCounter>30)
		if ((Math.round(temp) == Math.round(temp2))) {
		 if (Math.round(temp) !=1*b)
		{
			model.stop();
			timer.stop();
			//currentNode.next();
		}
		}
	}
}
var timerListener = new ActionListener(timerHandler);

function init() {
	timer = new Timer(500, timerListener);
	// modelComponent.addMouseListener(mouseListener);
	// page.addMouseListener(mouseListener);
	return true;
}

function postMWInit() {
	// System.err.println("Model comp is: " + model.getComponent(0));
				var pageComps = page.getEmbeddedComponent(Class.forName("org.concord.modeler.PageButton")).values().toArray();
				// System.err.println("Page comps are (" + pageComps.length +"): " + pageComps);
				if (pageComps != null) {
					for (var i = 0; i < pageComps.length; i++) {
						var obj = pageComps[i];
						// System.err.println(obj.getText());
						if (obj.getText().equals("Run")) {
							runButton = obj;
						}
						else if (obj.getText().equals("Stop")) {
							stopButton = obj;
						}
						else if (obj.getText().equals("Reset")) {
							resetButton = obj;
						}
					}
				}
				runButton.addActionListener(runButtonListener);
				stopButton.addActionListener(stopButtonListener);
				resetButton.addActionListener(resetButtonListener);
				
				var models = page.getEmbeddedComponent(Class.forName("org.concord.modeler.ModelCanvas")).values().toArray();
				if (models != null) {
					for (var i = 0; i < models.length; i++) {
						model = models[i].getContainer().getModel();
						viewContainer = models[i].getContainer().getView();
						viewContainer.addMouseListener(mouseListener);
					}
				}
				
	initialGraph();
	resetGraph();
}

function save() {
	return true;
}

function initialGraph()
{
	graph.setLimitsAxisWorld(xMin,xMax,yMin,yMax);
	graph.getGrid().getYGrid().setInterval(5);
	graph.getGrid().getXGrid().setInterval(5);
 	// graph.getGrid().getXGrid().setAxisLabel("Time (sec) ");
 	// graph.getGrid().getYGrid().setAxisLabel("Temperature (C) ");
	graph.getToolBar().setVisible(false);
}

function resetGraph() {
	
	graph.reset();
	graphHeater((1*m2)*(n*f*model.getKinForType(Element.ID_CK)-constant)+b*1,
					(1*m2)*(n*f*model.getKinForType(Element.ID_WS)-constant)+b*1);
	timeCounter = 0;
	yMax = 100;
	xMax = 56;
	graph.setLimitsAxisWorld(xMin,xMax,yMin,yMax);
}

function graphValues(t1, t2)
{
	// System.err.println("adding v1: " + timeCounter + ", " + t1);
	d1Values.add(new Float(timeCounter));
	d1Values.add(new Float(t1));
	// System.err.println("adding v2: " + timeCounter + ", " + t2);
	d2Values.add(new Float(timeCounter));
	d2Values.add(new Float(t2));
	resizeGraph(t1, t2);
	graph.repaint();
}

function resizeGraph(t1,t2) {
	if (t1 > t2) {
		if (t1 > (yMax-5)) {
			// System.err.println("resizing y axis: " + (t1+5));
			yMax = (t1+5);
		}
	}
	else if (t2 > (yMax-5)) {
		// System.err.println("resizing y axis: " + (t2+5));
		yMax = (t2+5);
	}
	
	if (timeCounter > (xMax - 5)) {
		// System.err.println("resizing x axis: " + (timeCounter+5));
		xMax = (timeCounter + 5);
	}
	graph.setLimitsAxisWorld(xMin,xMax,yMin,yMax);
}

function graphHeater(t1,t2)
{
	graph.reset();
	graphValues(t1, t2);
	graph.repaint();
}