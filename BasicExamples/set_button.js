importClass(Packages.java.awt.event.ActionListener);

var cardContainer = context.getViewForObject("Card Container");
var button = context.getComponentForObject("Button");
var card = context.getObject(2);

var buttonHandler =
{
    actionPerformed: function(evt)
    {
        cardContainer.setCurrentCard(card);
    }
};
var buttonListener = new ActionListener(buttonHandler);

function init() {
	button.addActionListener(buttonListener);
	return true;
}

function save() {
	button.removeActionListener(buttonListener);
	return true;
}