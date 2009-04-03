importPackage(Packages.java.lang);
importPackage(Packages.java.awt);
importPackage(Packages.org.concord.biologica.environment);
importPackage(Packages.org.concord.framework.otrunk);

var env
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
	        	env.setEnvironmentUnit(envUnit, i, j)
	        	envUnit.setProperty("sunlight", new Float(0.5))
	        	
	        	var percentSunlight = envUnit.getProperty("sunlight")
	        	var rg =  (1*percentSunlight.floatValue())
                var color = new Color(0.7+(rg*0.2), 0.4+(rg*0.2), 0.3)
	       //		var color = new Color(0.8, 0.5, 0.3)
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
        var difference = (evt.getValue() / 100)
        var sunlightUpper = 0.5 + (difference / 2)
        var sunlightLower = 0.5 - (difference / 2)
        var sunlightUpperFloat = new Float(sunlightUpper)
        var sunlightLowerFloat = new Float(sunlightLower)
        
        for (var i = 0; i < 10; i++) {
	        for (var j = 0; j < 20; j++) {
	        	var envUnit = env.getEnvironmentUnit(i, j)
	        	envUnit.setProperty("sunlight", sunlightUpperFloat)
	        	
	        	var color = new Color(0.7+(sunlightUpper*0.2), 0.4+(sunlightUpper*0.2), 0.3)
	      // 		var color = new Color(0.8, 0.5, 0.3)
                var terrain = new Terrain(world, "terrain", color)
	        	envUnit.setTerrain(terrain)
            }
        }
        for (var i = 10; i < 20; i++) {
	        for (var j = 0; j < 20; j++) {
	        	var envUnit = env.getEnvironmentUnit(i, j)
	        	envUnit.setProperty("sunlight", sunlightLowerFloat)
	        	
	        	var color = new Color(0.7+(sunlightLower*0.2), 0.4+(sunlightLower*0.2), 0.3)
	      // 		var color = new Color(0.8, 0.5, 0.3)
                var terrain = new Terrain(world, "terrain", color)
	        	envUnit.setTerrain(terrain)
            }
        }
    }

}
var sunSliderChangeListener = new OTChangeListener(sunSliderChangeHandler)

function save() {
	return true;
}