/*
 * This is a set of scripts which help in the authoring of new UDL activities.
 * The script fills in new pages and section with default content and inserts
 * new menus in all new sections.
 * The script is designed to be attached to the "script" element of the UDL container,
 * which allows it to be always running.
 *
 * @author sfentress
 */
importClass(Packages.java.lang.Class);
importClass(Packages.java.lang.System);
importClass(Packages.java.util.HashMap);
importClass(Packages.java.util.regex.Matcher);
importClass(Packages.java.util.regex.Pattern);
importClass(Packages.org.concord.framework.otrunk.OTChangeEvent);
importClass(Packages.org.concord.framework.otrunk.OTChangeListener);
importClass(Packages.org.concord.framework.otrunk.view.OTLabbookManagerProvider);
importClass(Packages.org.concord.otrunk.ui.OTCurriculumUnitHelper)
importClass(Packages.org.concord.otrunk.udl.ui.OTUDLLabPageView)
  			
var questionInputHandler = 
{
	stateChanged: function(evt)
	{
		var question = questionMap.get(evt.getSource())
		for (var i=0; i<labbook.getAllEntries().size(); i++){
			var entry = labbook.getAllEntries().get(i)
			if (entry.getOriginalObject() == question){
				labbook.remove(entry, false)
			}
		}
		var clone = otObjectService.copyObject(question, -1)
		try {
			container = curnitHelper.getCurrentSection();
			labbook.add(clone, container, question, false)
		} catch (e) {}
	}
	
}
var inputListener = new OTChangeListener(questionInputHandler);
var inputs = []
var labbook
var questionMap = new HashMap()
var curnitHelper

function setupLabbookQuestionListeners(){
	var provider = viewContext.getViewService(OTLabbookManagerProvider)
	if (provider == null){
		return;
	}
	labbook = provider.getLabbookManager(otObjectService)
	
	var q = 0			// use a separate index because, with leveled q's, we have more q's than i's
	for (var i=0; i<otids.length; i++){
		var question = otObjectService.getOTObject(otObjectService.getOTID(otids[i]))
		if (question != null && question.toString().indexOf("Question") > 0 && 
						!(question.toString().indexOf("Leveled") > 0)){
			addListenerToInput(question.getInput(), question, q)
			q++
		} else if (question != null && (question.toString().indexOf("Leveled") > 0)){
			for(var j=0; j<question.getQuestions().size(); j++) {
				var innerQuestion = question.getQuestions().get(j)
				addListenerToInput(innerQuestion.getInput(), innerQuestion, q)
				q++
			}
		}
	}
	return true;
}

function addListenerToInput(input, question, q){
	var realInput
	
	if (input.toString().indexOf("CompoundDoc") > 0){
		realInput = input.getDocumentRefsAsObjectList().get(0)
	} else {
		realInput = input
	}
	inputs[q] = realInput
	questionMap.put(inputs[q], question)
	inputs[q].addOTChangeListener(inputListener)
}

function turnOffDefinitions(){
	var sections = curnitHelper.getSections()
	
	var pages = sections.get(1).getContent().getCards()
	turnOffDefinitionsFor(pages)
	
	pages = sections.get(sections.size() - 1).getContent().getCards()
	turnOffDefinitionsFor(pages)
}

function turnOffDefinitionsFor(pages){
	for(var i=0; i<pages.size(); i++) {
		pages.get(i).setShowDefinitions(false)
	}
}

/**
 * Setup the wrapup so that all pages pertaining to a section
 * are hidden if the section has not been visited and shown
 * if it has been. The pertaining section is determined by
 * looking at the LabbookEntryChooser.
 * 
 * After hiding the necessary pages, we also have to check if
 * there are any previously hidden ones to add, in case the
 * student left the wrapup and came back.
 */
function setupWrapupPages(wrapup){
	addRemoveWrapupPages(wrapup, true)
	addRemoveWrapupPages(wrapup, false)
}

/**
 * If hide is true, this searches all the visible pages
 * and hides those whose section has not been visited. Otherwise
 * this seaches the hidden pages and shows those whose section
 * has been visited.
 */
