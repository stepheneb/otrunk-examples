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