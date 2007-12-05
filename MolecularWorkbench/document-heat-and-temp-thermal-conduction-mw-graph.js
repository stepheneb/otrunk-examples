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
var cupSlider;
var counterSlider;

var metalCounter;
var glassCounter;
var woodCounter;

var tempSliderScale = 10;

var stopTime;

var timer;
var timeCounter = 0;

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
			if (timer.isRunning())
			{
				timer.stop();
				end_run();
				timeCounter = 0;
			}
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
				timer.stop();
				end_run();
				timeCounter = 0;
			}
		} else if (event.getID() == ModelEvent.MODEL_RUN) {
			// System.err.println("Start action recieved");
			stopTime = timeSlider.getValue()*60;
			if (! timer.isRunning()) {
				if (timeCounter == 0) {
					// only start a run if reset has been clicked
					// System.err.println("Stop time is: " + stopTime);
					start_run();
					log_all_cis();
				}
				// System.err.println("Starting timer");
				timer.start();
			}
		} else if (event.getID() == ModelEvent.MODEL_STOP) {
			// System.err.println("Stop action recieved");
			if (timer.isRunning())
			{
				// System.err.println("Stopping timer");
				timer.stop();
				end_run();
			}
		}
		else if (event.getID() == ModelEvent.MODEL_INPUT) {
			// also end the run and reset the timer if the model file is reloaded
			timeCounter = 0;
			end_run();
			current_run = null;
		}
	}
}

var timerHandler =
{ 
	actionPerformed:function(evt)
	{
		// System.err.println("timer run: " + timeCounter);
		if (! model.isRunning()) {
			timer.stop();
			end_run();
		}
		
		timeCounter += counterIncrement;
		if (timeCounter > stopTime) {
			timer.stop();
			model.stop();
			end_run();
		}

	}
}
var timerListener = new ActionListener(timerHandler);

function postMWInit() {
	
	var pageComps = page.getEmbeddedComponent(Class.forName("org.concord.modeler.PageButton")).values().toArray();
	if (pageComps != null) {
		for (var i = 0; i < pageComps.length; i++) {
			var obj = pageComps[i];
			if (obj.getText().equals("Reset")) {
				resetButton = obj;
			}
		}
	}
	resetButton.addActionListener(resetButtonListener);
	
	var sliderComps = page.getEmbeddedComponent(Class.forName("org.concord.modeler.PageSlider")).values().toArray();
	if (sliderComps != null) {
		for (var i = 0; i < sliderComps.length; i++) {
			var obj = sliderComps[i];
			// System.err.println(obj.getTitle());
			if (obj.getTitle().equals("Observation Time (Minute)")) {
				timeSlider = obj;
			}
			else if (obj.getTitle().equals("Cup Temperature (degree C)")) {
				cupSlider = obj;
			}
			else if (obj.getTitle().equals("Counter Temperature (degree C)")) {
				counterSlider = obj;
			}
		}
	}
	
	var radioButtons = page.getEmbeddedComponent(Class.forName("org.concord.modeler.PageRadioButton")).values().toArray();
	if (radioButtons != null) {
		for (var i = 0; i < radioButtons.length; i++) {
			var obj = radioButtons[i];
			// System.err.println(obj.getTitle());
			if (obj.getText().equals("Glass Counter")) {
				glassCounter = obj;
			}
			else if (obj.getText().equals("Metal Counter")) {
				metalCounter = obj;
			}
			else if (obj.getText().equals("Wood Counter")) {
				woodCounter = obj;
			}
		}
	}
	
	var models = page.getEmbeddedComponent(Class.forName("org.concord.modeler.ModelCanvas")).values().toArray();
	if (models != null) {
		for (var i = 0; i < models.length; i++) {
			model = models[i].getContainer().getModel();
			model.addModelListener(modelListener);
		}
	}
}

function init() {
	timer = new Timer(stepTime, timerListener);

	init_logging();
	return true;
}

function save() {
	end_run();
	finalize_logging();
	return true;
}

//////////
// Logging stuff
//////////

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
	  add_computational_input("Cup Temperature", "degC", "0", "100");
	  add_computational_input("Counter Temperature", "degC", "0", "100");
	  add_computational_input("Counter Type", "", "", "");
	// set up RA's
}

function add_computational_input(ci_name, units, min, max) {
	var comp_inputs = mad.getComputationalInputs();
    // new comp_input
    var ci = context.getOTObject("org.concord.otrunk.modelactivitydata.OTComputationalInput");
    ci.setName(ci_name);
    ci.setUnits(units);
    var range = context.getOTObject("org.concord.otrunk.modelactivitydata.OTRange");
    range.setMinValue(min);
    range.setMaxValue(max);
    ci.setRange(range);
    // add to comp_inputs
    comp_inputs.add(ci);
    
    // add to ci_array
    ci_array[ci_name] = ci;
}

function add_representational_attribute(ra_name, values) {
	var ras = mad.getRepresentationalAttributes();
	var ra = context.getOTObject("org.concord.otrunk.modelactivitydata.OTRepresentationalAttribute");
	ra.setName(ra_name);
	if (values != null) {
		var vals = ra.getValueList();
		for (i=0; i<values.length; i++) {
			// FIXME: skip for now
			// vals.add(values[i]);
		}
	}
	ras.add(ra);
	ra_array[ra_name] = ra;
}

function start_run() {
	if (current_run != null) {
		end_run();
	}
	
	if (timeCounter == 0) {
		current_run = context.getOTObject("org.concord.otrunk.modelactivitydata.OTModelRun");
		modelruns.add(current_run);
	  	current_run.setStartTime(now());
	}
}

function end_run() {
	if (current_run != null) {
		current_run.setEndTime(now());
		// current_run = null;
	}
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

function log_ra(ra_idx, value) {
	if (current_run == null) { start_run(); }
	
	var ra = ra_array[ra_idx];
	var rav = context.getOTObject("org.concord.otrunk.modelactivitydata.OTRepresentationalAttributeValue");
	rav.setTime(now());
	rav.setValue(value);
	rav.setReference(ra);
	current_run.getRepresentationalAttributeValues().add(rav);
}

function finalize_logging() {
	end_run();
	mad.setEndTime(now());
}

function now() {
	return System.currentTimeMillis();
}

function log_all_cis() {
	log_ci("Cup Temperature", (cupSlider.getValue() * tempSliderScale) + "");
	log_ci("Counter Temperature", (counterSlider.getValue() * tempSliderScale) + "");
	log_ci("Counter Type", getCounterType());
}

function getCounterType() {
	if (metalCounter.isSelected()) { return "Metal"; }
	else if (glassCounter.isSelected()) { return "Glass"; }
	else if (woodCounter.isSelected()) { return "Wood"; }
	else { return "Unknown"; }
}