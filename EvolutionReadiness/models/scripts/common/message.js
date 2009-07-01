importClass(Packages.javax.swing.JOptionPane);

function showMessage(message){
	JOptionPane.showMessageDialog(null, message);
}

// show message and pause model
function showMessage(message, environment){
	environment.getEnvironmentView().pause()
	var x = JOptionPane.showMessageDialog(null, message);
	environment.getEnvironmentView().run()
}