importClass(Packages.java.lang.System);
importClass(Packages.javax.swing.JOptionPane);

function showMessageWithoutPausing(message, component){
	if (component != null)
		JOptionPane.showMessageDialog(component, message);
	else
		JOptionPane.showMessageDialog(null, message);
}

// show message and pause model
function showMessage(message, environment, component){
	environment.getEnvironmentView().pause()
	if (component != null)
		var x = JOptionPane.showMessageDialog(component, message);
	else
		var x = JOptionPane.showMessageDialog(null, message);
		
	environment.getEnvironmentView().run()
}

// show message, pause model, log message
function showMessageAndLog(message, environment, component, otEnvHolder){
	showMessage(message, environment, component)
	
	var otEnvHolderController = controllerService.getController(otEnvHolder);
	otEnvHolderController.log("Message shown",message,null,null)
}

// log success
function logSuccess(otEnvHolder){
    var otEnvHolderController = controllerService.getController(otEnvHolder);
    otEnvHolderController.logSuccess();
}
