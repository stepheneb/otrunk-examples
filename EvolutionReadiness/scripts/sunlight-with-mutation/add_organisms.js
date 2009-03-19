importPackage(Packages.java.lang);
importPackage(Packages.java.awt);
importPackage(Packages.org.concord.biologica.engine);
importPackage(Packages.org.concord.biologica.environment);

var world = env.getWorld()

function clicked() {
	for (var i = 0; i < 10; i++) {
    	var org = new Organism();
    	org.setSpeed(0);
    	org.setDirection(1);
        var sunlightneeded = new Integer(100)
        org.setProperty("sunlight-needed", sunlightneeded)
        var mutationchance
        if (mutationCheck != null){
            if (mutationCheck.getSelected()) {
                mutationchance = new Float(0.11)
            } else {
                mutationchance = new Float(0)
            }
        } else {
            mutationchance = new Float(0.11)
        }
        org.setProperty("mutation-chance", mutationchance)  
        org.setOrganismImageForEnvironment("Fern_thin.gif");
    	env.addOrganism(org);
    	
    }
	
	return true;
}