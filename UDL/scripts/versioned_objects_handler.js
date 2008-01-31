/*
 * This script can control OTVersionedObjects
 *
 * @author sfentress
 */
/*
 * This script will set the current version string on all versionContainers
 * in its list, when a button is pressed. This script will be made more generalized
 * so it can handle changing versions in the viewConfig as well.
 *
 * @author sfentress
 */
   
/* *** Variables brought in by the script object: ***
 * var button - JButton
 * var objectFolder - OTFolderObject with all versionedObjects
 * var version - current version string as an OTText
 */

importClass(Packages.java.awt.event.ActionListener);
importClass(Packages.java.util.Vector);
importClass(Packages.org.concord.framework.otrunk.OTObjectList);
importClass(Packages.javax.swing.JOptionPane);
importClass(Packages.java.lang.System);

var buttonHandler =
{
		actionPerformed: function(evt)
		{
			for (i = 0; i < objectFolder.getChildCount(); i++){
				var versionedObjectContainer = objectFolder.getChild(i);
				System.out.println(versionedObjectContainer);
				versionedObjectContainer.setCurrentVersion(version.getText());
			}
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