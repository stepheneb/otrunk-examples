importClass(Packages.java.awt.event.ActionListener)
importPackage(Packages.java.lang);

var viewContainer = context.getViewContainer();
var challenge1 = context.getObject("challenge_one_page");
var challenge2 = context.getObject("challenge_two_page");
var button = context.getComponentForObject(0);
var appState = context.getObject("appState");
var buttonHandler = 
{
	actionPerformed:function(evt)
	{
		var state = appState.getText();
		System.err.println("State is: " + state);
		if (state.compareTo("inChallenge2") == 0) {
			viewContainer.getUpdateableContainer().setCurrentObject(challenge2);
		} else {
			viewContainer.getUpdateableContainer().setCurrentObject(challenge1);
		}
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