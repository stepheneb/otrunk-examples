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

var pageListener = new PageListener() {
	pageUpdate: function(event) {
		if (event.getType() == PageEvent.PAGE_READ_END) {
			postMWInit();
		}
	}
}
page.addPageListener(pageListener);

var modelListener = new ModelListener() {
	modelUpdate: function(event) {
		if (event.getID() == ModelEvent.MODEL_RESET) {
			System.err.println("Reset action recieved");
			if (timer.isRunning())
			{
				// System.err.println("Stopping timer");
				timer.stop();
			}
			resetGraph();
		} else if (event.getID() == ModelEvent.MODEL_RUN) {
			System.err.println("Start action recieved");
			if (! timer.isRunning()) {
				if (timeCounter == 0) {
						temp_ck = getCurrentTempForType(Element.ID_CK);
						temp_ws = getCurrentTempForType(Element.ID_WS);
						temp_pl = getCurrentTempForType(Element.ID_PL);
						temp_nt = getCurrentTempForType(Element.ID_NT);
						graphHeater(temp_ck, temp_ws, temp_pl, temp_nt);
				}
				
				// System.err.println("Starting timer");
				timer.start();
			}
		} else if (event.getID() == ModelEvent.MODEL_STOP) {
			System.err.println("Stop action recieved");
			if (timer.isRunning())
			{
				// System.err.println("Stopping timer");
				timer.stop();
			}
		}
	}
}

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
		if (timeCounter>30) {
			if (  (Math.round(temp_ck) <= Math.round(temp_ws)) ||
				  (Math.round(temp_ck) <= Math.round(temp_pl)) ||
				  (Math.round(temp_ck) <= Math.round(temp_nt)) ) {
					model.stop();
					timer.stop();
			}
		}
	}
}
var timerListener = new ActionListener(timerHandler);

function init() {
	timer = new Timer(500, timerListener);

	return true;
}

function postMWInit() {
				var models = page.getEmbeddedComponent(Class.forName("org.concord.modeler.ModelCanvas")).values().toArray();
				if (models != null) {
					for (var i = 0; i < models.length; i++) {
						model = models[i].getContainer().getModel();
						model.addModelListener(modelListener);
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
	System.err.println("==================================");
	System.err.println("v1: " + t1 + ", v2: " + t2 + ", max: " + max);
	System.err.print("v1: " + max);
	max = maximum(max, t3);
	System.err.println(", v2: " + t3 + ", max: " + max);
	System.err.print("v1: " + max);
	max = maximum(max, t4);
	System.err.println(", v2: " + t4 + ", max: " + max);
	
	if (max > (yMax-5)) {
		// System.err.println("resizing y axis: " + (t2+5));
		yMax = (max+5);
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