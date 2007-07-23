importClass(Packages.java.awt.event.ActionListener);
importClass(Packages.java.util.Vector);
importClass(Packages.org.concord.otrunk.udl3.OTQuestionList);
importClass(Packages.org.concord.framework.otrunk.OTObjectList);

var cardContainer = context.getViewForObject("Card Container");
var button = context.getComponentForObject("Button");
var questionlist = context.getObject(2);
var numCards;
var currentcard;

var buttonHandler =
{
    actionPerformed: function(evt)
    {
    	currentCard = (currentCard+1)%numCards;
    	var card = questionlist.getQuestions().getVector().get(currentCard);
        cardContainer.setCurrentCard(card);
    }
};
var buttonListener = new ActionListener(buttonHandler);

function init() {
	button.addActionListener(buttonListener);
	numCards = questionlist.getQuestions().getVector().size();
	currentCard = 0;
	return true;
}

function save() {
	button.removeActionListener(buttonListener);
	return true;
}