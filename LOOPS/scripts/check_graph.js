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
			var valuesList = graph.getSource().getDataStore().getValues()
			var overflow = false;
			var i = 1;
			var max = -1000;
			while (overflow == false){
				try {
					var value = valuesList.get(i);
					if (value > max){
						max = value;
					}
					i = i+2;
				} catch (e){
					overflow = true;
				}
			}
			
			var maxLabelY = -1000;
			var labels = graph.getLabels();
			var numLabels = labels.getVector().size();
			for (var i = 0; i<numLabels; i++){
				var labely = labels.get(i).getYData();
				if (labely > maxLabelY){
					maxLabelY = labely;
				}
			}
			
			var diff = max - maxLabelY;
			var diffSq = diff * diff;
			if (diffSq < 0.1){
				JOptionPane.showMessageDialog(null, "That's correct!");
			} else {
				JOptionPane.showMessageDialog(null, "That's not the maximum. Try again!");
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