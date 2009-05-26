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
var cupTempSlider;
var counterTempSlider;
var glassRadioBtn;
var metalRadioBtn;
var woodRadioBtn;
var stopTime;

var hotCounter = false;

////
//
// variables for graph
//
////
var timer;

var ws_values = datastore_ws.getValues();
var pl_values = datastore_pl.getValues();

var temp_ws = 0;
var temp_pl = 0;

var temp_ws_scaler = 1;
var temp_pl_scaler = 1;

var a = 0.10; // what part of the current actual temperature to use in the smoothed temp
var f = 7/2.8; // K.E. scale factor
var n = (1.6/1.38 * 10000.00); // ~ number of deg K in 1 eV
var b = 0; // increment degC by this amount
var m1 = 1;
var m2 = 0.02;
var constant = 0;   // 273
var timeCounter = 0;
var xMax = 60;
var yMax = 50;
var yMin = -2;
var xMin = -2;

var stepTime = 200;  // how often to take a sample, in ms
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
		if (event.getID() == ModelEvent.MODEL_RESET || event.getID() == ModelEvent.MODEL_INPUT) {
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
						resetGraph();
						// System.err.println("Time at start: " + now());
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
			/* temp_ws_scaler = ((counterTempSlider.getValue()*10)/getCurrentTempForType(Element.ID_WS));
			temp_pl_scaler = ((cupTempSlider.getValue()*10)/getCurrentTempForType(Element.ID_PL));
			
			if (temp_pl_scaler <= 0)
			  temp_pl_scaler = 1;
			if (temp_ws_scaler <= 0)
			  temp_ws_scaler = 1;
		*/
// 			System.err.println("Time at first timer step: " + now());
			try {
 				temp_ws = getCurrentTempForType(Element.ID_WS) * temp_ws_scaler;
 				temp_pl = getCurrentTempForType(Element.ID_PL) * temp_pl_scaler;
			} catch (error) {
				// bad to have an error this early in the run
				// skip this tick
				return;
			}
			hotCounter = false;
			if (temp_ws > temp_pl) {
				// counter temp is greater than the cup
				hotCounter = true;
			}
			// System.err.println("Hotcounter = " + hotCounter);
//  		}			
		} else {
			// calculate the exponential moving average
			try {
				temp_ws = a*(getCurrentTempForType(Element.ID_WS)*temp_ws_scaler)+(1-a)*temp_ws;
			} catch (error) {
				// skip this tick, use the previous value
				System.err.println("Skipping tick (ws) " + timeCounter);
			}
			
			try {
				temp_pl = a*(getCurrentTempForType(Element.ID_PL)*temp_pl_scaler)+(1-a)*temp_pl;
			} catch (error) {
				// skip this tick, use the previous value
				System.err.println("Skipping tick (pl) " + timeCounter);
			}
			// temp_ws = getCurrentTempForType(Element.ID_WS) * temp_ws_scaler;
			// temp_pl = getCurrentTempForType(Element.ID_PL) * temp_pl_scaler;
			
 		}
 		
 		graphValues(temp_ws, temp_pl);
 		timeCounter += counterIncrement;
		
		// graph.repaint()
		
		if (timeCounter > stopTime) {
			end_run();
			timer.stop();
			model.stop();
		}
		// if (timeCounter>30) {
		if (hotCounter) {
			if (Math.round(temp_pl) >= Math.round(temp_ws)) {
					end_run();
					model.stop();
					timer.stop();
			}
		} else {
			if (Math.round(temp_pl) <= Math.round(temp_ws)) {
					end_run();
					model.stop();
					timer.stop();
			}
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
			else if (obj.getTitle().equals("Cup Temperature (degree C)")) {
				cupTempSlider = obj;
			}
			else if (obj.getTitle().equals("Counter Temperature (degree C)")) {
				counterTempSlider = obj;
			}
		}
	}
	
	var radioButtons = page.getEmbeddedComponent(PageRadioButton).values().toArray();
	if (radioButtons != null) {
		for (var i = 0; i < radioButtons.length; i++) {
			var radio = radioButtons[i];
			if (radio.getText().equals("Metal Counter")) {
				metalRadioBtn = radio;
			}
			else if (radio.getText().equals("Glass Counter")) {
				glassRadioBtn = radio;
			}
			else if (radio.getText().equals("Wood Counter")) {
				woodRadioBtn = radio;
			}
		}
	}
	
	var models = page.getEmbeddedComponent(ModelCanvas).values().toArray();
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
	
	// temp_ws = getCurrentTempForType(Element.ID_WS);
	// temp_pl = getCurrentTempForType(Element.ID_PL);
	// graphHeater(temp_ws, temp_pl);
	
	timeCounter = 0;
	yMax = 100;
	xMax = 56;
	graph.setLimitsAxisWorld(xMin,xMax,yMin,yMax);
}

