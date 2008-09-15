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
importClass(Packages.org.concord.framework.otrunk.OTChangeEvent);
importClass(Packages.org.concord.framework.otrunk.OTChangeListener);
importClass(Packages.org.concord.framework.otrunk.view.OTLabbookManagerProvider);
importClass(Packages.org.concord.otrunk.ui.OTCurriculumUnitHelper)


  var otids = ["57332199-e0c5-11dc-8b8f-579135bdfd8c", 
  			"39dc8870-e0c7-11dc-8b8f-579135bdfd8c",
  			"98ed7e2f-e0d1-11dc-ab90-896795aed855",
  			"2070e3c8-e0d4-11dc-ab90-896795aed855",
  			"bc4613ef-e0d4-11dc-ab90-896795aed855",
  			"f16f2b11-d595-11dc-bdbd-611bcc97c71c",
  			"afa437ca-d5a4-11dc-bdbd-611bcc97c71c",
  			"c83dac8b-d5a4-11dc-bdbd-611bcc97c71c",
  			"b8b8ec0d-c922-11dc-9d19-25c7087488be",
  			"788fcf93-ba46-11dc-8850-6fd722b179dc",
  			"8915dac9-ba46-11dc-8850-6fd722b179dc",
  			"c0083b81-e0cb-11dc-ab90-896795aed855",
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
  			"74c3f461-30ac-11dd-bf9e-e93a15c523f5",
  			"a27bc063-30ac-11dd-bf9e-e93a15c523f5"]
  			
var questionInputHandler = 
{
	stateChanged: function(evt)
	{
		var question = questionMap.get(evt.getSource())
		for (var i=0; i<labbook.getAllEntries().size(); i++){
			var entry = labbook.getAllEntries().get(i)
			if (entry.getOriginalObject() == question){
				labbook.remove(entry)
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
	
	curnitHelper = OTCurriculumUnitHelper.getActivityHelper(viewContext)
	for (var i=0; i<otids.length; i++){
		var question = otObjectService.getOTObject(otObjectService.getOTID(otids[i]))
		if (question != null && question.toString().indexOf("Question") > 0 && 
						!(question.toString().indexOf("Leveled") > 0)){
			inputs[i] = question.getInput()
			questionMap.put(inputs[i], question)
			inputs[i].addOTChangeListener(inputListener)
		}
	}
	return true;
}
  			
function init() {
	setupLabbookQuestionListeners()
}

function save() {
	return true;
}