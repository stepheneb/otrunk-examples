importPackage(Packages.java.lang);
importPackage(Packages.java.awt);
importPackage(Packages.org.concord.biologica.environment);
importPackage(Packages.org.concord.framework.otrunk);

var world
  			
function init() {
    System.out.println("setup")
	world = env.getWorld()
	env.setColumns(20)
	env.setRows(20)
	env.setWrapNorthSouth(false)
	env.setWrapEastWest(false)
	for (var i = 0; i < 20; i++) {
	        for (var j = 0; j < 20; j++) {
	        	var envUnit = new EnvironmentUnit(env, null, i, j)
	        	env.setEnvironmentUnit(envUnit, i, j)
	        	envUnit.getProperties().setPropertyValue("sunlight", new Float(1 - (j/20)))
	        	
	        	var percentSunlight = envUnit.getProperties().getPropertyValue("sunlight")
	        	var rg =  (1*percentSunlight.floatValue())
	       // 	var color = new Color(rg, rg, 0)
	       		var color = new Color(0.7+(rg*0.2), 0.4+(rg*0.2), 0.3)
	        	var terrain = new Terrain(world, "terrain", color)
	        	envUnit.setTerrain(terrain)
            }
        }
        
    if (mutationCheck != null)
        mutationCheck.addOTChangeListener(mutationCheckChangeListener)

	return true;
}


var mutationCheckChangeHandler =
{
    stateChanged: function(evt)
    {
        var allOrgs = env.getAllAgents()
        for (var i = 0; i < allOrgs.size(); i++) {
	        var org = allOrgs.get(i)
            if (!org.isDeleted()){
                if (mutationCheck.getSelected()) {
                    System.out.println("true!")
                    org.setProperty("mutation-chance", new Float(0.1)) 
                } else {
                    System.out.println("false!")
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