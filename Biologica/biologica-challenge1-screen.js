importPackage(Packages.org.concord.biologica);
importPackage(Packages.org.concord.biologica.ui);
importPackage(Packages.org.concord.biologica.engine);
importPackage(Packages.java.lang);
importPackage(Packages.java.beans);

var newOrg;
var appState = context.getObject("appState");
var textArea = context.getViewForObject("challenge_one_cards");
var nextChallengeButton = context.getComponentForObject("next_challenge_button");
var chromoButton = context.getComponentForObject("chromo_button");
var meiosisButton = context.getComponentForObject("meiosis_button");
var meiosisView = context.getComponentForObject("challengeOneMeiosisView").getComponent(0);

var world = meiosisView.getMotherOrganism().getWorld();

var propertyChangeHandler =
{
	propertyChange: function(evt)
	{
		if (evt.getPropertyName() == EngineProp.ORGANISM_ADDED)
		{
			newOrg = evt.getNewValue();
			if (newOrg.containsCharacteristic("single wings"))
			{
				textArea.setCurrentCard("successStr");
				nextChallengeButton.setVisible(true);
				chromoButton.setVisible(false);
				meiosisButton.setVisible(false);
			}
			else
			{
				textArea.setCurrentCard("failureStr");
			}
		}
	}
};

var propertyChangeListener = new PropertyChangeListener(propertyChangeHandler);

function init() {
	appState.setText("inChallenge");
	textArea.setCurrentCard("challengeStr");
	meiosisView.setSexViewMode(SexView.SEX_VIEW_MODE_SIX_VIEWS);
	
	nextChallengeButton.setVisible(false);
	chromoButton.setVisible(true);
	meiosisButton.setVisible(true);

	world.addPropertyChangeListener(propertyChangeListener);
	return true;
}

function save() {
	world.removePropertyChangeListener(propertyChangeListener);
	return true;
}