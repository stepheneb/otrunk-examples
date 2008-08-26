importPackage(Packages.org.concord.modeler.event)
importPackage(Packages.java.lang)

var page = objView.getComponent(0);
var model;

var pageListener = new PageListener() {
	pageUpdate: function(event) {
		if (event.getType() == PageEvent.PAGE_READ_END) {
			postMWInit();
		}
	}
}

var modelListener = new ModelListener() {
	modelUpdate: function(event) {
		if (event.getID() == ModelEvent.MODEL_RESET || event.getID() == ModelEvent.MODEL_INPUT) {
			end_run()
		} else if (event.getID() == ModelEvent.MODEL_RUN) {
			start_run()
			log_location()
		} else if (event.getID() == ModelEvent.MODEL_STOP) {
			end_run()
		}
	}
}

function init() {
	page.addPageListener(pageListener);
	init_logging()
	return true;
}

function save() {
	objView.removeSimulationListener(simulationListener)
	finalize_logging()
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
}

function log_location() {
	 var x = model.getModelTime()/1000;
	 var cmX = Math.round(x)
	 System.err.println("X is: " + x + ", " + cmX)
	 log_ci("Location", cmX)
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
	
    mad.setName("Hanging With Friends - Vector Motion Model");
    modelruns = mad.getModelRuns();
    
    mad.setStartTime(now());
	// set up CI's
	  // Location of the object
	  add_computational_input("Location");

	  // reset event
	  // add_representational_attribute("Reset Event", new Array("Reset"));
}

function add_computational_input(ci_name) {
	var comp_inputs = mad.getComputationalInputs();
    // new comp_input
    var ci = context.getOTObject("org.concord.otrunk.modelactivitydata.OTComputationalInput");
    ci.setName(ci_name);
    
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
	if (current_run == null) {
		current_run = context.getOTObject("org.concord.otrunk.modelactivitydata.OTModelRun");
		modelruns.add(current_run);
	  	current_run.setStartTime(now());
	}
}

function end_run() {
	if (current_run != null) {
		current_run.setEndTime(now());
		current_run = null;
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