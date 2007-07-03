importClass(Packages.java.awt.event.ActionListener);
importClass(Packages.java.awt.CardLayout);

var viewContainer = context.getViewContainer();
var cardPanel = context.getComponentForObject("Card Container");
var button = context.getComponentForObject("Button");
var buttonHandler =
{
	actionPerformed:function(evt) 
	{
		var cl = cardPanel.getLayout();
		cl.next(cardPanel);
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