/*
 * This is a set of scripts which help in the authoring of new UDL activities.
 * The script fills in new pages and section with default content and inserts
 * new menus in all new sections.
 * The script is designed to be attached to the "script" element of the UDL container,
 * which allows it to be always running.
 *
 * @author sfentress
 */
  
/* *** Variables brought in by the script object: ***
 * var cardContainer - The top-level section card container
 * var sampleMenu - used to create new menus
 * var menuPageRule - rule for new menus
 * var menuHorizontalView - view for new menus
 * var album - snapshot album for attaching to button
 */
  
importClass(Packages.org.concord.framework.otrunk.OTChangeEvent);
importClass(Packages.org.concord.framework.otrunk.OTChangeListener);
importClass(Packages.org.concord.framework.otrunk.OTObject);
importClass(Packages.org.concord.framework.otrunk.OTObjectList);
importClass(Packages.org.concord.otrunk.ui.OTCardContainer);
importClass(Packages.org.concord.otrunk.udl3.OTUDLMenu);
importPackage(Packages.org.concord.framework.otrunk);
importClass(Packages.java.lang.System);
importClass(Packages.javax.swing.JOptionPane);

var objectAboveSnapshotButton;

var pageHandler =
{
	
	stateChanged: function(evt)
	{
		if (evt.getProperty().equalsIgnoreCase("coachStatements") && evt.getOperation().equalsIgnoreCase("add")){
			var statement = evt.getValue();
			var statementDoc = statement.getStatement();
			var statementText = statementDoc.getBodyText();
			if (statementText.indexOf("<div class=\"buffer\">") < 0) {
				statementDoc.setBodyText("<div class=\"buffer\">"+
										"<div class=\"border\">"+
											"<div class=\"body\">"+
												statementText +
											"</div>"+
										"</div>"+
								"</div>");
			}
		} 
		
		else if (evt.getProperty().equalsIgnoreCase("documentRefs") && evt.getOperation().equalsIgnoreCase("add")){
			var otUUID = evt.getValue();
			var objService = evt.getSource().getOTObjectService();
			try {
				var referencedObject = objService.getOTObject(otUUID);
				
				if (referencedObject.toString().indexOf("OTSnapshotButton") > -1){
					var snapshotButton = referencedObject;
					if (objectAboveSnapshotButton != null){
						snapshotButton.setTarget(objectAboveSnapshotButton);
						snapshotButton.setSnapshotAlbum(album);
					} else {
						JOptionPane.showMessageDialog(null,
						    "Snapshot buttons must be placed directly beneath another object.\nPlease remove the button.",
						    "Warning",
						    JOptionPane.ERROR_MESSAGE);
					}
				} else if (referencedObject.toString().indexOf("OTSnapshotChooser") > -1){
					var snapshotChooser = referencedObject;
					snapshotChooser.setAlbum(album);
				} else {
					objectAboveSnapshotButton = referencedObject;
				}
			} catch (e){
				// could not get object from object service
			}
		}
		
	}
}
var pageListener = new OTChangeListener(pageHandler);

var sectionHandler =
{
	stateChanged: function(evt)
	{
		if (evt.getProperty().equalsIgnoreCase("name")){
			var section = evt.getSource();
			var header = section.getHeader();
				
				header.setBodyText("<div class=\"title\">"+
									section.getName() +
								"</div>");
		}
	}
}

var sectionListener = new OTChangeListener(sectionHandler);


var pageContainerHandler =
{
		stateChanged: function(evt)
		{
			if (evt.getProperty().equalsIgnoreCase("cards") &&
				evt.getOperation().equals(OTChangeEvent.OP_ADD)) {
				var numCards = evt.getSource().getCards().size();
				var doc = evt.getSource().getCards().get(numCards-1);
				doc.setBodyText("<div class=\"buffer\">"+
									"<div class=\"border\">"+
										"<div class=\"body\">"+
										"<div class=\"subtitle\">\n"+
												"New page"+
											"\n</div>\n"+
											"New page content"+
										"\n</div>"+
									"</div>"+
								"</div>");
				pages.push(doc)	
				pages[pages.length-1].addOTChangeListener(pageListener);
			} else if (evt.getProperty().equalsIgnoreCase("currentCard")) {
				objectAboveSnapshotButton = null;
			}
		}
};
var pageContainerListener = new OTChangeListener(pageContainerHandler);

var sections = [];
var sectionCardContainers = [];
var pages = [];

function init() {
	cardContainer.addOTChangeListener(pageContainerListener);
	
	var pageIndex = 0;
		
		for (var j = 0; j < cardContainer.getCards().size(); j++){
			pages[pageIndex] = cardContainer.getCards().get(j);
			pages[pageIndex].addOTChangeListener(pageListener);
			pageIndex++;
		}
	
	return true;
}


function save() {
	cardContainer.removeOTChangeListener(sectionContainerListener);
	return true;
}