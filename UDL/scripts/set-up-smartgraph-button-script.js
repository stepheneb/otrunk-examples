importClass(Packages.org.concord.framework.otrunk.OTrunk);
importClass(Packages.org.concord.otrunk.util.OTSharingManager);
importClass(Packages.org.concord.otrunk.util.ObjectChooserUtil);

importClass(Packages.java.lang.System);
importClass(Packages.java.lang.Class);

function clicked(){
	var smart_tool = getSmartGraphTool()
	if (smart_tool == null){
		return;
	}
	script_button.getScriptVariables().add(createScriptVariable(smart_tool, "smart"))
	
	var graph = smart_tool.getDataCollector();
	script_button.getScriptVariables().add(createScriptVariable(graph, "graph"))
	
	var times_incorrect = createOTObject("org.concord.framework.otrunk.wrapper.OTInt");
	script_button.getScriptVariables().add(createScriptVariable(times_incorrect, "times_incorrect"))
	
	var correct = createOTObject("org.concord.framework.otrunk.wrapper.OTBoolean");
	script_button.getScriptVariables().add(createScriptVariable(correct, "correct"))
	
	var question = viewContainer.getParentContainer().getParentContainer().getCurrentObject()
	if (question != null){
		script_button.getScriptVariables().add(createScriptVariable(question, "question"))
	}
	
	try {
		if (text_field != null){
			script_button.getScriptVariables().add(createScriptVariable(text_field, "text_field"))
		}
	} catch (e) {}
}

function getSmartGraphTool(){
	return	ObjectChooserUtil.selectObjectFromSharedObjects(script_button_component, viewContext, null)
}

function createScriptVariable(ot_object, variable_name){
	var script_variable = createOTObject("org.concord.otrunk.script.ui.OTScriptVariable")
	script_variable.setReference(ot_object)
	script_variable.setName(variable_name)
	return script_variable
}

function createOTObject(class_name){
	return otObjectService.createObject(Class.forName(class_name))
}