importPackage(java.lang);
importClass(Packages.org.concord.framework.otrunk.OTChangeListener);

var changeHandler =
{
	stateChanged: function(evt)
	{		
		// Set the object of the OTChildView of the split pane
		splitPane.second.object = tree.selectedObject;
		
		// send in a dummy ot change, so the split pane updates
		// because all we did was change the viewChild object the splitPane will
		// not get the change event.
		splitPane.notifyOTChange("second", "set", null);
	}
};
var changeListener = new OTChangeListener(changeHandler);

function initPrototypeCopy(model, prototypeCopy)
{
	prototypeCopy.first.root = model;
	prototypeCopy.first.selectedObject = model;
	prototypeCopy.second.object = model;
}

var tree;
var splitPane;

function initView(model, prototypeCopy)
{
	splitPane = prototypeCopy;
	tree = prototypeCopy.first;
	System.err.println("script adding change listener: " + changeListener);	
	tree.addOTChangeListener(changeListener);
}

function close()
{
	// Do nothing right now.
}
