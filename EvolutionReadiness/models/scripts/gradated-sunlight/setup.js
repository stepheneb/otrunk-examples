importPackage(Packages.java.lang);
importPackage(Packages.java.awt);
importPackage(Packages.org.concord.biologica.environment);
  			
function init() {
	var world = env.getWorld()
	env.setColumns(15)
	env.setRows(15)
	env.setWrapNorthSouth(false)
	env.setWrapEastWest(false)
	for (var i = 0; i < 15; i++) {
	        for (var j = 0; j < 15; j++) {
	        	var envUnit = new EnvironmentUnit(env, null, i, j)
					        	env.setEnvironmentUnit(envUnit, i, j)
					        	envUnit.setProperty("sunlight", new Float((j+1)/10))
					        	var color = new Color(0.3, 0.2, 0.1)
					        	var terrain = new Terrain(world, "terrain", color)
					        	envUnit.setTerrain(terrain)
            }
        }
	return true;
}

function save() {
	return true;
}