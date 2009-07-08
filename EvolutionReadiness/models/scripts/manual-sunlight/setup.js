importPackage(Packages.java.lang);
importPackage(Packages.java.awt);
importPackage(Packages.org.concord.biologica.environment);
importPackage(Packages.org.concord.framework.otrunk);

var env
var world
  			
function init() {
	env.removeAllAgents()
	env.setStepCount(0)
	envHolder.pauseAction()
	world = env.getWorld()
	env.setColumns(4)
	env.setRows(4)
	env.setWrapNorthSouth(false)
	env.setWrapEastWest(false)
	for (var i = 0; i < 4; i++) {
	        for (var j = 0; j < 4; j++) {
	        	var envUnit = new EnvironmentUnit(env, null, i, j)
	        	env.setEnvironmentUnit(envUnit, i, j)
	        	envUnit.setProperty("sunlight", new Float(0.5))
	        	
	        	var percentSunlight = envUnit.getProperty("sunlight")
	        	var rg =  (1*percentSunlight.floatValue())
                var color = new Color(0.7+(rg*0.2), 0.4+(rg*0.2), 0.3)
	        	var terrain = new Terrain(world, "terrain", color)
	        	envUnit.setTerrain(terrain)
            }
        }
    sunSlider.addOTChangeListener(sunSliderChangeListener)
	return true;
}

var sunSliderChangeHandler =
{
    stateChanged: function(evt)
    {
        var percentSunlight = (evt.getValue() / 100)
        if (percentSunlight < 0.1) 
             percentSunlight = 0.1;
        var percentSunlightFloat = new Float(percentSunlight)
        for (var i = 0; i < 4; i++) {
	        for (var j = 0; j < 4; j++) {
	        	var envUnit = env.getEnvironmentUnit(i, j)
	        	envUnit.setProperty("sunlight", percentSunlightFloat)
	        	
	        	var color = new Color(0.7+(percentSunlight*0.2), 0.4+(percentSunlight*0.2), 0.3)
	      // 		var color = new Color(0.8, 0.5, 0.3)
                var terrain = new Terrain(world, "terrain", color)
	        	envUnit.setTerrain(terrain)
            }
        }
        holder.repaint()
    }

}
var sunSliderChangeListener = new OTChangeListener(sunSliderChangeHandler)

function save() {
	return true;
}