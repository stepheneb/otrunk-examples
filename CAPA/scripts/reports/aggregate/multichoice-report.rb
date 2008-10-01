require 'jruby'
require 'erb'

include_class 'java.lang.System'
include_class 'org.concord.data.state.OTDataTable'
include_class 'org.concord.framework.otrunk.view.OTUserListService'
include_class 'org.concord.framework.otrunk.OTrunk'
include_class 'org.concord.framework.otrunk.OTXMLString'
include_class 'org.concord.otrunk.view.document.OTCompoundDoc'
include_class 'org.concord.otrunk.ui.OTText'
include_class 'org.concord.otrunk.ui.OTChoice'
include_class 'org.concord.otrunk.ui.question.OTQuestion'

### BEGIN View/Controller Stuff ###

# Called when the script view is loaded
def getText
  @debug = true  
  init 
  
  if $action
    actionStr = $action.string
  else
    actionStr = 'default_template'
  end
  eval(actionStr)
end

def init
  @otrunk = $viewContext.getViewService(OTrunk.java_class)
  @users = _retrieveUsers
  @questions = _getQuestions
  System.out.println("numQuestions=" + @questions.size.to_s)
end

def default_template
  render $template
end

def render(templateBlob)
  erb = ERB.new Java::JavaLang::String.new(templateBlob.src).to_s
  erb.result(binding)   
end 

def linkToObject(link_text, obj, viewEntry=nil)
  link = "<a href=\"#{obj.otExternalId()}\" "
  link += "viewid=\"#{viewEntry.otExternalId()}\" "  if viewEntry
  link += ">#{link_text}</a>"
end

### END View/Controller Stuff ###

### BEGIN OTrunk/Data Utilities ###

def users
  @users
end

def rootObject
  @otrunk.root
end

def activityRoot
  rootObject.reportTemplate.reference
end

def userObject(obj, user)
  @otrunk.getUserRuntimeObject(obj, user);
end

def _retrieveUsers
  userListService = $viewContext.getViewService(OTUserListService.java_class)
  return userListService.getUserList().sort_by { |user| #sort users by name
    (user.name && !user.name.empty?) ? user.name.downcase.split.values_at(-1, 0) : ['']    
  }
end

def _choiceNum(options, choice)
  num = 0
  options.size.times do |i|
    if options[i].otExternalId == choice.otExternalId
      num = i+1
      break
    end 
  end
  num
end

### END OTrunk/Data Utilities ###

### BEGIN Assessment Related ###

## Assuming the root object is OTCurriculumUnit version=2

def questions
    @questions  
end

def prompt(question)
  p = question.getPrompt
  if p.is_a? OTText
    return p.getText
  elsif p.is_a? OTCompoundDoc
    bodyText = p.getBodyText
    return bodyText.is_a?(OTXMLString) ?  bodyText.getContent : bodyText
  else
    System.err.println("Unknown prompt type")
  end
end

# @param question an OTQuestion with an input of OTChoice
def correctAnswerNum(question)
  answer = question.getCorrectAnswer
  choices = question.getInput.getChoices.getVector
  num = _choiceNum(choices, answer)
  if num == 0
    err("correctAnswerNum: Correct answer not found")
  end
  return num
end

def correctAnswerText(question)
  if question.is_a?(OTQuestion) and question.input.is_a?(OTChoice)
    return correctAnswerNum(question).to_s
  else
    return 'N/A'
  end
end

def answerNum(user, question)
  userQuestion = userObject(question, user)
  answer = userQuestion.getInput.getCurrentChoice
  if answer == nil
    return 0
  else
    return _choiceNum(userQuestion.getInput.getChoices.getVector, answer)
  end
end

def answerText(user, question)
  if question.is_a?(OTQuestion) && question.input.is_a?(OTChoice)
    num = answerNum(user, question)
    if num == 0
      return '-'
    else
      return num.to_s
    end
  elsif question.is_a?(OTDataTable)
    return dtAnswerText(user, question)
  elsif question.is_a?(OTText)
    return userObject(question, user).getText
  end
end

def answerHtmlText(user, question)
  text = answerText(user, question)
  if question.is_a?(OTQuestion) && question.input.is_a?(OTChoice)
    color = isCorrect(user, question) ? 'green' : 'red'
    return "<b><font color=\"#{color}\">#{text}</font></b>"
  elsif question.is_a?(OTDataTable)
    return dtAnswerText(user, question)
  elsif question.is_a?(OTText)
    return userObject(question, user).getText
  end
end

def dtAnswerText(user, dataTable)
  text = ''
  dt = userObject(dataTable, user)
  values = dt.getDataStore.getValues
  numChannels = dt.getDataStore.getNumberChannels
  values.size.times { |i|
    if i % numChannels == numChannels - 1
      text << (values.get(i) ? values.get(i) : '-')
    end  }
  text
end

def surveyAnswerText(user, question)
  userQuestion = userObject(question, user)
  if question.is_a?(OTQuestion) && question.input.is_a?(OTChoice)
    answer = userQuestion.input.getCurrentChoice
    return answer ? answer.getBodyText : '-'
  elsif question.is_a?(OTText)
    return userQuestion.getText
  end
  return 'ERROR'
end

def isCorrect(user, question)
  if question.is_a?(OTQuestion) and question.input.is_a?(OTChoice)
    userQuestion = userObject(question, user)  
    userAnswer = userQuestion.getInput.getCurrentChoice
    if userAnswer and question.getCorrectAnswer
      return question.correctAnswer.otExternalId == userAnswer.otExternalId
    end
  end
  false
end

def getPoints(user)
  questions.inject(0) { |sum, question| sum + (isCorrect(user, question) ? 1 : 0) }
end

def _getQuestions
  questions = []
  cards = activityRoot.getActivity.getContent.getCards.getVector
  for doc in cards
    refs = doc.getDocumentRefs
    for ref in refs
      if ref.is_a?(OTQuestion) or ref.is_a?(OTDataTable) or ref.is_a?(OTText)
        questions << ref
      end
    end
  end
  questions
end

### END Assessment Related ###

### BEGIN Other ###

def getCsvText
  sep = "|"
  t = ""
  
  t << "Question Number" + sep 
  questions.size.times do |i| 
    t << (i + 1).to_s + sep 
  end
  t << "Points"
  t << "\n"
   
  t << "Correct Answer" + sep
  for question in questions 
      t << correctAnswerText(question).to_s + sep 
  end 
  t << "\n"
  
  for user in users 
    t << user.getName + sep
    for question in questions 
      t << answerText(user, question) + sep
    end 
    t << getPoints(user).to_s
    t << "\n" 
  end
  t 
end

def getSurveyCsvText
  sep = "|"
  t = ""
  for user in users 
    t << user.getName + sep
    for question in questions 
      t << surveyAnswerText(user, question) + sep
    end 
    t << "\n" 
  end
  t 
end

def err(msg)
  System.err.println('multichoice-report.rb:' + msg)
end

def log(msg)
  System.out.println('multichoice-report.rb:' + msg)
end

### END Other ###

