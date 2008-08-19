require 'jruby'
require 'erb'
include_class 'java.lang.System'
include_class 'org.concord.framework.otrunk.view.OTUserListService'
include_class 'org.concord.framework.otrunk.OTrunk'
include_class 'org.concord.datagraph.state.OTDataGraph'
include_class 'org.concord.datagraph.state.OTDataGraphable'
include_class 'org.concord.otrunk.script.ui.OTScriptVariable'
include_class 'org.concord.framework.otrunk.wrapper.OTString'

ROWCOLOR1 = "#FFFEE9"
ROWCOLOR2 = "#FFFFFF"

def getText
  @otrunk = $viewContext.getViewService(OTrunk.java_class);
  @debug = true
  if $action
    actionStr = $action.string
  else
    actionStr = "default_template"
  end
  eval(actionStr)
end

def default_template
  render $template
end

def page2
  render $template_page2
end

def render(templateBlob)
  erb = ERB.new Java::JavaLang::String.new(templateBlob.src).to_s
  erb.result(binding)   
end 

def embedObject(obj)
  "<object refid=\"#{ obj.otExternalId() }\"/>"
end

def otCreate(rconstant, &block)
  otObj = $otObjectService.createObject(rconstant.java_class)
  yield otObj
  otObj
end

def linkToObject(link_text, obj, viewEntry=nil)
  link = "<a href=\"#{ obj.otExternalId() }\" "
  link += "viewid=\"#{ viewEntry.otExternalId() }\" "  if viewEntry
  link += ">#{link_text}</a>"
end

def linkToObjectAction(link_text, obj, action)
  viewEntryCopy = $otObjectService.copyObject($viewEntry, 1)
  viewEntryCopy.variables.add(otCreate(OTScriptVariable){|scriptVar|
    scriptVar.name="action"
    scriptVar.reference = otCreate(OTString){|str|
      str.string=action
    }
  })
  "<a href=\"#{ obj.otExternalId() }\" viewid=\"#{viewEntryCopy.otExternalId()}\">#{link_text}</a>"
end

def users
  userListService = $viewContext.getViewService(OTUserListService.java_class)
  userListService.getUserList().sort do |u1, u2| 
    sep = /[\s,]+/
 	n1 = u1.name.split(sep)
	n2 = u2.name.split(sep)
	last1 = n1[n1.length-1]
	last2 = n2[n2.length-1]
	first1 = n1.length > 1 ? n1[0] : ''
	first2 = n2.length > 1 ? n2[0] : ''
	
	if last1 < last2 
		-1
	elsif last1 > last2
		1
	elsif first1 < first2
		-1
	elsif first1 > first2
		1
	else
		0
	end
  end
end

def embedUserObject(obj, user)
  "<object refid=\"#{ obj.otExternalId() }\" user=\"#{ user.getUserId().toExternalForm() }\"/>"
end

def hasUserModified(obj, user)
  @otrunk.hasUserModified(obj, user)
end

def userObject(obj, user)
  @otrunk.getUserRuntimeObject(obj, user);
end

def otCreate(rconstant, &block)
  otObj = $otObjectService.createObject(rconstant.java_class)
  yield otObj
  otObj
end

def findFirstChild(rconstant, startObject)
  # check if the startObject is one of theses
  # if not go through all of its children objects
  # perhaps we should just do this in java
end

def log(message)
  System.err.println(message)
end

def checkType?(obj, klass)
  return true if obj.is_a? klass
  
  log "obj is a #{obj.java_class} instead of being a #{klass.java_class.name}"
  false
end

def rootObject
  @otrunk.root
end

def truncate (string, length)
  postFix = ""
  postFix = "..." if string.length > length
  string[0...length] + postFix
end

def popupFrame
  return @frame if @frame 
  
  @frame = otCreate(org.concord.framework.otrunk.view.OTFrame) { |frame|
   }
end

def popupLinkToObject(link_text, obj, viewEntry=nil)
  frame = popupFrame
  link = "<a href=\"#{ obj.otExternalId() }\" "
  link += "viewid=\"#{ viewEntry.otExternalId() }\" "  if viewEntry
  link += " target=\"#{ popupFrame.otExternalId }\">#{link_text}</a>"  
end

# --------- udl report specific -------------------

def linkToUnitPage(link_text)
  firstObject = rootObject.reportTemplate
  firstView = rootObject.reportTemplateViewEntry
  linkToObject link_text, firstObject, firstView
end

def activityRoot
  rootObject.reportTemplate.reference
end

def udlFormatVersion
  return :version_2 if activityRoot.is_a? org.concord.otrunk.ui.OTModeSwitcher
  return :version_1 if activityRoot.is_a? org.concord.otrunk.udl3.OTUDLContainer
end

def layeredContainer
  activityRoot.otObject
end

def activityTitle
  case udlFormatVersion
  when :version_2
    layeredContainer.name
  when :version_1
    toPlainText( activityRoot.title )
  end
  
  nil
end

def activitySectionContainer
  case udlFormatVersion
  when :version_2
	layeredContainer.layers.get(0)
  when :version_1
    activityRoot.content
  end 
end

def activitySections
  activitySectionContainer.cards.vector
end

def visitedSections(user)
  userSectionContainer = userObject(activitySectionContainer, user)
  userSectionContainer.viewedCards.vector
end

# ----- summary specific --------------

# ---- section specific -------------
def sectionTitle
  return $model.name
end

def basicSectionQuestions
  questions = []
  
  return questions unless $model.content.is_a? org.concord.otrunk.ui.OTCardContainer
  
  pageCards = $model.content.cards.vector

  pageCards.each do | doc |
    questions.concat documentQuestions(doc)
  end

  questions
end

def documentQuestions(doc)
  questions = []
  
  doc.documentRefs.each do | ref |
    questions << ref if ref.is_a? org.concord.otrunk.udl.question.OTUDLQuestion
  end

  questions  
end

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

# this takes a userQuestion
def questionAnswer(question)
  input = question.input
  if input.is_a? org.concord.otrunk.ui.OTText
    answer = input.text
  else 
    if input.is_a? org.concord.otrunk.ui.OTChoice
      answer = currentChoiceText input
    end
  end
  
  answer = "No Answer" if answer == nil
  truncate answer, 30
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

# this takes a userQuestion
def questionAnswerHtml(question)
  correct = questionCorrect question
  text = questionAnswer question

  return text if correct == nil
  return "<font color=\"ff0000\">#{text}</font>" unless correct
  return "<font color=\"00ff00\">#{text}</font>"    
end

def isChoiceQuestion(question)
  return question.input.is_a? org.concord.otrunk.ui.OTChoice
end

