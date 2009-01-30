importPackage(Packages.java.lang);
importPackage(Packages.java.awt);
importPackage(Packages.org.concord.biologica.engine);
importPackage(Packages.org.concord.biologica.environment);
importPackage(Packages.org.concord.biologica.test);
  			
var env = envView.getEnvironment()
var demoRun = new PopulationsTest(100)
	
function clicked() {
	
	if (jButton.getText().equals("Run")){
		demoRun.runDemo(env, 1)
		jButton.setText("Pause")
	} else {
		demoRun.pauseDemo()
		jButton.setText("Run")
	}
	return true;
}


function save() {
	return true;
}