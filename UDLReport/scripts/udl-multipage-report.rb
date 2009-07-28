require 'jruby'
require 'erb'

include_class 'java.lang.System'
include_class 'org.concord.framework.otrunk.view.OTUserListService'
include_class 'org.concord.framework.otrunk.OTrunk'
include_class 'org.concord.framework.otrunk.wrapper.OTString'
include_class 'org.concord.datagraph.state.OTDataGraph'
include_class 'org.concord.datagraph.state.OTDataGraphable'
include_class 'org.concord.otrunk.script.ui.OTScriptVariable'
include_class 'org.concord.otrunk.udl.UDLContentHelper'
include_class 'org.concord.otrunk.overlay.OTUserOverlayManager'

ROWCOLOR1 = "#FFFEE9"
ROWCOLOR2 = "#FFFFFF"

# Called when the script view is loaded
def getText
  otImport($otrunkHelperScript) if defined?($otrunkHelperScript)
  otImport($xmlReportScript) if defined?($xmlReportScript)
  
  init
  if $action
    actionStr = $action.string
  else
    actionStr = "default_template"
  end
  eval(actionStr)
end

def init
  # Order of statements is probably important here
  @debug = true
  @otrunkHelper = OTrunkHelper.new
  @otrunk = $viewContext.getViewService(OTrunk.java_class)
  @contentHelper = UDLContentHelper.getUDLContentHelper(activityRoot)
  @userListService = $viewContext.getViewService(OTUserListService.java_class)
  @users = @userListService.getUserList().sort_by {|user| 
    (user.name && !user.name.empty?) ? user.name.split.values_at(-1, 0) : [""]
  }
  @overlayManager = $viewContext.getViewService(OTUserOverlayManager.java_class)
end

def otImport(script)
  if script
      srcProp = script.otClass().getProperty('src')
      srcValue = script.otGet(srcProp)
      eval(Java::JavaLang::String.new(script.src).to_s, nil, srcValue.getBlobURL().toExternalForm())
  else
    System.err.println("Cannot import #{script}")
  end
end

def sysProp(key, default)
  (prop = System.getProperty(key)) ? prop : default
end

def default_template
  render $template
end

def page2
  render $template_page2
end

def render(templateBlob)
  erb = ERB.new Java::JavaLang::String.new(templateBlob.src).trim.to_s
  srcProp = templateBlob.otClass().getProperty("src")
  srcValue = templateBlob.otGet(srcProp)  
  erb.filename = srcValue.getBlobURL().toExternalForm()
  erb.result(binding)   
end 

def otCreate(rconstant, &block)
  otObj = $otObjectService.createObject(rconstant.java_class)
  yield otObj
  otObj
end

def objectIdStr(obj)
  begin
    obj.getGlobalId().toInternalForm()
  rescue NoMethodError
  	obj.otExternalId()
  end
end

def embedObject(obj, viewEntry=nil)
  tag = "<object refid=\"#{ objectIdStr(obj) }\" "
  tag += "viewid=\"#{ objectIdStr(viewEntry) }\" "  if viewEntry
  tag += "/>"
end

def linkToObject(link_text, obj, viewEntry=nil, frame=nil)
  link = "<a href=\"#{ objectIdStr(obj) }\" "
  link += "viewid=\"#{ objectIdStr(viewEntry) }\" "  if viewEntry
  link += "target=\"#{ objectIdStr(frame) }\" " if frame
  link += ">#{link_text}</a>"
end

def popupFrame
  return @frame if @frame 
  
  @frame = otCreate(org.concord.framework.otrunk.view.OTFrame) { |frame|
     frame.width = 500
     frame.height = 600
   }
end

def popupLinkToObject(link_text, obj, viewEntry=nil)
  frame = popupFrame()
  linkToObject(link_text, obj, viewEntry, frame)
end

def linkToObjectAction(link_text, obj, action)
  viewEntryCopy = $otObjectService.copyObject($viewEntry, 1)
  viewEntryCopy.variables.add(otCreate(OTScriptVariable){|scriptVar|
    scriptVar.name="action"
    scriptVar.reference = otCreate(OTString){|str|
      str.string=action
    }
  })
  linkToObject(link_text, obj, viewEntryCopy)
end

def log(message)
  System.err.println(message)
end

def checkType?(obj, klass)
  return true if obj.is_a? klass
  
  log "obj is a #{obj.java_class} instead of being a #{klass.java_class.name}"
  false
end

# multiuser root
def rootObject
  @otrunk.root
end

def truncate (string, length)
  postFix = ""
  postFix = "..." if string.length > length
  string[0...length] + postFix
end

####################
### Users
####################

def hasUserModified(obj, user)
  @otrunk.hasUserModified(obj, user)
end

