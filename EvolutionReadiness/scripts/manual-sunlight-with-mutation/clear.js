importPackage(Packages.java.lang);
importPackage(Packages.java.awt);
importPackage(Packages.org.concord.biologica.engine);
importPackage(Packages.org.concord.biologica.environment);
  			
var env = envView.getEnvironment()
var world = env.getWorld()

function clicked() {
	env.removeAllAgents()
	
	return true;
}