function addRemoveWrapupPages(wrapup, hide){
	var cards
	if (hide){
		cards = wrapup.getContent().getCards()
	} else {
		cards = wrapup.getContent().getHiddenCards()
	}
	
	for(var i=0; i<cards.size(); i++) {
		var page = cards.get(i)
		var section = null
		// first check wither the entry chooser is pointing to a section
		for(var j=0; j<page.getDocumentRefsAsObjectList().size(); j++) {
			var entryChooser = null
			var docRef = page.getDocumentRefsAsObjectList().get(j)
			if (docRef.toString().indexOf("Chooser") > -1){
				entryChooser = docRef
			}
			if (entryChooser != null){
				section = entryChooser.getDefaultSection()
				break
			}
		}
		// if it wasn't, check the titles
		if (section == null){
			var text = page.getBodyText()
			var titlePattern = Pattern.compile("class=\"subtitle\">([^>]*)<")
			var matcher = titlePattern.matcher(text)
			while (matcher.find()) {
				var title = matcher.group(1).trim()
				for(var k=0; k<curnitHelper.getSections().size(); k++) {
					var checkSection = curnitHelper.getSections().get(k)
					if (checkSection.getName().equalsIgnoreCase(title)){
						section = checkSection
						break
					}
				}
			}
		}
		if (section != null){
			var hidden = addRemoveWrapupPage(page, section, wrapup, hide)
			if (hidden)
				i--
		}
	}
}

/**
 * If hide is true and entrychooser points to a section not visited,
 * the page is hidden. If hide is false and entrychooser points to
 * a section visited, the page is shown.
 */
function addRemoveWrapupPage(page, section, wrapup, hide){
	var cards = wrapup.getContent().getCards()
	
	if (hide && !curnitHelper.getSectionsContainer().getViewedCards().getVector().contains(section)){
		wrapup.getContent().getHiddenCards().add(page)
		cards.remove(page)
		return true
	} else if (!hide && curnitHelper.getSectionsContainer().getViewedCards().getVector().contains(section)){
		cards.add(cards.size()-2, page)
		wrapup.getContent().getHiddenCards().remove(page)
	}
	return false
}

var sectionChangeHandler = 
{
	stateChanged: function(evt)
	{
		if (evt.getProperty().equalsIgnoreCase("currentCard") &&
				evt.getValue().getName().indexOf("Wrap") > -1){
			setupWrapupPages(evt.getValue())
		}
		checkActivityEnabling()
	}
	
}
var sectionChangeListener = new OTChangeListener(sectionChangeHandler);

function setupWrapupEnabling(){
	curnitHelper.addSectionChangeListener(sectionChangeListener)
}

// listen for changes to status of pre- and post-tests
// runtime-unlock sections if pretest is complete
var curnitChangeHandler = 
{
	stateChanged: function(evt)
	{
		if (evt.getSource() == curnitHelper.getRoot()){
			checkActivityEnabling()
		}
	}
	
}
var curnitChangeListener = new OTChangeListener(curnitChangeHandler);

function checkActivityEnabling(){
	for(var i=0; i<curnitHelper.getSections().size(); i++) {
		var activity = curnitHelper.getSections().get(i)
		if (activity.getIsPretest()){
			OTUDLLabPageView.enable(activity, !curnitHelper.getRoot().getHasCompletedPretest())
		} else if (activity.getIsPosttest()){
			OTUDLLabPageView.enable(activity, curnitHelper.getRoot().getHasUnlockedPosttest())
		} else {
			// for all other activities
			var doEnable = (curnitHelper.getRoot().getHasCompletedPretest() &&
							!curnitHelper.getRoot().getHasUnlockedPosttest())
			var nextActivity = curnitHelper.getCurrentPathSection()
			
			if (nextActivity == null){
				OTUDLLabPageView.enable(activity, doEnable)
			} else {
				var viewedActivities = curnitHelper.getSectionsContainer().getViewedCards()
				if (activity.equals(nextActivity)){
					OTUDLLabPageView.enable(activity, doEnable)
				} else if (viewedActivities.contains(activity)) {
					activity.setIsEnabledAndFinished(true)
				} else {
					OTUDLLabPageView.enable(activity, false)
				} 
			}
		}
	}
}
  			
