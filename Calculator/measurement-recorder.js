importPackage(Packages.java.lang);
importPackage(Packages.java.util);
importPackage(Packages.java.io);
importPackage(Packages.javax.imageio);
importPackage(Packages.org.concord.swing.util);
importPackage(Packages.org.concord.otrunk.ui);
importPackage(Packages.org.concord.otrunk.ui.notebook);
importPackage(Packages.org.concord.data.state);
importPackage(Packages.edu.colorado.phet.cck.piccolo_cck);
importPackage(Packages.edu.colorado.phet.cck.model);
importPackage(Packages.edu.colorado.phet.cck.model.components);
// importClass(Packages.edu.colorado.phet.cck.piccolo_cck.MultimeterModel.Listener);

var otNotebookObject = context.getObject("notebook");
var cckModule = context.getViewForObject("cck_model").getModule();
var apparatusPanel = context.getComponentForObject("cck_model");

var previousValue = Double.NaN;

var firstMeasurement = true; //Checks to see if this is the first measurement
var infoCards = context.getViewForObject("infoCards");

var content = context.getContents();
var logTextObject = context.getOTObject("org.concord.otrunk.ui.OTText");
logTextObject.setText("my text");
content.add(logTextObject);

function init() {
	multimeter.addListener(multimeterHandler);
	createResistor();
	return true;
}

function save() {
	return true;
}

var multimeter = cckModule.getMultimeterModel();

var multimeterHandler = new MultimeterModel.Listener() {			
	multimeterChanged: function()
	{
		var value = multimeter.getCurrentValue();

		if(Double.isNaN(value) || Double.compare(previousValue, value) == 0) {
			previousValue = value;
			return;
		}
		else {			//we've made a valid measurement
			if(firstMeasurement){
				firstMeasurement = false;
				infoCards.setCurrentCard("firstMeasurementText");
			}
			previousValue = value;
			var units = "";
			var state = multimeter.getState();
			if (state == MultimeterModel.AMMETER_STATE) {
				units = "A";
			}
			else if (state == MultimeterModel.OHMMETER_STATE) {
				units = "Ω";
			}
			else if (state == MultimeterModel.VOLTMETER_STATE) {
				units = "V";
			}
			
			logNotebook(value, units);
		}
	}
}

function logNotebook(value, units) {

		//the following is taken from org.concord.otrunk.ui.notebook

		var list = otNotebookObject.getEntries(); //OTObjectList
		var measurement = null; //OTNotebookMeasurement
		var image = null; //OTImage
		var uv = null; //OTUnitValue
		var notes = null; //OTText
		// var transform = AffineTransform.getScaleInstance(0.30, 0.30);
		// var scaleTransform = new AffineTransformOp(transform, null);

		measurement = otNotebookObject.getOTObjectService().createObject(OTNotebookMeasurement);
		image = otNotebookObject.getOTObjectService().createObject(OTImage);
		uv = otNotebookObject.getOTObjectService().createObject(OTUnitValue);
		notes = otNotebookObject.getOTObjectService().createObject(OTText);

		//creating screenshot for image
		var bi = ComponentScreenshot.getScreenshot(apparatusPanel); //BufferedImage
		//var biScale = new BufferedImage(java.lang.Integer(bi.getWidth() * 0.30), java.lang.Integer(bi.getHeight() * 0.30), bi.getType());
		//scaleTransform.filter(bi, biScale);
		var baos = new ByteArrayOutputStream(1024);
		ImageIO.write(bi, "png", baos);
		baos.flush();
		image.setImageBytes(baos.toByteArray());
		baos.close();

		notes.setText("Screenshot taken at " + (new java.util.Date()));
				
		uv.setValue(value);
		// System.err.println("Units: " + units);
		uv.setUnit(java.lang.String(units));
				
		measurement.setImage(image);
		measurement.setNotes(notes);
		measurement.setUnitValue(uv);
				
		list.add(measurement);
}

function createResistor()
{
	System.out.println("cckModule class = " + cckModule.getClass())
	var resistorLength = 1.7 * CCKModel.RESISTOR_DIMENSION.getLength();
	var resistorHeight = 1.7 * CCKModel.RESISTOR_DIMENSION.getHeight();
	var x1 = 4.5;
	var y1 = 2;
	var x2 = x1 + resistorLength;
	var y2 = y1;
	var randomGen = new java.util.Random;
	var random = (randomGen.nextInt(20) * 5) + 5;
	var circuit = cckModule.circuit;
	System.out.println(circuit.getClass().toString())

	startJunction = new Junction(x1, y1);
	endJunction = new Junction(x2, y2);

	var newBranch = new Resistor(circuit.getKirkhoffListener(), startJunction, endJunction, resistorLength, resistorHeight);
	newBranch.setResistance(java.lang.Double(random));
	newBranch.setVisibleColorBands(false);
//	newBranch.setMovable(true);
	newBranch.setDebugLabel("#Ringless Resistor");
	
	cckModule.getCircuit().addBranch(newBranch);
	circuitGraphic = cckModule.getCircuitGraphic();
	circuitGraphic.addGraphic(newBranch);

	var menu = circuitGraphic.getGraphic(newBranch).getMenu();
	var menuComponent = menu.getMenuComponent();
	var menuItems = menuComponent.getSubElements();

	menuItems[0].setEnabled(false);
	menuItems[1].setEnabled(false);
	menuItems[2].setEnabled(false);
}