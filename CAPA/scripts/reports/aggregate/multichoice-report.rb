require 'jruby'
require 'erb'

include_class 'java.lang.System'
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
  input = question.getInput
  if input.is_a?(OTChoice) 
    answer = question.getCorrectAnswer
    choices = input.getChoices.getVector
    num = _choiceNum(choices, answer)
    if num == 0
      err("correctAnswerNum: Correct answer not found")
    end
    return num
  else
    err("correctAnswerNum: input is not an OTChoice")
    return 0
  end
end

def answerText(user, question)
    userQuestion = userObject(question, user)
    answer = userQuestion.getInput.getCurrentChoice
    if answer == nil
      return '<font color="red">-</font>'
    else
      answerNum = _choiceNum(userQuestion.getInput.getChoices.getVector, answer)
      color = isCorrect(userQuestion) ? "green" : "red"
      return "<b><font color=\"#{color}\">#{answerNum}</font></b>"
    end
end

def isCorrect(userQuestion)
  input = userQuestion.getInput
  if input.is_a?(OTChoice)
    userAnswer = input.getCurrentChoice
    correctAnswer = userQuestion.getCorrectAnswer
    return correctAnswer.otExternalId == userAnswer.otExternalId
  else
    return true
  end
end

def getPoints(user)
    sum = 0;
    for question in questions
      userQuestion = userObject(question, user)
      sum += 1 if isCorrect(userQuestion)
    end
    sum
end

def _getQuestions
  questions = []
  cards = activityRoot.getActivity.getContent.getCards.getVector
  for doc in cards
    refs = doc.getDocumentRefs
    for ref in refs
      if ref.is_a? OTQuestion
        questions << ref
      end
    end
  end
  questions
end 

### END Assessment Related ###

### BEGIN Misc ###

def err(msg)
  System.err.println('multichoice-report.rb:' + msg)
end

def log(msg)
  System.out.println('multichoice-report.rb:' + msg)
end

### END Misc ### 
