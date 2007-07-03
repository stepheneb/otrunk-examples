importClass(Packages.java.awt.event.ActionListener)

var viewContainer = context.getViewContainer();
var destination = context.getObject(0);
var button = context.getComponentForObject(1);
var buttonHandler = 
{
	actionPerformed:function(evt)
	{
		viewContainer.getUpdateableContainer().setCurrentObject(destination);
	}
};
var buttonListener = new ActionListener(buttonHandler);

function init() {
	button.addActionListener(buttonListener);
	return true;
}

function save() {
	button.removeActionListener(buttonListener);
	return true;
}