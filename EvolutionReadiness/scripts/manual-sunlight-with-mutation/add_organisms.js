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
        var sunlightneeded = new Integer(100)
        org.setProperty("sunlight-needed", sunlightneeded)
        var mutationchance
        if (mutationSlider != null){
            System.out.println("Setting mut to "+mutationSlider.getValue() / 100)
            mutationchance = new Float(mutationSlider.getValue() / 100)
        } else {
            System.out.println("Mut is 0.1")
            mutationchance = new Float(0.1)
        }
        org.setProperty("mutation-chance", mutationchance)  
        org.setOrganismImageForEnvironment("../species/Pisum Sativum/Fern_thin.gif");
    	env.addOrganism(org);
    	
    }
	
	return true;
}