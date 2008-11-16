importPackage(Packages.java.lang);
importPackage(Packages.java.awt);
importPackage(Packages.org.concord.biologica.environment);
  			
function init() {
	var env = envView.getEnvironment()
	var world = env.getWorld()
	env.setColumns(20)
	env.setRows(20)
	env.setWrapNorthSouth(false)
	env.setWrapEastWest(false)
	for (var i = 0; i < 20; i++) {
	        for (var j = 0; j < 20; j++) {
	        	var envUnit = new EnvironmentUnit(env, null, i, j)
	        	env.setEnvironmentUnit(envUnit, i, j)
	        	var percentWater = (i/20)
	        	envUnit.getProperties().setPropertyValue("waterx", new Float(percentWater))
	        	var percentSunlight = (1 - (j/20))
	        	envUnit.getProperties().setPropertyValue("sunlight", new Float(percentSunlight))
	        	
	       // 	var b =  (1*percentWater)
	       // 	var color = new Color(0, 0, b)
	       		var color = new Color(0.8, 0.5, 0.3)
	        	var terrain = new Terrain(world, "terrain", color)
	        	envUnit.setTerrain(terrain)
            }
        }
	return true;
}

function save() {
	return true;
}