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
var timeSlider;
var stopTime;

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

var temp_ck_scaler = 1;
var temp_ws_scaler = 1;
var temp_pl_scaler = 1;
var temp_nt_scaler = 1;

var a = 0.02; // what part of the current actual temperature to use in the smoothed temp
var f = 10; // K.E. scale factor
var n = (1.6/1.38 * 10000.00); // ~ number of deg K in 1 eV
var b = 0; // increment degC by this amount
var m1 = 1;
var m2 = 0.002;
var constant = 0;   // 273
var timeCounter = 0;
var xMax = 60;
var yMax = 50;
var yMin = -2;
var xMin = -2;

var stepTime = 500;
var counterIncrement = stepTime/1000;

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

var resetButtonHandler =
{
	actionPerformed :function(evt)
	{
		// System.err.println("Reset action recieved");
			if (timer.isRunning())
			{
				// System.err.println("Stopping timer");
				end_run();
				timer.stop();
			}
			resetGraph();
	}
}
var resetButtonListener = new ActionListener(resetButtonHandler);

var modelListener = new ModelListener() {
	modelUpdate: function(event) {
		if (event.getID() == ModelEvent.MODEL_RESET) {
			// System.err.println("Reset action recieved");
			if (timer.isRunning())
			{
				// System.err.println("Stopping timer");
				end_run();
				timer.stop();
			}
			resetGraph();
		} else if (event.getID() == ModelEvent.MODEL_RUN) {
			// System.err.println("Start action recieved");
			if (! timer.isRunning()) {
				stopTime = timeSlider.getValue()*60;
				// System.err.println("Stop time is: " + stopTime);
				if (timeCounter == 0) {
					  // record the temperature now -- this is what the sliders are set to
						temp_ck = getCurrentTempForType(Element.ID_CK);
						temp_ws = getCurrentTempForType(Element.ID_WS);
						temp_pl = getCurrentTempForType(Element.ID_PL);
						temp_nt = getCurrentTempForType(Element.ID_NT);
						// graphHeater(temp_ck, temp_ws, temp_pl, temp_nt);
						start_run();
				}
				
				// System.err.println("Starting timer");
				timer.start();
			}
		} else if (event.getID() == ModelEvent.MODEL_STOP) {
			// System.err.println("Stop action recieved");
			if (timer.isRunning())
			{
				// System.err.println("Stopping timer");
				end_run();
				timer.stop();
			}
		}
	}
}

var timerHandler =
{ 
	actionPerformed:function(evt)
	{
		// System.err.println("timer run: " + timeCounter);
		if (! model.isRunning()) {
			end_run();
			timer.stop();
		}
		
		if (timeCounter == 0) {
			// for some reason the temp recorded here is always substantially lower than the temp the sliders are set to
			// so using our first recording, calculate a scaling factor
			temp_ck_scaler = (temp_ck/getCurrentTempForType(Element.ID_CK));
			temp_ws_scaler = (temp_ws/getCurrentTempForType(Element.ID_WS));
			temp_pl_scaler = (temp_pl/getCurrentTempForType(Element.ID_PL));
			temp_nt_scaler = (temp_nt/getCurrentTempForType(Element.ID_NT));
			
			if (temp_ck_scaler <= 0)
			  temp_ck_scaler = 1;
			if (temp_pl_scaler <= 0)
			  temp_pl_scaler = 1;
			if (temp_nt_scaler <= 0)
			  temp_nt_scaler = 1;
			if (temp_ws_scaler <= 0)
			  temp_ws_scaler = 1;
		
			temp_ck = getCurrentTempForType(Element.ID_CK) * temp_ck_scaler;
			temp_ws = getCurrentTempForType(Element.ID_WS) * temp_ws_scaler;
			temp_pl = getCurrentTempForType(Element.ID_PL) * temp_pl_scaler;
			temp_nt = getCurrentTempForType(Element.ID_NT) * temp_nt_scaler;
			graphHeater(temp_ck, temp_ws, temp_pl, temp_nt);
		} else {
			// calculate the exponential moving average
			temp_ck = a*(getCurrentTempForType(Element.ID_CK)*temp_ck_scaler)+(1-a)*temp_ck;
			temp_ws = a*(getCurrentTempForType(Element.ID_WS)*temp_ws_scaler)+(1-a)*temp_ws;
			temp_pl = a*(getCurrentTempForType(Element.ID_PL)*temp_pl_scaler)+(1-a)*temp_pl;
			temp_nt = a*(getCurrentTempForType(Element.ID_NT)*temp_nt_scaler)+(1-a)*temp_nt;
			graphValues(temp_ck, temp_ws, temp_pl, temp_nt);
		}
		
		// graph.repaint()
		timeCounter += counterIncrement;
		if (timeCounter > stopTime) {
			end_run();
			timer.stop();
			model.stop();
		}
		// if (timeCounter>30) {
			if (  (Math.round(temp_ck) <= Math.round(temp_ws)) ||
				  (Math.round(temp_ck) <= Math.round(temp_pl)) ||
				  (Math.round(temp_ck) <= Math.round(temp_nt)) ) {
					end_run();
					model.stop();
					timer.stop();
			}
		// }
	}
}
var timerListener = new ActionListener(timerHandler);

