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
	        	if (j < 3)
	        		percentSunlight = 1.0
	        	else if (j < 6)
	        		percentSunlight = 0.75
	        	else if (j < 9)
	        		percentSunlight = 0.5
	        	else if (j < 11)
	        		percentSunlight = 0.25
	        	else if (j < 15)
	        		percentSunlight = 0.1
	        		
	        	envUnit.setProperty("sunlight", new Float(percentSunlight))
	        	
	        	var r =  (percentSunlight) * 0.5
	        	var g = r * 0.5
	        	var b = g * 0.2
	        	var color = new Color(r+0.3, g+0.2, b+0.1)
	        	var terrain = new Terrain(world, "terrain", color)
	        	envUnit.setTerrain(terrain)
            }
        }
    holder.repaint();
	return true;
}

function save() {
	return true;
}