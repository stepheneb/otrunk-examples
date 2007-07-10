importPackage(Packages.org.concord.biologica);
importPackage(Packages.org.concord.biologica.ui);
importPackage(Packages.org.concord.biologica.engine);
importPackage(Packages.java.lang);
importPackage(Packages.java.beans);

var newOrg2;

var textArea = context.getViewForObject("challenge_two_cards");
var chromoButton = context.getComponentForObject("chromo_button");
var meiosisView = context.getComponentForObject("challengeTwoMeiosisView").getComponent(0);
var appState = context.getObject("appState");

var world = meiosisView.getMotherOrganism().getWorld();

var propertyChangeHandler =
{
	propertyChange: function(evt)
	{
		if (evt.getPropertyName() == EngineProp.ORGANISM_ADDED)
		{
			newOrg2 = evt.getNewValue();
			if (newOrg2.containsCharacteristic("four legs"))
			{
				textArea.setCurrentCard("successStr2");
				chromoButton.setVisible(false);
			}
			else if (newOrg2.containsCharacteristic("two legs"))
			{
				textArea.setCurrentCard("twoLegFailureStr");
			}
			else
			{
				textArea.setCurrentCard("noLegFailureStr");
			}
		}
	}
};
var propertyChangeListener = new PropertyChangeListener(propertyChangeHandler);

function init() {
	appState.setText("inChallenge2");
	meiosisView.setSexViewMode(SexView.SEX_VIEW_MODE_SIX_VIEWS);
	
	chromoButton.setVisible(true);
	textArea.setCurrentCard("challengeStr2");
	world.addPropertyChangeListener(propertyChangeListener);
	return true;
}

function save() {
	world.removePropertyChangeListener(propertyChangeListener);
	return true;
}