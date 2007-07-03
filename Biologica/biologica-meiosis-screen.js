importPackage(Packages.org.concord.biologica);
importPackage(Packages.org.concord.biologica.ui);
importPackage(Packages.org.concord.biologica.engine);
importPackage(Packages.java.lang);
importPackage(Packages.java.beans);

var meiosisView = context.getComponentForObject(0).getComponent(0);

var maleOrg = context.getRealObject(context.getObject(1));
var femaleOrg = context.getRealObject(context.getObject(2));

var motherGameteInFertilization = false;
var fatherGameteInFertilization = false;

var meiosisPropertyChangeHandler =
{
	propertyChange: function(evt)
	{
		if (evt.getPropertyName().equals(UIProp.SEX_VIEW_MODE))
		{
	//		if (meiosisView.getSexViewMode() == 1) //Normal view
	//			textArea.setText(TELSLogo + meiosisStr);

	//		else if (meiosisView.getSexViewMode() == 2) //Viewing mother chromosomes
	//			textArea.setText(TELSLogo + motherMagnifiedStr);

	//		else if (meiosisView.getSexViewMode() == 3) //Viewing father chromosomes
	//			textArea.setText(TELSLogo + fatherMagnifiedStr);
		}

		if  (evt.getPropertyName().equals(UIProp.SELECTED_FATHER_GAMETE))
		{
			var okToGo = fertilizationView.isValidToDoFertilization();
	//		if (okToGo) textArea.setText(TELSLogo + fertilizationStr);
	//		else textArea.setText(TELSLogo + fatherGameteSelectedStr);
		}
		else if (evt.getPropertyName().equals(UIProp.SELECTED_MOTHER_GAMETE))
		{
			var okToGo = fertilizationView.isValidToDoFertilization();
	//		if (okToGo) textArea.setText(TELSLogo + fertilizationStr);
	//		else textArea.setText(TELSLogo + motherGameteSelectedStr);
		}
	}
};

// var worldPropertyChangeHandler =
// {
// 	propertyChange: function(evt)
//	{
	//	if (evt.getPropertyName() == EngineProp.ORGANISM_ADDED)
	//	textArea.setText(TELSLogo + newOrganismStr);
//	}
// };
	
var meiosisPropertyChangeListener = new PropertyChangeListener(meiosisPropertyChangeHandler);
// var worldPropertyChangeListener = new PropertyChangeListener(worldPropertyChangeHandler);

function init()
{
	// challengeButton.setText(challengeButtonStr);
	// meiosisButton.setText(meiosisButtonStr);
	// textArea.setText(TELSLogo + meiosisStr);
//	chromoButton.setVisible(true);
//	challengeButton.setVisible(true);
	meiosisView.setMotherOrganism(femaleOrg);
	meiosisView.setFatherOrganism(maleOrg);
	meiosisView.setSexViewMode(SexView.SEX_VIEW_MODE_SIX_VIEWS);
	meiosisView.setAlignmentControlsVisible(false);

	fertilizationView = meiosisView.getOffspringFertilizationModel();

	meiosisView.addPropertyChangeListener(meiosisPropertyChangeListener);
	
	// world.addPropertyChangeListener(worldPropertyChangeListener);

	// frame.repaint();
	return true;
}

function save()
{
	meiosisView.removePropertyChangeListener(meiosisPropertyChangeListener);
}