def userObject(obj, user)
  @otrunk.getUserRuntimeObject(obj, user);
end

#####################
### Overlays
#####################

def embedObjectFromUserOverlay(user, obj, viewEntry=nil)
  obj = @overlayManager.getOTObject(user, obj.getGlobalId())
  if obj
    embedObject(obj, viewEntry)
  else
    ""
  end
end

#######################
### Questions
#######################

def promptText(question)
  toPlainText(question.prompt)
end

def toPlainText(obj)
  text = ""
  if obj.is_a? org.concord.otrunk.view.document.OTCompoundDoc
    text = obj.bodyText.gsub(/<.*?>/, "")
    test = text.gsub(/\s+/, " ").strip
  end
  text
  test
end

def choiceLabel(chooser, answer) 
  labels = ( 'a'..'f').to_a

  return '-' if answer == nil
  
  chooser.choices.vector.size.times do |i|    
    return labels[i] if answer == chooser.choices.vector[i] 
  end
  
  $stderr.puts('udl-multipage-report.rb:choiceLabel: correct answer doesn\'t match any of the choices')  
  return '-'
end

# Return user answer for a multi-choice question as a label (a, b, c, etc.)
def answerLabel(question) 
  if question.input.is_a? org.concord.otrunk.ui.OTChoice
  	return choiceLabel(question.input, question.input.currentChoice)
  else
  	return questionAnswer(question)
  end
end

# Return correct answer for a multi-choice question as a label (a, b, c, etc.)
def correctAnswerLabel(question)
	if question.input.is_a? org.concord.otrunk.ui.OTChoice
		return choiceLabel(question.input, question.correctAnswer)
	else
		return 'Not Available'
	end
end

def currentChoiceText(chooser)
  answer = chooser.currentChoice
  return nil if answer == nil
  
  return toPlainText(answer)
end

def questionAnswerRaw(question)
  input = question.input
  if input.is_a? org.concord.otrunk.ui.OTText
  	answer = input.text
  	answer = answer.gsub(/\s/," ") unless (answer == nil)
  else 
    if input.is_a? org.concord.otrunk.ui.OTChoice
      answer = currentChoiceText input
    end
  end
  
  answer
end

# this takes a userQuestion
def questionAnswer(question)
  answer = questionAnswerRaw(question)
  
  answer = "No Answer" if answer == nil
  return answer
end

# this takes a userQuestion
def questionCorrect (question)
  return nil unless question.correctAnswer

  return nil if question.input.is_a? org.concord.otrunk.ui.OTText

  if question.input.is_a? org.concord.otrunk.ui.OTChoice
    if question.input.currentChoice == nil
      return nil
    else
	    return question.correctAnswer == question.input.currentChoice
    end
  end
end

def questionAnswered (question)
  questionAnswerRaw(question) != nil
end

# this takes an authored question
def questionGradable (question)
  return true if question.input.is_a? org.concord.otrunk.ui.OTChoice and question.correctAnswer  
end

# this takes a userQuestion
def questionAnswerHtml(question)
  correct = questionCorrect question
  text = questionAnswer question
  return '' if text == nil
  
  shortText = truncate text, 30

  return text if correct == nil
  return "<font color=\"ff0000\">#{shortText}</font>" unless correct
  return "<font color=\"009900\">#{shortText}</font>"    
end

def isChoiceQuestion(question)
  return question.input.is_a? org.concord.otrunk.ui.OTChoice
end



#############################
###  UDL Specific
#############################

def linkToUnitPage(link_text)
  firstObject = rootObject.reportTemplate
  firstView = rootObject.reportTemplateViewEntry
  linkToObject link_text, firstObject, firstView
end

def activityRoot
  rootObject.reportTemplate.reference
end

def unitTitle
  return @contentHelper.unitTitle
end

def sectionsContainer
  return @contentHelper.sectionsContainer
end

def unitSections
  sectionsContainer.cards.vector.select { |section|
    not "Home".eql? section.name
  }
end

def unitActivities
  unitSections.select do |section|
    not section.isPretest and not section.isPosttest
  end
end

def activitySections
  sectionsContainer.cards.vector
end

def visitedSections(user)
  userSectionContainer = userObject(sectionsContainer, user)
  userSectionContainer.viewedCards.vector
end

# @param question: OTUDLQuesiton
# @return comma separated string showing activity reference indices
#         e.g. "0,3,6"  means the question is related to activity 0, 3, and 6 
def activityRefString(question)
  activityIndexList = []
  question.getActivityReferences.getVector.each do |reference|
    activitySections.size.times do |i|
      if activitySections[i].otExternalId == reference.getReferencedObject.otExternalId
        activityIndexList << i      
      end
    end
  end
  activityIndexList.join(',')  
end

