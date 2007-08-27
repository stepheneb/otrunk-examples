importPackage(java.lang);
importClass(Packages.org.concord.otrunk.view.prototype.OTPropertyReference);
importClass(Packages.org.concord.framework.otrunk.otcore.OTPrimitiveType);
importClass(Packages.org.concord.framework.otrunk.OTChangeListener);

var propertyRef;
var choice;
var otProperty;

var changeHandler =
{
	stateChanged: function(evt)
	{		
	    currentChoice = choice.currentChoice;
	    
	    if(currentChoice.equals(choice.choices.get(0))){
	    	propertyRef.reference.otSet(otProperty, true);
	    } else {
	    	propertyRef.reference.otSet(otProperty, false);
	    }
	}
};
var changeListener = new OTChangeListener(changeHandler);


function initPrototypeCopy(model, prototypeCopy)
{
}

function initView(model, prototypeCopy)
{
	propertyRef = model;
	choice = prototypeCopy;
	otProperty = propertyRef.reference.otClass().getProperty(propertyRef.property);
		
	var modelBool = propertyRef.reference.otGet(otProperty);
	
	if(modelBool){
		choice.currentChoice = prototypeCopy.choices.get(0);
	} else {
		choice.currentChoice = prototypeCopy.choices.get(1);
	}
	
	choice.addOTChangeListener(changeListener);
}

function close()
{
	choice.removeOTChangeListener(changeListener);
}

