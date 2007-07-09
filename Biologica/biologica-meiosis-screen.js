importPackage(Packages.org.concord.biologica);
importPackage(Packages.org.concord.biologica.ui);
importPackage(Packages.org.concord.biologica.engine);
importPackage(Packages.java.lang);
importPackage(Packages.java.beans);

var meiosisView = context.getComponentForObject(0).getComponent(0);
var world = meiosisView.getMotherOrganism().getWorld();

var textArea = context.getViewForObject(1);

var motherGameteInFertilization = false;
var fatherGameteInFertilization = false;

var fertilizationView;

var meiosisPropertyChangeHandler =
{
	propertyChange: function(evt)
	{
		if (evt.getPropertyName().equals(UIProp.SEX_VIEW_MODE))
		{
			if (meiosisView.getSexViewMode() == 1) //Normal view
				textArea.setCurrentCard("meiosisStr");

			else if (meiosisView.getSexViewMode() == 2) //Viewing mother chromosomes
				textArea.setCurrentCard("motherMagnifiedStr");

			else if (meiosisView.getSexViewMode() == 3) //Viewing father chromosomes
				textArea.setCurrentCard("fatherMagnifiedStr");
		}

		if  (evt.getPropertyName().equals(UIProp.SELECTED_FATHER_GAMETE))
		{
			var okToGo = fertilizationView.isValidToDoFertilization();
			if (okToGo) textArea.setCurrentCard("fertilizationStr");
			else textArea.setCurrentCard("fatherGameteSelectedStr");
		}
		else if (evt.getPropertyName().equals(UIProp.SELECTED_MOTHER_GAMETE))
		{
			var okToGo = fertilizationView.isValidToDoFertilization();
			if (okToGo) textArea.setCurrentCard("fertilizationStr");
			else textArea.setCurrentCard("motherGameteSelectedStr");
		}
	}
};

 var worldPropertyChangeHandler =
 {
 	propertyChange: function(evt)
	{
		if (evt.getPropertyName() == EngineProp.ORGANISM_ADDED)
		textArea.setCurrentCard("newOrganismStr");
	}
 };
	
var meiosisPropertyChangeListener = new PropertyChangeListener(meiosisPropertyChangeHandler);
var worldPropertyChangeListener = new PropertyChangeListener(worldPropertyChangeHandler);

function init()
{
	// challengeButton.setText(challengeButtonStr);
	// meiosisButton.setText(meiosisButtonStr);
	textArea.setCurrentCard("meiosisStr");
//	chromoButton.setVisible(true);
//	challengeButton.setVisible(true);
	// meiosisView.setMotherOrganism(femaleOrg);
	// meiosisView.setFatherOrganism(maleOrg);
	meiosisView.setSexViewMode(SexView.SEX_VIEW_MODE_SIX_VIEWS);
	meiosisView.setAlignmentControlsVisible(false);

	fertilizationView = meiosisView.getOffspringFertilizationModel();

	meiosisView.addPropertyChangeListener(meiosisPropertyChangeListener);
	world.addPropertyChangeListener(worldPropertyChangeListener);

	// frame.repaint();
	return true;
}

function save()
{
	meiosisView.removePropertyChangeListener(meiosisPropertyChangeListener);
	world.removePropertyChangeListener(worldPropertyChangeListener);
	return true;
}
