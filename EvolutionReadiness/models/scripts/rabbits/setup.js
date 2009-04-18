importPackage(Packages.java.lang);
importPackage(Packages.java.awt);
importPackage(Packages.org.concord.biologica.environment);
importPackage(Packages.org.concord.framework.otrunk);
  	
var world
		
function init() {
	world = env.getWorld()
	env.setColumns(20)
	env.setRows(20)
	env.setWrapNorthSouth(false)
	env.setWrapEastWest(false)
	for (var i = 0; i < 20; i++) {
	        for (var j = 0; j < 20; j++) {
	        	var envUnit = new EnvironmentUnit(env, null, i, j)
	        	envUnit.setProperty("brownness", new Float(0.0))
	        	env.setEnvironmentUnit(envUnit, i, j)
	        	var color = new Color(0.3, 0.8, 0.1)
	        	
	        	var terrain = new Terrain(world, "terrain", color)
	        	envUnit.setTerrain(terrain)
            }
        }
    if (slider != null){
    	slider.addOTChangeListener(grassSliderChangeListener)
    }
	return true;
}

var grassSliderChangeHandler =
{
    stateChanged: function(evt)
    {
        var brownness = ((100 - evt.getValue()) / 100)
        var brownnessFloat = new Float(brownness)
        for (var i = 0; i < 20; i++) {
	        for (var j = 0; j < 20; j++) {
	        	var envUnit = env.getEnvironmentUnit(i, j)
	        	envUnit.setProperty("brownness", brownnessFloat)
	        	
	        	var color = new Color(0.3+(brownness*0.5), 0.8-(brownness*0.1), 0.1+(brownness*0.3))
	      // 		var color = new Color(0.8, 0.5, 0.3)
                var terrain = new Terrain(world, "terrain", color)
	        	envUnit.setTerrain(terrain)
            }
        }
    }

}
var grassSliderChangeListener = new OTChangeListener(grassSliderChangeHandler)

function save() {
	return true;
}