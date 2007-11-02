/*
 * This script will pop up a message window.
 *
 * @author sfentress
 */
  
/* *** Variables brought in by the script object: ***
 * var button - JButton
 * var message - OTText object container message
 */

importClass(Packages.java.awt.event.ActionListener);
importClass(Packages.java.util.Vector);
importClass(Packages.org.concord.otrunk.udl3.OTQuestionList);
importClass(Packages.org.concord.framework.otrunk.OTObjectList);
importClass(Packages.javax.swing.JOptionPane);

var buttonHandler =
{
		actionPerformed: function(evt)
		{
			var messageString = message.getText();
			JOptionPane.showMessageDialog(null, messageString);
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