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
importClass(Packages.java.util.regex.Matcher);
importClass(Packages.java.util.regex.Pattern);
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

var sectionContainerHandler =
{
		stateChanged: function(evt)
		{
			if (evt.getProperty().equalsIgnoreCase("currentCard")){
				var numCards = evt.getSource().getCards().size();
				var section = evt.getSource().getCards().get(numCards-1);
				section.getContent().addOTChangeListener(pageContainerListener);
			}
			/*
			if (evt.getProperty().equalsIgnoreCase("cards")) {
				var numCards = evt.getSource().getCards().size();
				var section = evt.getSource().getCards().get(numCards-1);
				section.setName("Section "+numCards);
				
				var header = section.getHeader();
				
				header.setShowEditBar(false);
				
				header.setBodyText("<div class=\"title\">"+
									"Section " + numCards +
								"</div>");
				
				var doc = section.getContent().getCurrentCard();
				
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
								
				var menu = doc.getOTObjectService().createObject(sampleMenu.otClass().getInstanceClass());
				menu.setCardContainer(section.getContent());
				menu.setMenuRule(menuPageRule);
				
				var footer = section.getFooter();
				
				footer.setShowEditBar(false);
				
				var otid = menu.getOTObjectService().getExternalID(menu);
				var viewid = menu.getOTObjectService().getExternalID(menuHorizontalView);
				
				footer.setBodyText("<div align=\"center\">" +
									"<table>"+
											"<tr>"+
												"<td>"+
													"<object refid=\""+otid+"\" viewid=\""+viewid+"\"/>" +
												"</td>"+
											"</tr>"+
									"</table>"+
									"</div>");
								
				section.getContent().addOTChangeListener(pageContainerListener);
				section.addOTChangeListener(sectionListener);
			}
			*/
		}
};
var sectionContainerListener = new OTChangeListener(sectionContainerHandler);

var pageContainerHandler =
{
		stateChanged: function(evt)
		{
			if (evt.getProperty().equalsIgnoreCase("cards") &&
				evt.getOperation().equals(OTChangeEvent.OP_ADD)) {
				// In an add event the value is object that was added
				var doc = evt.getValue()
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
				doc.addOTChangeListener(pageListener)
				// The doc is saved here so it doesn't get garbage collected.  If it 
				// was garbage collected then the listener wouldn't catch the events anymore
				pages.push(doc)	
			} else if (evt.getProperty().equalsIgnoreCase("currentCard")) {
				objectAboveSnapshotButton = null;
			}
		}
};
var pageContainerListener = new OTChangeListener(pageContainerHandler);

function addOptionsMenu(section){
	var header = section.getHeader();
	
	if (header == null) return
	
	var text = header.getBodyText();
	var titleRegEx = "<div class=\"title\">[^>]*</div>"
	var titlePattern = Pattern.compile(titleRegEx, Pattern.MULTILINE)
	var matcher = titlePattern.matcher(text)
	if (matcher.find()){
		var replacement = matcher.replaceAll("<table width=\"100%\">"+
											"<tr>" +
											"<td style=\"text-align: left\">" +
											matcher.group(0) +
											"</td>" +
											"<td width=\"50px\">" +
											"<object refid=\"16c37c27-7784-4c64-b8d0-ba3752d676ce\" viewid=\"8e15a570-16a7-4fad-8775-778cb385bb8a\" />" +
											"</td></tr></table>")
	} else {
		System.out.println("No match for "+text)
	}
	header.setBodyText(replacement)
}

var sections = [];
var sectionCardContainers = [];
var pages = [];

function init() {
	cardContainer.addOTChangeListener(sectionContainerListener);
	var pageIndex = 0;
	for (var i = 0; i < cardContainer.getCards().size(); i++){
		sections[i] = cardContainer.getCards().get(i);
		sections[i].addOTChangeListener(sectionListener);
	//	addOptionsMenu(sections[i])
		
		if (sections[i].getContent() instanceof OTCardContainer){
			sectionCardContainers[i] = sections[i].getContent();
			sectionCardContainers[i].addOTChangeListener(pageContainerListener);
			
			for (var j = 0; j < sectionCardContainers[i].getCards().size(); j++){
				pages[pageIndex] = sectionCardContainers[i].getCards().get(j);
				pages[pageIndex].addOTChangeListener(pageListener);
				if ((i == 0) || (i == (cardContainer.getCards().size()-1))){
					pages[pageIndex].setShowDefinitions(false);
				} else {
					pages[pageIndex].setShowDefinitions(true);
				}
				pageIndex++;
			}
		}
	}
	
	return true;
}

function addPageNumber(page, number) {
	var text = page.getBodyText();
	if (text.indexOf("<!-- title -->") > -1){
		text = text.replaceAll("<!-- title -->","<div class=\"subtitle\"> </div>");
	}
	page.setBodyText(text);
	if (text.indexOf("no-page-number") > -1){
		return;
	}
	if (text.indexOf("<div class=\"page-number\">") > -1){
		text = text.replaceAll("<div class=\"page-number\">.*</div>","<div class=\"page-number\">"+number+"</div>");
	} else {
		var startBody = "<div class=\"body\">";
		var number = "<div class=\"page-number\">"+number+"</div>";
		var table = "<table width=\"100%\"><tr>\n<td><div class=\"subtitle\"> </div></td>\n<td align=\"right\">"+number+"</td>\n</tr></table>";
		text = text.replaceAll(startBody, startBody+"\n"+table);
	}
	page.setBodyText(text);
}

function save() {
	cardContainer.removeOTChangeListener(sectionContainerListener);
	return true;
}