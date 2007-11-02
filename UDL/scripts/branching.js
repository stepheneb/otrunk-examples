/*
 * This is a script which will replace the contents of the script's own
 * updateable container (usually the compoundDoc, but in UDL Plants set to
 * be the OTUDLSection) with another object at the click of a button.
 * 
 * I don't know if there's a clever way to import arrays of variables, so
 * for now we have up to four buttons that control up to four objects.
 *
 * @author sfentress
 */
  
/* *** Variables brought in by the script object: ***
 * var scriptView - The view of this script, to get the updateable container
 * var button1-4 - buttons to control the objects
 * var replacementObject1-4 - the objects to be replaced
 * var firstPane1-4 - if the objects are OTUDLSections, this is the next page shown
 */

importClass(Packages.java.awt.event.ActionListener);
                          					
function init()
{
	try {
		button1.addActionListener(button1Listener);
		button2.addActionListener(button2Listener);
		button3.addActionListener(button3Listener);
		button4.addActionListener(button4Listener);
	} catch (e){
		
	}
	
	return true;
}

function save()
{
	/* // removing listeners breaks ability to change page a second time
	try {
		button1.removeActionListener(button1Listener);
		button2.removeActionListener(button2Listener);
		button3.removeActionListener(button3Listener);
		button4.removeActionListener(button4Listener);
	} catch (e){
		
	}
	*/
	return true;
}

var button1Listener = new ActionListener()
{
	actionPerformed: function(evt) {
		scriptView.getViewContainer().getUpdateableContainer().setCurrentObject(replacementObject1);
		replacementObject1.getContent().setCurrentCard(firstPage1);
		
	}
}

var button2Listener = new ActionListener()
{
	actionPerformed: function(evt) {
		scriptView.getViewContainer().getUpdateableContainer().setCurrentObject(replacementObject2);
		replacementObject2.getContent().setCurrentCard(firstPage2);
		
	}
}

var button3Listener = new ActionListener()
{
	actionPerformed: function(evt) {
		scriptView.getViewContainer().getUpdateableContainer().setCurrentObject(replacementObject3);
		replacementObject3.getContent().setCurrentCard(firstPage3);
		
	}
}

var button4Listener = new ActionListener()
{
	actionPerformed: function(evt) {
		scriptView.getViewContainer().getUpdateableContainer().setCurrentObject(replacementObject4);
		replacementObject4.getContent().setCurrentCard(firstPage4);
		
	}
}