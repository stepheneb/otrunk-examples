importPackage(java.lang);
importClass(Packages.org.concord.otrunk.view.prototype.OTPropertyReference);
importClass(Packages.org.concord.framework.otrunk.otcore.OTPrimitiveType);

function initPrototypeCopy(model, prototypeCopy)
{
	prototypeCopy.variables.get(0).reference = model;
	
	var propertyReferences = prototypeCopy.variables.get(1).reference.children;

	// need to add the property references based on the otClass of the model
	var otClass = model.otClass();
	
	var classProperties = otClass.getOTAllClassProperties();
	var objectService = model.getOTObjectService();	
		
	for(i=0; i<classProperties.size(); i++){
		var classProperty = classProperties.get(i);
		
		System.out.println("classProperty: " + classProperty);
		System.out.println("classProperty.name: " + classProperty.name);
		
		var propRef = objectService.createObject(OTPropertyReference);
		propRef.property = classProperty.name;
		propRef.reference = model;
		
		propertyReferences.add(propRef);
	}
}

function initView(model, prototypeCopy)
{
}

function close()
{
	// Do nothing right now.
}

