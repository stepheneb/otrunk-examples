importPackage(Packages.org.concord.modeler.event);
importPackage(Packages.org.concord.mw2d.event);
importPackage(Packages.java.awt);
importPackage(Packages.java.lang);

importClass(Packages.java.awt.event.ActionListener);
importClass(Packages.java.net.URL);

var model;
var page = objView.getComponent(0);
var showTimer = true;
var blnDoStop = false;
var integerTimeToStop = -1;
var playButtonEnabled = true
var maxTime = scriptState.get("maxTime")

var pageListener = new PageListener() {
	pageUpdate: function(event) {
		if (event.getType() == PageEvent.PAGE_READ_END) {
			postMWInit();
		}
	}
}

function init() {
	lblTimer.setText("0")
	lblTimer.setFont(new Font(lblTimer.getFont().getName(), lblTimer.getFont().getStyle(),60))
	
	page.addPageListener(pageListener)
	
	runpause_button.addActionListener(actionListener)
	reset_button.addActionListener(actionListener)

	return true;
}

function save() {
	page.removePageListener(pageListener)
	model.removeUpdateListener(updateListener);
	return true;
}

var actionHandler =
{
	actionPerformed: function(evt)
	{
		if (evt.getSource().equals( runpause_button ))
		{
			if(model.isRunning())
			{
				blnDoStop = true
			}
			else
			{
				integerTimeToStop = -1
				// System.err.println("starting model")
				blnDoStop = false
				model.runScript("run")

				setupPlayButton("stop", playButtonEnabled)			 
			}
				
		}
		else if (evt.getSource().equals( reset_button ))
		{
			blnDoStop = false
			
			playButtonEnabled = true
			setupPlayButton("start", playButtonEnabled)
			model.runScript("stop; reset")

			lblTimer.setText("0")
		}
//		else if(evt.getSource().equals(timer))
//		{
//			objView.repaint();
//			timer.stop();
//		}
	}
	
};
var actionListener = new ActionListener(actionHandler);

function setupPlayButton(strL, enabled)
{
	if (strL.equals("start"))
	{
//Get rid of icon
//		startButton.setIcon(playIcon);
		runpause_button.setText("Start")
	}
	else if (strL.equals("stop"))
	{
//Get rid of icon
//		startButton.setIcon(pauseIcon);
		runpause_button.setText("Stop")
	}
	runpause_button.setEnabled(enabled)
}

var updateHandler =
{
	viewUpdated: function(evt)
	{
		seconds = model.getModelTime()/1000

		if (showTimer)
		{
			lblTimer.setText(java.lang.Integer.toString(seconds));
			if ((seconds + 1) > maxTime) {
				blnDoStop = true;
				playButtonEnabled = false
			}
		}
		if (blnDoStop){
			if (integerTimeToStop == -1){
				integerTimeToStop = Math.ceil(seconds)
			}
			//System.out.println(integerTimeToStop+" "+seconds)
			var blnSecondInteger = (integerTimeToStop - seconds <= 0.01)
			if (blnSecondInteger){

				lblTimer.setText(integerTimeToStop);		

				model.runScript("stop")
				setupPlayButton("start", playButtonEnabled)

				integerTimeToStop = -1

				blnDoStop = false
			}
		}
	}
};
var updateListener = new UpdateListener(updateHandler);

function postMWInit() {
	// System.err.println("MW initialized")
	var models = page.getEmbeddedComponent(Class.forName("org.concord.modeler.ModelCanvas")).values().toArray();
	if (models != null) {
		for (var i = 0; i < models.length; i++) {
			// System.err.println("Model initialized")
			model = models[i].getContainer().getModel();
			model.addUpdateListener(updateListener);
		}
	}
}