function init() {
	timer = new Timer(stepTime, timerListener);

	init_logging();
	return true;
}

function postMWInit() {
	
	var pageComps = page.getEmbeddedComponent(PageButton).values().toArray();
	if (pageComps != null) {
		for (var i = 0; i < pageComps.length; i++) {
			var obj = pageComps[i];
			if (obj.getText().equals("Reset")) {
				resetButton = obj;
			}
		}
	}
	resetButton.addActionListener(resetButtonListener);
	
	var sliderComps = page.getEmbeddedComponent(PageSlider).values().toArray();
	if (sliderComps != null) {
		for (var i = 0; i < sliderComps.length; i++) {
			var obj = sliderComps[i];
			// System.err.println(obj.getTitle());
			if (obj.getTitle().equals("Observation Time (Minute)")) {
				timeSlider = obj;
			}
		}
	}
	
	var models = page.getEmbeddedComponent(ModelCanvas).values().toArray();
	if (models != null) {
		for (var i = 0; i < models.length; i++) {
			model = models[i].getMdContainer().getModel();
			model.addModelListener(modelListener);
		}
	}
	
	initialGraph();
	resetGraph();
}

function save() {
	finalize_logging();
	return true;
}

function getCurrentTempForType(type) {
	// System.err.println(System.currentTimeMillis() + "," + type + "," + ((1*m2)*(n*f*model.getKinForType(type)-constant)+b*1));
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
	// System.err.println(timeCounter + " -- ck: " + t_ck + ", ws: " + t_ws + ", pl: " + t_pl + ", nt: " + t_nt);
	if (t_ck != b) {
		ck_values.add(new Float(timeCounter));
		ck_values.add(new Float(t_ck));
	}

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
	// System.err.println("==================================");
	// System.err.println("v1: " + t1 + ", v2: " + t2 + ", max: " + max);
	// System.err.print("pmax: " + max);
	max = maximum(max, t3);
	// System.err.println(", v2: " + t3 + ", max: " + max);
	// System.err.print("omax: " + max);
	max = maximum(max, t4);
	// System.err.println(", v2: " + t4 + ", max: " + max);
	
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

// for logging
var mad;
var modelruns;
var current_run;
var ci_array = new Object();
var ra_array = new Object();

function init_logging() {
	// set up MAD
	mad = context.getOTObject("org.concord.otrunk.modelactivitydata.OTModelActivityData");
	otContents.add(mad);
	
    mad.setName("Thermodynamics Temperature Conductivity Model");
    modelruns = mad.getModelRuns();
    
    mad.setStartTime(now());
	// set up CI's
	// set up RA's
}

function start_run() {
	if (current_run != null) {
		end_run();
	}
		current_run = context.getOTObject("org.concord.otrunk.modelactivitydata.OTModelRun");
		modelruns.add(current_run);
	  	current_run.setStartTime(now());
}

function end_run() {
	if (current_run != null) {
		current_run.setEndTime(now());
		// current_run = null;
	}
}

function finalize_logging() {
	end_run();
	mad.setEndTime(now());
}

function now() {
	return System.currentTimeMillis();
}