function graphValues(t_ws, t_pl)
{
	// System.err.println(timeCounter + " -- ck: " + t_ck + ", ws: " + t_ws + ", pl: " + t_pl + ", nt: " + t_nt);

	if (t_ws != b) {
		ws_values.add(new Float(timeCounter));
		ws_values.add(new Float(t_ws));
	}
	
	if (t_pl != b) {
		pl_values.add(new Float(timeCounter));
		pl_values.add(new Float(t_pl));
	}
	
	resizeGraph(t_ws, t_pl);
	graph.repaint();
}

function resizeGraph(t1, t2) {
	var max = maximum(t1, t2);
	// System.err.println("==================================");
	// System.err.println("v1: " + t1 + ", v2: " + t2 + ", max: " + max);
	// System.err.print("pmax: " + max);
	// max = maximum(max, t3);
	// System.err.println(", v2: " + t3 + ", max: " + max);
	// System.err.print("omax: " + max);
	// max = maximum(max, t4);
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

function graphHeater(t_ws,t_pl)
{
	graph.reset();
	graphValues(t_ws, t_pl);
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
	// counter temp
	add_computational_input("Counter Temperature", "degC", "0", "100");
	// cup temp
	add_computational_input("Cup Temperature", "degC", "0", "100");
	// observation time
	add_computational_input("Observation Time", "min", "0", "15");
	// counter type
	add_computational_input("Counter Type", "", "", "");
	
	// set up RA's
}

function start_run() {
	if (current_run != null) {
		end_run();
	}
		current_run = context.getOTObject("org.concord.otrunk.modelactivitydata.OTModelRun");
		modelruns.add(current_run);
	  	current_run.setStartTime(now());
	  	
	  	// log all the ci's
	  	log_ci("Counter Temperature", counterTempSlider.getValue()*10);
		log_ci("Cup Temperature", cupTempSlider.getValue()*10);
		log_ci("Observation Time", timeSlider.getValue());
		log_ci("Counter Type", getCurrentlySelectedCounter());
}

function getCurrentlySelectedCounter() {
	if (glassRadioBtn.isSelected()) {
		return "Glass";
	} else if (metalRadioBtn.isSelected()) {
		return "Metal";
	} else if (woodRadioBtn.isSelected()) {
		return "Wood";
	} else {
		return "unknown";
	}
}

function end_run() {
	if (current_run != null) {
		current_run.setEndTime(now());
		// current_run = null;
	}
}

function add_computational_input(ci_name, units, min, max) {
	var comp_inputs = mad.getComputationalInputs();
    // new comp_input
    var ci = context.getOTObject("org.concord.otrunk.modelactivitydata.OTComputationalInput");
    ci.setName(ci_name);
    ci.setUnits(units);

	var range = context.getOTObject("org.concord.otrunk.modelactivitydata.OTRange");
	range.setMinValue(min); // lower case
	range.setMaxValue(max); // upper case
	ci.setRange(range);
    
    // add to comp_inputs
    comp_inputs.add(ci);
    
    // add to ci_array
    ci_array[ci_name] = ci;
}

function log_ci(ci_idx, value) {
	if (current_run == null) { start_run(); }
	
	var ci = ci_array[ci_idx];
	var civ = context.getOTObject("org.concord.otrunk.modelactivitydata.OTComputationalInputValue");
	civ.setTime(now());
	civ.setValue(value);
	civ.setReference(ci);
	current_run.getComputationalInputValues().add(civ);
}

function finalize_logging() {
	end_run();
	mad.setEndTime(now());
}

function now() {
	return System.currentTimeMillis();
}