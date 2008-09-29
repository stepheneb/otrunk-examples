importClass(Packages.org.concord.otrunk.ui.OTCurriculumUnitHelper)
importClass(Packages.javax.swing.JOptionPane)

function clicked(){
	if (isPasswordCorrect()){
		unlockPostTestAndExit()
	} else {
		showMessage("That's not the correct password.")
	}
}

function isPasswordCorrect(){
	return passwordField.getText().equalsIgnoreCase(password.getText())
}

function unlockPostTestAndExit(){
	var curnitHelper = OTCurriculumUnitHelper.getActivityHelper(otObjectService)
	curnitHelper.getRoot().setHasUnlockedPosttest(true)
	var sections = curnitHelper.getSectionsContainer()
	sections.setCurrentCard(sections.getCards().get(0))
}

function unlockPostTest(sectionHolder){
	for(var i=0; i<sectionHolder.getCards().size(); i++) {
		activity = sectionHolder.getCards().get(i)
		if (activity.getIsPosttest()){
			activity.setEnabled(true)
		} else {
			activity.setEnabled(false)
		}
	}
}

function showMessage(message){
	JOptionPane.showMessageDialog(null,
						    message,
						    "Notice",
						    JOptionPane.INFORMATION_MESSAGE);
}