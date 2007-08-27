function initView(model, prototypeCopy)
{
	prototypeCopy.variables.get(0).reference = model;
	
	var propertyReferences = prototypeCopy.variables.get(1).reference.children;

	for(i=0; i<propertyReferences.size(); i++){
		propertyReferences.get(i).reference = model;
	}
}

function close()
{
	// Do nothing right now.
}

