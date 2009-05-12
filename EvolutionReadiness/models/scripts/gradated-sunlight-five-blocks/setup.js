importPackage(Packages.java.lang);
importPackage(Packages.java.awt);
importPackage(Packages.org.concord.biologica.environment);
  			
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
	        	var block = j/4
	        	var percentSunlight = 1 - (Math.floor(j/4) * 0.25)
	        	envUnit.setProperty("sunlight", new Float(percentSunlight))
	        	
	        	var r =  (1*percentSunlight) * 0.5
	        	var g = r * 0.5
	        	var b = g * 0.2
	        	var color = new Color(r+0.3, g+0.2, b+0.1)
	       //		var color = new Color(0.8, 0.5, 0.3)
	        	var terrain = new Terrain(world, "terrain", color)
	        	envUnit.setTerrain(terrain)
            }
        }
	return true;
}

function save() {
	return true;
}