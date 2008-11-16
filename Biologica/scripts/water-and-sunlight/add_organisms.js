importPackage(Packages.java.lang);
importPackage(Packages.java.awt);
importPackage(Packages.org.concord.biologica.engine);
importPackage(Packages.org.concord.biologica.environment);
  			
var env = envView.getEnvironment()
var world = env.getWorld()

function clicked() {
	for (var i = 0; i < 10; i++) {
    	var org = new Organism();
    	org.setSpeed(0);
    	org.setDirection(1);
    	env.addOrganism(org);
    	
    }
	
	return true;
}