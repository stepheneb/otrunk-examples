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
	        	envUnit.getProperties().setPropertyValue("sunlight", new Float(0.8))
	        	
	        	var percentSunlight = envUnit.getProperties().getPropertyValue("sunlight")
	        	var rg =  (1*percentSunlight.floatValue())
                var color = new Color(0.7+(rg*0.2), 0.4+(rg*0.2), 0.3)
	       //		var color = new Color(0.8, 0.5, 0.3)
	        	var terrain = new Terrain(world, "terrain", color)
	        	envUnit.setTerrain(terrain)
            }
        }
    sunSlider.addOTChangeListener(sunSliderChangeListener)
    if (mutationSlider != null)
        mutationSlider.addOTChangeListener(mutationSliderChangeListener)
	return true;
}

var sunSliderChangeHandler =
{
    stateChanged: function(evt)
    {
        for (var i = 0; i < 20; i++) {
	        for (var j = 0; j < 20; j++) {
	        	var envUnit = env.getEnvironmentUnit(i, j)
	        	envUnit.getProperties().setPropertyValue("sunlight", new Float((evt.getValue() / 100)))
	        	
	        	var percentSunlight = envUnit.getProperties().getPropertyValue("sunlight")
                System.out.println("pc = "+percentSunlight)
	        	var rg =  (1*percentSunlight.floatValue())
	        	var color = new Color(0.7+(rg*0.2), 0.4+(rg*0.2), 0.3)
	      // 		var color = new Color(0.8, 0.5, 0.3)
                var terrain = new Terrain(world, "terrain", color)
	        	envUnit.setTerrain(terrain)
            }
        }
    }

}
var sunSliderChangeListener = new OTChangeListener(sunSliderChangeHandler)

var mutationSliderChangeHandler =
{
    stateChanged: function(evt)
    {
        var allOrgs = env.getAllAgents()
        for (var i = 0; i < allOrgs.size(); i++) {
	        var org = allOrgs.get(i)
            if (!org.isDeleted()){
                org.setProperty("mutation-chance", new Float(evt.getValue()/100)) 
            }
        }
    }

}
var mutationSliderChangeListener = new OTChangeListener(mutationSliderChangeHandler)

function save() {
	return true;
}