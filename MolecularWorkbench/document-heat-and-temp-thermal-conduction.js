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

var ck_values = datastore_ck.getValues();
var ws_values = datastore_ws.getValues();
var pl_values = datastore_pl.getValues();
var nt_values = datastore_nt.getValues();

var temp_ck = 0;
var temp_ws = 0;
var temp_pl = 0;
var temp_nt = 0;

var a = 0.02; // what part of the current actual temperature to use in the smoothed temp
var f = 5; // K.E. scale factor
var n = (1.6/1.38 * 10000.00);
var b = 0; // base temperature - 0 KE will equal this
var m1 = 1;
var m2 = 0.002;
var constant = 0;   // 273
var timeCounter = 0;
var xMax = 56;
var yMax = 105;
var yMin = -5;
var xMin = -2;

var page = modelComponent.getComponent(0);
var model;

var runButtonHandler =
{
	actionPerformed :function(evt)
	{
		// System.err.println("Start action recieved");
		if (! timer.isRunning()) {
			if (timeCounter == 0)
			{
					temp_ck = getCurrentTempForType(Element.ID_CK);
					temp_ws = getCurrentTempForType(Element.ID_WS);
					temp_pl = getCurrentTempForType(Element.ID_PL);
					temp_nt = getCurrentTempForType(Element.ID_NT);
					graphHeater(temp_ck, temp_ws, temp_pl, temp_nt);
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
		temp_ck = a*getCurrentTempForType(Element.ID_CK)+(1-a)*temp_ck;
		temp_ws = a*getCurrentTempForType(Element.ID_WS)+(1-a)*temp_ws;
		temp_pl = a*getCurrentTempForType(Element.ID_PL)+(1-a)*temp_pl;
		temp_nt = a*getCurrentTempForType(Element.ID_NT)+(1-a)*temp_nt;
		graphValues(temp_ck, temp_ws, temp_pl, temp_nt);

		// graph.repaint()
		timeCounter += 0.5;
		//if (timeCounter>30)
		// if ((Math.round(temp_ck) == Math.round(temp_ws))) {
		//  if (Math.round(temp_ck) !=1*b)
		// {
		// 	model.stop();
		// 	timer.stop();
			//currentNode.next();
		// }
		// }
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
					}
				}
	
	initialGraph();
	resetGraph();
}

function save() {
	return true;
}

function getCurrentTempForType(type) {
	// System.err.println("Kin for type " + type + ": " + model.getKinForType(type));
	return ((1*m2)*(n*f*model.getKinForType(type)-constant)+b*1);
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
	
	temp_ck = getCurrentTempForType(Element.ID_CK);
	temp_ws = getCurrentTempForType(Element.ID_WS);
	temp_pl = getCurrentTempForType(Element.ID_PL);
	temp_nt = getCurrentTempForType(Element.ID_NT);
	graphHeater(temp_ck, temp_ws, temp_pl, temp_nt);
	
	timeCounter = 0;
	yMax = 100;
	xMax = 56;
	graph.setLimitsAxisWorld(xMin,xMax,yMin,yMax);
}

function graphValues(t_ck, t_ws, t_pl, t_nt)
{
	// System.err.println("adding v1: " + timeCounter + ", " + t1);
	if (t_ck != b) {
		ck_values.add(new Float(timeCounter));
		ck_values.add(new Float(t_ck));
	}
	// System.err.println("adding v2: " + timeCounter + ", " + t2);
	if (t_ws != b) {
	ws_values.add(new Float(timeCounter));
	ws_values.add(new Float(t_ws));
	}
	
	if (t_pl != b) {
		pl_values.add(new Float(timeCounter));
		pl_values.add(new Float(t_pl));
	}
	
	if (t_nt != b) {
		nt_values.add(new Float(timeCounter));
		nt_values.add(new Float(t_nt));
	}
	
	resizeGraph(t_ck, t_ws, t_pl, t_nt);
	graph.repaint();
}

function resizeGraph(t1, t2, t3, t4) {
	var max = maximum(t1, t2);
	max = maximum(max, t3);
	max = maximum(max, t4);
	
	if (max > (yMax-5)) {
		// System.err.println("resizing y axis: " + (t2+5));
		yMax = (t2+5);
	}
	
	if (timeCounter > (xMax - 5)) {
		// System.err.println("resizing x axis: " + (timeCounter+5));
		xMax = (timeCounter + 5);
	}
	graph.setLimitsAxisWorld(xMin,xMax,yMin,yMax);
}

function maximum(v1, v2) {
	if (v2 > v1) {
		return v2;
	}
	
	return v1;
}

function graphHeater(t_ck,t_ws,t_pl,t_nt)
{
	graph.reset();
	graphValues(t_ck, t_ws, t_pl, t_nt);
	graph.repaint();
}