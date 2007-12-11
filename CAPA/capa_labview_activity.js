importClass(Packages.java.lang.System)
importClass(Packages.java.awt.event.ActionListener)
importClass(Packages.javax.swing.JOptionPane)


var otMonitor
var submitButton;
var reportButton;
var clearButton;
var reportsText; // reports are shown here when "show report" has been selected

function setReportText() {
	var logs = otMonitor.getLogs()
	var text = ""
	var size = logs.size()
		
	for (var i = 0; i < size; ++i) {
		var report = logs.get(i)
		text += report.getText()
		if (i < size - 1) {
			text += "\n=======================================================================\n\n"
		}
	}
		
	System.out.println(text);
	reportsText.setText(text)
}

var submitButtonHandler = {
	actionPerformed: function(evt) {
		var monitor = controllerService.getRealObject(otMonitor)
		if (monitor.processIsRunning()) {
			JOptionPane.showMessageDialog(null, "Please close the LabVIEW session first and try SUBMIT again.");
			System.out.println("Process running. Try when finished")
			return
		}
		monitor.report()
		setReportText()
	}
};

var clearButtonHandler = {
	actionPerformed: function(evt) {
		otMonitor.getLogs().removeAll()
		reportsText.setText("")
	}
};


var submitButtonListener = new ActionListener(submitButtonHandler);
var clearButtonListener = new ActionListener(clearButtonHandler);


function init() {
	submitButton.addActionListener(submitButtonListener);
	clearButton.addActionListener(clearButtonListener);	
	return true;
}

function save() {
	submitButton.removeActionListener(submitButtonListener);
	submitButton.removeActionListener(clearButtonListener);		
	return true;
}
