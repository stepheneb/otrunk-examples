/*
 * This script will set the current page of a card container to a
 * new page, using the cardContainer's own methods. An optional
 * password field can be passed to the script, which can be used
 * to unlock the page changing.
 *
 * @author sfentress
 */
  
/* *** Variables brought in by the script object: ***
 * var button - JButton
 * var cardContainer - the cardContainer containing the new card
 * var card - the new card to flip to
 * var password - OTText containing the correct password (optional)
 * var passwordField - OTText that the student will fill in (optional) 
 */

importClass(Packages.java.awt.event.ActionListener);
importClass(Packages.java.util.Vector);
importClass(Packages.org.concord.framework.otrunk.OTObjectList);
importClass(Packages.javax.swing.JOptionPane);
importClass(Packages.org.concord.otrunk.ui.OTCurriculumUnitHelper)

var numCards;
var currentcard;
var passwordfield;

var buttonHandler =
{
		actionPerformed: function(evt)
		{
			if (passwordfield != null){
				var passwordAttempt = passwordfield.getText();
				if (passwordAttempt.equalsIgnoreCase(password.getText())){
					cardContainer.setCurrentCard(card);
					return;
				} else {
					JOptionPane.showMessageDialog(null, "Sorry, that's not the correct password.");
					return;
				}
			}
			
			if (!udlCurriculumUnit.getHasCompletedPretest()){
				udlCurriculumUnit.setHasCompletedPretest(true)
			} else {
				udlCurriculumUnit.setHasUnlockedPosttest(true)
			}
			var sections = curnitHelper.getSectionsContainer()
			sections.setCurrentCard(sections.getCards().get(0))
				
		}
};
var buttonListener = new ActionListener(buttonHandler);

var udlCurriculumUnit

function init() {
	curnitHelper = OTCurriculumUnitHelper.getActivityHelper(otObjectService)
	udlCurriculumUnit = curnitHelper.getRoot()
	button.addActionListener(buttonListener);

	return true;
}

function save() {
	button.removeActionListener(buttonListener);
	return true;
}