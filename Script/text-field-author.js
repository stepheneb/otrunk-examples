importClass(Packages.org.concord.framework.otrunk.OTChangeListener);
importClass(Packages.java.lang.System);

var textField;
var choice;

var normalChoice;
var passwordChoice;

var changeHandler =
{
	stateChanged: function(evt)
	{
		if(evt.source == textField){
			updateView();
		} else if(evt.source == choice){
			updateModel();
		} 
	}
};
var changeListener = new OTChangeListener(changeHandler);


function updateView()
{
	if(textField.isPassword){
		choice.setCurrentChoice(passwordChoice);
	} else {
		choice.setCurrentChoice(normalChoice);
	}
}

function updateModel()
{
	if(choice.getCurrentChoice() == normalChoice){
		textField.isPassword = false;		
	} else if(choice.getCurrentChoice() == passwordChoice){
	    textField.isPassword = true;
	} else {
		throw new IllegalStateException(
			"unsupported choice selected: " + choice.getCurrentChoice()); 
	}
}

function initView(model, prototypeCopy)
{
	this.textField = model;
	this.choice = prototypeCopy;

	modelType = typeof model;
	System.out.println("model type: " + modelType);

	normalChoice = prototypeCopy.choices.get(0);
	
	System.out.println("normalchoice type: " + (typeof normalChoice));
	
	passwordChoice = prototypeCopy.choices.get(1);

	updateView();
	
	// add a listener to the choice so it can update model if it changes
	choice.addOTChangeListener(changeListener);
	
	// add a listener to the model so it can update the choice if it changes
	textField.addOTChangeListener(changeListener);
	
	// these things could be handled by the outside code and then the script would just
	// have to implement the methods to respond to these changes.
}

function close()
{
	// Do nothing right now.
}

