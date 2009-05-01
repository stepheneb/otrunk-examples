importPackage(Packages.java.lang);
importPackage(Packages.java.awt);
importPackage(Packages.java.awt.event);
importPackage(Packages.java.swing);
importClass(Packages.javax.swing.JOptionPane);
importPackage(Packages.org.concord.biologica.environment);
importPackage(Packages.org.concord.framework.otrunk);
  	
var rabbit = rabbit_species.createAgent()
var rabbits = []
	
function init() {
	world = env.getWorld()
	env.setWrapNorthSouth(false)
	env.setWrapEastWest(false)
	for (var i = 0; i < 8; i++) {
	        for (var j = 0; j < 8; j++) {
	        	var envUnit = new EnvironmentUnit(env, null, i, j)
	        	envUnit.setProperty("brownness", new Float(0.0))
	        	env.setEnvironmentUnit(envUnit, i, j)
	        	var color = new Color(0.3, 0.8, 0.1)
	        	
	        	var terrain = new Terrain(world, "terrain", color)
	        	envUnit.setTerrain(terrain)
            }
        }
        
        
	rabbit.setAge(20)
	rabbit.setProperty("Speed", 0)
	rabbit.setProperty("is immortal", true)
	rabbit.setProperty("max offspring", 0)
	env.addAgent(rabbit)
	
	for (var i = 0; i < 25; i++) {
		var plant = plant_species.createAgent();
		plant.setAge(i*2)
		env.addAgent(plant)
	}
	
	window.requestFocus()
	window.addKeyListener(arrowListener)
	
	env.addStepListener(stepListener)
	
	add.addActionListener(buttonListener)
	
	return true;
}

var arrowHandler =
{
    keyPressed: function(evt)
    {
    	var keyCode = evt.getKeyCode()
    	var loc = rabbit.getLocation()
    	var newLoc
    	if (keyCode == evt.VK_UP){
    		newLoc = new Point(loc.x, loc.y - 3)
    	} else if (keyCode == evt.VK_DOWN){
    		newLoc = new Point(loc.x, loc.y + 3)
    	} else if (keyCode == evt.VK_LEFT){
    		newLoc = new Point(loc.x - 3, loc.y)
    	} else if (keyCode == evt.VK_RIGHT){
    		newLoc = new Point(loc.x + 3, loc.y)
    	}
    	rabbit.setLocation(newLoc)
    }

}
var arrowListener = new KeyListener(arrowHandler)

var stepHandler =
{
	environmentStepped: function()
	{
		var hunger = rabbit.getProperty("Hunger").intValue()
		slider.setValue(hunger * 4)
		if (hunger == 250){
			JOptionPane.showMessageDialog(null, "Oh no! Your rabbit died of hunger.")
			rabbit.setProperty("Hunger", 0)
			env.removeAgent(rabbit)
			JOptionPane.showMessageDialog(null, "Try again!")
			env.removeAllAgents()
			rabbit = rabbit_species.createAgent()
			rabbit.setAge(20)
			rabbit.setProperty("Speed", 0)
			rabbit.setProperty("is immortal", true)
			rabbit.setProperty("max offspring", 0)
			env.addAgent(rabbit)
			
			for (var i = 0; i < 25; i++) {
				var plant = plant_species.createAgent();
				plant.setAge(i*2)
				env.addAgent(plant)
			}
		}
		
		for (var i=0; i<rabbits.length; i++){
			var newRabbit = rabbits[i];
			if (newRabbit != null){
				var newHunger = newRabbit.getProperty("Hunger").intValue()
				if (newHunger > 250){
					env.removeAgent(newRabbit)
					newRabbit = null
				}
			}
		}
	}
}
var stepListener = new EnvironmentStepListener(stepHandler)

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

var buttonHandler =
{
		actionPerformed: function(evt)
		{
			var newRabbit = rabbit_species.createAgent()
			newRabbit.setAge(20)
			newRabbit.setProperty("is immortal", true)
			newRabbit.setProperty("max offspring", 0)
			env.addAgent(newRabbit)
			rabbits[rabbits.length] = newRabbit
		}
};
var buttonListener = new ActionListener(buttonHandler);

function save() {
	return true;
}