function init() {
	curnitHelper = OTCurriculumUnitHelper.getActivityHelper(otObjectService)
	curnitHelper.addOTChangeListener(curnitChangeListener)
	setupWrapupEnabling()
	turnOffDefinitions()
	setupLabbookQuestionListeners()
	checkActivityEnabling()
}

function save() {
	return true;
}

// these are all the q's to which we will attach listeners
var otids = [
"1c66da08-efaf-11dc-804d-37ed2caca07b",
"b0b2c4b0-f6a3-11dc-aef6-d76177a15cbb",
"5af56c46-efb3-11dc-804d-37ed2caca07b",
"a91f42d2-cc49-11dd-b5f2-0bc160d96170",
"e42f8043-cc49-11dd-b5f2-0bc160d96170",
"56d9a6d8-e705-11dd-8ff1-0f9e11b86461",
"11d11dd2-f9ef-11dd-9552-73fbab773e20",
"7ef822ab-cc4a-11dd-b5f2-0bc160d96170",
"b8b8ec0d-c922-11dc-9d19-25c7087488be",
"9ee6f3f0-b96a-11dc-9c96-c9838ca6fb43",
"7cdb3707-b96c-11dc-9c96-c9838ca6fb43",
"ee885131-c842-11dc-8b07-cd90cfa5dd97",
"ff340c86-c842-11dc-8b07-cd90cfa5dd97",
"bc4613ef-e0d4-11dc-ab90-896795aed855",
"98ed7e2f-e0d1-11dc-ab90-896795aed855",
"f48c781d-e0d3-11dc-ab90-896795aed855",
"2070e3c8-e0d4-11dc-ab90-896795aed855",
"38b1d835-e0d4-11dc-ab90-896795aed855",
"c0083b81-e0cb-11dc-ab90-896795aed855",
"1259624d-e0cc-11dc-ab90-896795aed855",
"a96b1f4e-8fe7-11dd-91a5-717f44997088",
"8915dac9-ba46-11dc-8850-6fd722b179dc",
"dc387c05-e3e4-11dc-beaa-cdc9f3ab4400",
"101a5ccd-8eff-11dc-8f83-457b5cb3039b",
"e07ec17d-e3c8-11dc-ac60-9facaf86308a",
"0cd0c5fd-e3d5-11dc-9c4e-875b8e86b4b9",
"2100c5da-e3d5-11dc-9c4e-875b8e86b4b9",
"678b5190-0bcf-012a-b542-0017f2cc694e!/act1-explain-ques2",
"678b5190-0bcf-012a-b542-0017f2cc694e!/act1-explain-ques4",
"1073720d-e3d6-11dc-9c4e-875b8e86b4b9",
"1eb299fa-e3d6-11dc-9c4e-875b8e86b4b9",
"678b5190-0bcf-012a-b542-0017f2cc694e!/height-graph-1",
"678b5190-0bcf-012a-b542-0017f2cc694e!/height-graph-2",
"a53c9ea4-e3c8-11dc-9fd4-5fee575808b0",
"09912a93-e3d5-11dc-bd8e-e5ab906ad868",
"3f4e2f8a-e3d5-11dc-bd8e-e5ab906ad868",
"cab6f75c-e3e0-11dc-beaa-cdc9f3ab4400",
"fa5d6d0b-c529-11dc-8c9f-5d0909ba389b",
"5c0b4ff8-e3d0-11dc-bd8e-e5ab906ad868",
"a82a4fef-e3d0-11dc-bd8e-e5ab906ad868",
"b749c5bc-e3d0-11dc-bd8e-e5ab906ad868",
"35416d12-e3dd-11dc-beaa-cdc9f3ab4400",
"b7b4cbe0-21d6-11dd-883b-015dfae2d4ec",
"30330cae-21d7-11dd-883b-015dfae2d4ec",
"0d1a8a5e-8eff-11dc-8f83-457b5cb3039b",
"57332199-e0c5-11dc-8b8f-579135bdfd8c",
"2deac7bc-fd5d-11dd-b748-6791747153fc",
"39dc8870-e0c7-11dc-8b8f-579135bdfd8c",
"f16f2b11-d595-11dc-bdbd-611bcc97c71c",
"afa437ca-d5a4-11dc-bdbd-611bcc97c71c",
"c83dac8b-d5a4-11dc-bdbd-611bcc97c71c",
"a030b5c7-e167-11dc-81e0-0b1cd468892e",
"c4bed696-7e74-11dd-bbd7-ab102f179518",
"3201c78e-bfb7-11dc-ad3e-29f411a2e672",
"48113613-bfb7-11dc-ad3e-29f411a2e672",
"17335011-c501-11dc-b3b3-63104d70694e",
"659d5c7b-6f93-11dd-a6b0-49397660f371",
"69d057d8-6f93-11dd-a6b0-49397660f371",
"6d08034f-6f93-11dd-a6b0-49397660f371",
"a3c7b216-d104-11dc-ac35-dd05083cefe7",
"0d8dcaa1-d105-11dc-ac35-dd05083cefe7",
"21ca26af-d105-11dc-ac35-dd05083cefe7",
"ef2f31d0-e16b-11dc-81e0-0b1cd468892e",
"a46a0e98-f1e9-11dc-bb2b-e9ff68bf9055",
"b7d9a4a5-f1e9-11dc-bb2b-e9ff68bf9055",
"34bb0f8a-8031-11dd-a9bb-a393612da1a3",
"5de60055-8031-11dd-a9bb-a393612da1a3",
"5476736a-c7b1-11dc-8708-5d4c86f3470b",
"28f5a485-ef88-11dc-b45e-f9b23684ac41",
"d31ddde7-ef89-11dc-b45e-f9b23684ac41",
"0166c1be-6ecf-11dd-acbd-81a4262f622b",
"ac5b3630-7e8d-11dd-b797-b59f90d3fa64",
"e6db22dc-00e3-11dd-ac77-458a9ac771e9",
"d631a364-0d8d-11dd-8292-6fb892b06cea",
"e4c4b7b1-0d8d-11dd-8292-6fb892b06cea",
"4db08fc6-7e90-11dd-b797-b59f90d3fa64",
"29ecabc8-5f0e-11dd-af97-6150a1386e78",
"5e27b57d-5f17-11dd-ab87-11945850916c",
"49b55f21-6258-11dd-b109-dff7490b7962",
"036ff05e-1544-11dd-875d-07a82165daa1",
"215dd5bb-1544-11dd-875d-07a82165daa1",
"3828ff9b-5a4f-11dd-807d-ffdbb55d5b44",
"b1f41a87-080b-11dd-836d-6d863f81c4cc",
"8caee902-156b-11dd-a099-a900c8953fee",
"078b48c2-1238-11dd-bad1-ab45be8cf431",
"55bde686-1238-11dd-bad1-ab45be8cf431",
"d96c30f9-00f0-11dd-942e-750cfc65e2cc",
"c80b090e-01a9-11dd-a7f1-3dca37b8171a",
"1bf803dc-5cce-11dd-a44f-cb6fd6615a5c",
"723fb918-5cce-11dd-a44f-cb6fd6615a5c",
"73b32130-625e-11dd-bb12-f93e9b2f4f15",
"0d170384-5e66-11dd-b4a6-a78b0ae0b912",
"4901f3c2-1224-11dd-bad1-ab45be8cf431",
"e22a7b85-2cf4-11dd-9067-dd2c145538bd",
"0107a2e7-2cf5-11dd-9067-dd2c145538bd",
"93da4320-0d8c-11dd-91fa-c12e917b8f18",
"21e76cfb-25eb-11dd-8aea-49a3dbad775f",
"debf0aee-25ea-11dd-8aea-49a3dbad775f",
"69b7f136-2c24-11dd-a948-0d59c68f631b",
"51af985b-7cd6-11dc-ab8f-f5a7386e7836",
"678b5190-0bcf-012a-b542-0017f2cc694e!/act2-elab-ques1",
"80d6289f-8e41-11dd-add8-91d13bb43c83"]