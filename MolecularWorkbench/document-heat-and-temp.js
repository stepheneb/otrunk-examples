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
var heatChange = 0.5;
var dt = 0.5; 
var dataProducer,dataProducer;
var d1Values = datastore1.getValues();
var d2Values = datastore2.getValues();
var temp =0,temp2=0;
var a = 0.02;
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
			start_run();
			log_ci("Cup Temperature", temp + "");
			log_ci("Counter Temperature", temp2 + "");
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
				end_run();
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
				end_run();
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
			end_run();
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
	init_logging();
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
						// System.err.println("The model is a: " + model.getClass().getName());
						viewContainer = models[i].getContainer().getView();
						viewContainer.addMouseListener(mouseListener);
					}
				}
				
				viewContainer.getPointHeater().setAmount(heatChange);
				
	initialGraph();
	resetGraph();
}

function save() {
	finalize_logging()
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