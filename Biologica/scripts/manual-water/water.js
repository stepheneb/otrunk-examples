importPackage(Packages.java.lang);
importPackage(Packages.java.awt);
importPackage(Packages.org.concord.biologica.engine);
importPackage(Packages.org.concord.biologica.environment);
importPackage(Packages.org.concord.biologica.test);
  			
var env = envView.getEnvironment()
	
function clicked() {
	var env = envView.getEnvironment()
	for (var i = 0; i < 20; i++) {
	        for (var j = 0; j < 20; j++) {
	        	var envUnit = env.getEnvironmentUnit(i,j);
	        	var percentWater = envUnit.getProperties().getPropertyValue("waterx").floatValue()
	        	var newPercentWater = percentWater + 0.1
	        	if (newPercentWater > 1.0) newPercentWater = 1.0;
	        	envUnit.getProperties().setPropertyValue("waterx", new Float(newPercentWater))
            }
        }
	return true;
}


function save() {
	return true;
}