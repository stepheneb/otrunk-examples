importPackage(Packages.java.lang);
importPackage(Packages.java.awt);
importPackage(Packages.org.concord.biologica.engine);
importPackage(Packages.org.concord.biologica.environment);
importPackage(Packages.org.concord.biologica.test);
  			
var demoRun = new PopulationsTest(100)
  			
function init() {
	var world = env.getWorld()
	env.setColumns(20)
	env.setRows(20)
	env.setWrapNorthSouth(false)
	env.setWrapEastWest(false)
	for (var i = 0; i < 20; i++) {
	        for (var j = 0; j < 20; j++) {
	        	var envUnit = new EnvironmentUnit(env, null, i, j)
	        	env.setEnvironmentUnit(envUnit, i, j)
	        	var percentWater = 0
	        	envUnit.getProperties().setPropertyValue("water", new Float(percentWater))
	        	
	       		var color = new Color(0.56, 0.42, 0.28)
	        	var terrain = new Terrain(world, "terrain", color)
	        	envUnit.setTerrain(terrain)
            }
        }
        
    var org = new Organism();
    	org.setOrganismImageForEnvironment("plant-healthy.png")
    	org.setSpeed(0);
    	org.setDirection(1);
    	org.setXloc(100);
    	org.setYloc(100);
    	org.setAge(100);
    env.addOrganism(org);
    
    demoRun.runDemo(env, 5)
    	
	return true;
}

function save() {
	return true;
}