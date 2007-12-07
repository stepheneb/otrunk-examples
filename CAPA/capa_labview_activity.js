importClass(Packages.java.lang.System);
importClass(Packages.java.lang.StringBuffer);
importClass(Packages.java.io.FileReader);
importClass(Packages.java.io.BufferedReader);
importClass(Packages.java.awt.event.ActionListener);
importClass(Packages.org.concord.framework.otrunk.OTObjectList);
importClass(Packages.org.concord.otrunk.ui.OTText);


var monitor;
var submitButton;
var reportButton;
var clearButton;
var reportsText; // reports are shown here when "show report" has been selected

var submitButtonHandler = {
	actionPerformed: function(evt) {
		var reportPath = monitor.getReportPath()
		System.out.println(reportPath)
		
		var reader = new BufferedReader(new FileReader(reportPath))
		var sb = new StringBuffer()
		var line = reader.readLine()
		
		while (line != null) {
			sb.append(line + "\n")
			line = reader.readLine()
		}
		reader.close()
		var logText = otObjectService.createObject(OTText)
		logText.setText(sb.toString())
		monitor.getLogs().add(logText)
		System.out.println(sb.toString())
	}
};

var reportButtonHandler = {
	actionPerformed: function(evt) {
		var logs = monitor.getLogs()
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
};

var clearButtonHandler = {
	actionPerformed: function(evt) {
		monitor.getLogs().removeAll()
		reportsText.setText("")
	}
};


var submitButtonListener = new ActionListener(submitButtonHandler);
var reportButtonListener = new ActionListener(reportButtonHandler);
var clearButtonListener = new ActionListener(clearButtonHandler);


function init() {
	submitButton.addActionListener(submitButtonListener);
	reportButton.addActionListener(reportButtonListener);
	clearButton.addActionListener(clearButtonListener);	
	return true;
}

function save() {
	submitButton.removeActionListener(submitButtonListener);
	submitButton.removeActionListener(reportButtonListener);
	submitButton.removeActionListener(clearButtonListener);		
	return true;
}
