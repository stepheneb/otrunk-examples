importPackage(Packages.java.lang);
importPackage(Packages.java.awt);
importPackage(Packages.org.concord.biologica.engine);
importPackage(Packages.org.concord.biologica.environment);
importPackage(Packages.org.concord.biologica.test);
  			
function clicked() {
	var env = envView.getEnvironment()
	var demoRun = new PopulationsTest(100)
	demoRun.runDemo(env);
	return true;
}


function save() {
	return true;
}