importClass(Packages.java.awt.event.ActionListener);
importClass(Packages.org.concord.modeler.event.PageListener);
importClass(Packages.org.concord.modeler.event.PageEvent);
importClass(Packages.org.concord.mw2d.ActionStateListener);
importClass(Packages.java.lang.System);
importClass(Packages.java.lang.Class);


var data;
var runEndTime;
var runCount = 0;
var run;

var localState = true;
var page;

var sparkButton;
var resetButton;
var chemContainer;

var actionStateHandler =
{
	actionStateChanged: function(event)
	{
		var desc = UserAction.getDescription(event.getPreviousState());
		System.err.println(desc);
		desc = UserAction.getDescription(event.getCurrentState());
		System.err.println(desc);
	}
};
var actionStateListener = new ActionStateListener(actionStateHandler);

var buttonHandler =
{
	actionPerformed: function(event)
	{
		if (event.getSource() == sparkButton)
		{
			runEndTime = reportRun();
		}
		else if (event.getSource() == resetButton)
		{
			endRun();
		}
	}
};
var buttonListener = new ActionListener(buttonHandler);

var pageHandler =
{
	pageUpdate: function(event)
	{
		if (event.getType() == PageEvent.PAGE_READ_END)
		{
			var buttonClass = Class.forName("org.concord.modeler.PageButton");
			sparkButton = page.getEmbeddedComponent(buttonClass, 0);
			resetButton = page.getEmbeddedComponent(buttonClass, 1);
			if (sparkButton != null)
				sparkButton.addActionListener(buttonListener);
			if (resetButton != null)
				resetButton.addActionListener(buttonListener);
			var containerClass = Class.forName("org.concord.mw2d.ui.ChemContainer");
			chemContainer = page.getEmbeddedComponent(containerClass, 4);
			if (chemContainer != null)
			{
				System.err.println("have chem container");
				chemContainer.getView().addActionStateListener(actionStateListener);
			}
			else
				System.err.println("no chem container");
		}
	}
};
var pageListener = new PageListener(pageHandler);


// Initialize the listeners.
//page = context.getComponentForObject(0).getComponent(0);

//page = context.viewContext.getComponentByObject(mwModelRef).getComponent(0);
page = mwModelComponent.getComponent(0);
page.addPageListener(pageListener);

var contents = context.getContents();
var dataSet = context.getOTObject("org.concord.otrunk.modelactivitydata.OTModelActivityData");
var modelRuns = dataSet.getModelRuns();

function init() {
	declareActivityData();
	return true;
}

function declareActivityData()
{
	dataSet.setName("Chemical Reactions");
	dataSet.setStartTime(System.currentTimeMillis());
	dataSet.setEndTime(0);
	contents.add(dataSet);
}

function reportRun()
{
	run = context.getOTObject("org.concord.otrunk.modelactivitydata.OTModelRun")
	run.setStartTime(System.currentTimeMillis());
	run.setEndTime(0);
	runCount++
	modelRuns.add(run);
	return 0;
}

function endRun()
{
	System.err.println("Ending Run");
	if (runCount > 0)
	{
		if (runEndTime != null)
		{
			run.setEndTime(System.currentTimeMillis());
		}
		runEndTime = null;
		runCount--;
	}
}

function save()
{
	//////////////////
	// Saving research data
	endRun();
	dataSet.setEndTime(System.currentTimeMillis());
	//////////////////
}
