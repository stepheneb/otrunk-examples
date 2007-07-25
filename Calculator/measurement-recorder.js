importPackage(Packages.java.lang);
importPackage(Packages.java.util);
importPackage(Packages.java.io);
importPackage(Packages.javax.imageio);
importPackage(Packages.org.concord.swing.util);
importPackage(Packages.org.concord.otrunk.ui);
importPackage(Packages.org.concord.otrunk.ui.notebook);
importPackage(Packages.org.concord.data.state);
importPackage(Packages.edu.colorado.phet.cck.piccolo_cck);
// importClass(Packages.edu.colorado.phet.cck.piccolo_cck.MultimeterModel.Listener);

var otNotebookObject = context.getObject("notebook");
var cckModule = context.getViewForObject("cck_model").getModule();
var apparatusPanel = context.getComponentForObject("cck_model");

function init() {
	multimeter.addListener(multimeterHandler);
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

		if(Double.isNaN(value)) {
			return;
		}
		else {
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
		System.err.println("Units: " + units);
		uv.setUnit(java.lang.String(units));
				
		measurement.setImage(image);
		measurement.setNotes(notes);
		measurement.setUnitValue(uv);
				
		list.add(measurement);
}