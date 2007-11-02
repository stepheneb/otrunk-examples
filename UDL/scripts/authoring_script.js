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
 * varmenuHorizontalView - view for new menus
 */
  
importClass(Packages.org.concord.framework.otrunk.OTChangeEvent);
importClass(Packages.org.concord.framework.otrunk.OTChangeListener);
importClass(Packages.org.concord.framework.otrunk.OTObject);
importClass(Packages.org.concord.framework.otrunk.OTObjectList);
importClass(Packages.org.concord.otrunk.ui.OTCardContainer);
importClass(Packages.org.concord.otrunk.udl3.OTUDLMenu);
importPackage(Packages.org.concord.framework.otrunk);


var pageHandler =
{
	stateChanged: function(evt)
	{
		if (evt.getProperty().equalsIgnoreCase("coachStatements") && evt.getOperation().equalsIgnoreCase("add")){
			var statement = evt.getValue();
			var statementDoc = statement.getStatement();
			var statementText = statementDoc.getBodyText();
			statementDoc.setBodyText("<div class=\"buffer\">"+
										"<div class=\"border\">"+
											"<div class=\"body\">"+
												statementText +
											"</div>"+
										"</div>"+
								"</div>");
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
			if (evt.getProperty().equalsIgnoreCase("cards")) {
				var numCards = evt.getSource().getCards().size();
				var section = evt.getSource().getCards().get(numCards-1);
				section.setName("Section "+numCards);
				
				var header = section.getHeader();
				
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
		}
};
var sectionContainerListener = new OTChangeListener(sectionContainerHandler);

var pageContainerHandler =
{
		stateChanged: function(evt)
		{
			if (evt.getProperty().equalsIgnoreCase("cards")) {
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
			}
		}
};
var pageContainerListener = new OTChangeListener(pageContainerHandler);

var sections = [];
var sectionCardContainers = [];
var pages = [];

function init() {
	cardContainer.addOTChangeListener(sectionContainerListener);
	
	var pageIndex = 0;
	for (var i = 0; i < cardContainer.getCards().size(); i++){
		sections[i] = cardContainer.getCards().get(i);
		sections[i].addOTChangeListener(sectionListener);
		
		sectionCardContainers[i] = sections[i].getContent();
		sectionCardContainers[i].addOTChangeListener(pageContainerListener);
		
		for (var j = 0; j < sectionCardContainers[i].getCards().size(); j++){
			pages[pageIndex] = sectionCardContainers[i].getCards().get(j);
			pages[pageIndex].addOTChangeListener(pageListener);
			pageIndex++;
		}
	}
	
	return true;
}

function save() {
	cardContainer.removeOTChangeListener(sectionContainerListener);
	return true;
}