def documentQuestions(doc)
  if @contentHelper.version == 1
    v = @contentHelper.getDocumentQuestions(doc)
    ret = []
    for e in v do 
      ret << e
    end
    return ret
  end
  questions = []
  
  doc.documentRefs.each do | ref |
    questions << ref if ref.is_a? org.concord.otrunk.udl.question.OTUDLQuestion
  end

  questions  
end

def documentLeveledQuestions(doc)
  questions = []
  
  doc.documentRefs.each do | ref |
    questions << ref if ref.is_a? org.concord.otrunk.udl.question.OTUDLLeveledQuestions
  end

  questions  
end

def documentQuestionsForIds(doc, otids)
  if @contentHelper.version == 1
    v = @contentHelper.getDocumentQuestions(doc)
    ret = []
    for e in v do 
      ret << e
    end
    return ret
  end
  questions = []
  
  objService = doc.oTObjectService
  
  doc.documentRefs.each do | ref |
  	if ref.is_a? org.concord.otrunk.udl.question.OTUDLQuestion
  		otid = objService.getExternalID(ref)
    	questions << ref unless otids.index(otid) == nil 
    end
  end
  
  questions  
end



def sectionQuestions(section)
  questions = []
    
  return questions unless section.content.is_a? org.concord.otrunk.ui.OTCardContainer
  
  pageCards = allPages(section)

  pageCards.each do | doc |
    questions.concat documentQuestions(doc)
  end

  questions
end

def sectionLeveledQuestions(section)
  questions = []
    
  return questions unless section.content.is_a? org.concord.otrunk.ui.OTCardContainer
  
  pageCards = allPages(section)

  pageCards.each do | doc |
    questions.concat documentLeveledQuestions(doc)
  end

  questions
end

# Very quick way of getting back any question in this section that
# has a specific uuid
def sectionQuestionsForIds(section, otids)
  questions = []
  
  return questions unless section.content.is_a? org.concord.otrunk.ui.OTCardContainer
  				
  return sectionQuestions(section) if otids.empty? 
  
  pageCards = allPages(section)

  pageCards.each do | doc |
    questions.concat documentQuestionsForIds(doc, otids)
  end

  questions
end

def allPages(section)
	allPagesForCardContainer(section.content)
end

def allPagesForCardContainer(cardContainer)
	pages = cardContainer.cards.vector
	innerPages = []
	pages.each do |page|
		page.documentRefs.each do | ref |
			if ref.is_a? org.concord.otrunk.ui.OTCardContainer
				innerPages.concat vectorToArray(allPagesForCardContainer(ref))
			end
		end
	end
	allPages = vectorToArray(pages).concat innerPages
end

def vectorToArray(vector)
	array = []
	vector.each do |i|
		array << i
	end
	array
end

# takes an authored section
def relatedQuestions(section)
  relQuestions = []

  questions = sectionQuestions(pretest())
  questions.each do |question|
    question.getActivityReferences.getVector.each do |reference|
      if section.equals(reference.getReferencedObject)
        relQuestions << question
        break
      end
    end
  end
  
  relQuestions
end  

def pretest
  activitySections().each do |section|
    return section if section.getIsPretest()
  end
end

###################
### section view
###################
def sectionTitle
  return $model.name
end

def basicSectionQuestions
  return sectionQuestions($model)
end

def preOrPost?
  title = sectionTitle.downcase
  title == "pre-test" or title == "post-test"
end

###################
### glossary view
###################
def glossaryWords
	if @contentHelper.version == 3
		return @contentHelper.getGlossaryWords
	end
end

def userGlossaryWords(user)
	if @contentHelper.version == 3
		return @contentHelper.getGlossaryWords($viewContext, user)
	end
end

def glossaryCount(user)
	glossary = @contentHelper.glossary()
	userGlossary = userObject(glossary, user)
	userGlossary.clickCount
end

def glossaryTime(user)
	glossary = @contentHelper.glossary()
	userGlossary = userObject(glossary, user)
	userGlossary.totalTimeOpenMs
end

###################
### tts view
###################
def ttsInstances(section, user)
	userSection = userObject(section, user)
	userPages = allPages(userSection)
	ttsCount = 0
	userPages.each do |page|
		if page.is_a? org.concord.otrunk.udl.document.OTUDLCompoundDoc
			ttsCount += page.timesTTSProduced
		end
	end
	ttsCount
end

def getXmlReport
  report = XmlReport.new('udl', @otrunkHelper)
  
  sections = unitSections
  sections.each_with_index do |section, i|
    sectionId = (i+1).to_s
    report.addSection(section, sectionId)
    questions = sectionQuestions(section)
    report.addQuestions(questions, sectionId)
  end
  
  @users.each do |user|
    studentElem = report.addStudent(user)
  end
  puts report.getText
  report.getText
end
