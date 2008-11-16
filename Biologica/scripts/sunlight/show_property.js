importPackage(Packages.java.lang);
importPackage(Packages.java.awt);
importPackage(Packages.org.concord.biologica.engine);
importPackage(Packages.org.concord.biologica.environment);

var showingSun = false;
  			
function clicked() {
	var env = envView.getEnvironment()
	for (var i = 0; i < 20; i++) {
	        for (var j = 0; j < 20; j++) {
	        	var envUnit = env.getEnvironmentUnit(i,j)
	        	var color
	        	if (!showingSun){
		        	var percentSunlight = envUnit.getProperties().getPropertyValue("sunlight")
		        	var rg =  (1*percentSunlight.floatValue())
		        	color = new Color(rg, rg, 0)
	        	} else {
	       			color = new Color(0.8, 0.5, 0.3)
	        	}
	        	envUnit.getTerrain().setColor(color)
            }
        }
        showingSun = !showingSun
}


function save() {
	return true;
}