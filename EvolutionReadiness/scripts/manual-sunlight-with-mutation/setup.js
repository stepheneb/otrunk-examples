importPackage(Packages.java.lang);
importPackage(Packages.java.awt);
importPackage(Packages.org.concord.biologica.environment);
importPackage(Packages.org.concord.framework.otrunk);

var env
var world
  			
function init() {
	env = envView.getEnvironment()
	world = env.getWorld()
	env.setColumns(20)
	env.setRows(20)
	env.setWrapNorthSouth(false)
	env.setWrapEastWest(false)
	for (var i = 0; i < 20; i++) {
	        for (var j = 0; j < 20; j++) {
	        	var envUnit = new EnvironmentUnit(env, null, i, j)
	        	env.setEnvironmentUnit(envUnit, i, j)
	        	envUnit.setProperty("sunlight", new Float(0.8))
	        	
	        	var percentSunlight = envUnit.getProperty("sunlight")
	        	var rg =  (1*percentSunlight.floatValue())
                var color = new Color(0.7+(rg*0.2), 0.4+(rg*0.2), 0.3)
	       //		var color = new Color(0.8, 0.5, 0.3)
	        	var terrain = new Terrain(world, "terrain", color)
	        	envUnit.setTerrain(terrain)
            }
        }
    sunSlider.addOTChangeListener(sunSliderChangeListener)
    if (mutationCheck != null)
        mutationCheck.addOTChangeListener(mutationCheckChangeListener)
	return true;
}

var sunSliderChangeHandler =
{
    stateChanged: function(evt)
    {
        var percentSunlight = (evt.getValue() / 100)
        var percentSunlightFloat = new Float(percentSunlight)
        for (var i = 0; i < 20; i++) {
	        for (var j = 0; j < 20; j++) {
	        	var envUnit = env.getEnvironmentUnit(i, j)
	        	envUnit.setProperty("sunlight", percentSunlightFloat)
	        	
	        	var color = new Color(0.7+(percentSunlight*0.2), 0.4+(percentSunlight*0.2), 0.3)
	      // 		var color = new Color(0.8, 0.5, 0.3)
                var terrain = new Terrain(world, "terrain", color)
	        	envUnit.setTerrain(terrain)
            }
        }
    }

}
var sunSliderChangeListener = new OTChangeListener(sunSliderChangeHandler)

var mutationCheckChangeHandler =
{
    stateChanged: function(evt)
    {
        var allOrgs = env.getAllAgents()
        for (var i = 0; i < allOrgs.size(); i++) {
	        var org = allOrgs.get(i)
            if (!org.isDeleted()){
                if (mutationCheck.getSelected()) {
                    org.setProperty("mutation-chance", new Float(0.1)) 
                } else {
                    org.setProperty("mutation-chance", new Float(0)) 
                }
            }
        }
    }

}
var mutationCheckChangeListener = new OTChangeListener(mutationCheckChangeHandler)

function save() {
	return true;
}