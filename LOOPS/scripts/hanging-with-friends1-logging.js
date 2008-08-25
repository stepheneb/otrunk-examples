importPackage(Packages.org.concord.framework.simulation)
importPackage(Packages.java.lang)

importClass(Packages.org.concord.collisions.engine.JPartWorld)

var simulationHandler = {
	simulationReset: function(evt) {
		end_run()
	},
	simulationStarted: function(evt) {
		start_run()
		log_location()
	},
	simulationStopped: function(evt) {
		end_run()
	}
};
var simulationListener = new SimulationListener(simulationHandler);

function init() {
	objView.addSimulationListener(simulationListener)
	init_logging()
	return true;
}

function save() {
	objView.removeSimulationListener(simulationListener)
	finalize_logging()
	return true;
}

function log_location() {
	var x = objView.getWorldModel().getAtomByName("Location Mark").getX()
	var cmX = Math.round(JPartWorld.getCmFromPx(x))
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