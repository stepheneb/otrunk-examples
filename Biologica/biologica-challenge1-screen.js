var newOrg;
var appState;
var textArea;
var nextChallengeButton
var chromoButton;
var meiosisButton;
var meiosisView;

var world;

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

	world.addPropertyChangeListener(propertyChangeListener);
	return true;
}

function save() {
	world.removePropertyChangeListener(propertyChangeListener);
	return true;
}