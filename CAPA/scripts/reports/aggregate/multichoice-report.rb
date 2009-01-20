## Aggregate report for multple choice tests 

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
include_class 'org.concord.otrunk.capa.question.OTEmbeddedTextInput'

## Called when the script view is loaded
def getText
  @debug = true  
  init 
  
  if $action
    actionStr = $action.string
  else
    actionStr = '@controller.defaultTemplate'
  end
  
  return eval(actionStr)
end

def init
  otImport($utilScript)  
  otImport($otrunkScript)
  otImport($questionScript)
  otImport($controllerScript)

  @otrunkHelper = OTrunkHelper.new(OTrunkHelper::MC_GROUP_REPORT)
  @questions = Questions.new(@otrunkHelper)
  @controller = Controller.new(binding) #erb templates will be evaluated in current binding
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

def getCsvText
  sep = "|"
  t = ""
  
  t << "Question Number" + sep 
  @questions.questions.size.times do |i| 
    t << (i + 1).to_s + sep 
  end
  t << "Points (out of #{@questions.questions.size})"
  t << "\n"
   
  t << "Correct Answer" + sep
  for question in @questions.questions 
      t << @questions.correctAnswerText(question).to_s + sep 
  end 
  t << "\n"
  
  for user in @otrunkHelper.users 
    t << user.getName + sep
    for question in @questions.questions 
      t << @questions.answerText(user, question) + sep
    end 
    t << @questions.getPoints(user).to_s
    t << "\n" 
  end
  return t 
end

def getSurveyCsvText
  sep = '|'
  newline = "\n"
  t = ['Class', 'Teacher', 'First Name', 'Last Name', 'Activity Name', 'Name', 'Age', 'Gender', 'Year', 
       'Electronics Major?'].join(sep) + newline 
  @otrunkHelper.users.each do |user|
    t << @otrunkHelper.className << sep
    t << @otrunkHelper.teacherName << sep
    name = user.getName.split
    t << (name.size > 1 ? name[0] : '') + sep + name[-1] + sep
    t << @otrunkHelper.activityName << sep
    @questions.questions.each do |question|
      t << surveyAnswerText(user, question) + sep
    end 
    t << newline
  end
  return t 
end

def surveyAnswerText(user, question)
  userQuestion = @otrunkHelper.userObject(question, user)
  if question.is_a?(OTQuestion) && question.input.is_a?(OTChoice)
    answer = userQuestion.input.getCurrentChoice
    return answer ? Util.trim(answer.getBodyText) : '-'
  elsif question.is_a?(OTText)
    answer = userQuestion.getText
    return answer ? Util.trim(answer) : '-'
  end
  return 'ERROR'
end

def presentQuestion(question)
  text = ''
  prompt = question.getPrompt()
  if prompt and prompt.is_a?(OTCompoundDoc)
    text += Util.toPlainText(question.getPrompt().getBodyText()) 
  else
    text += 'Question prompt not available'
  end
  text += '<br/><br/>'
  input = question.getInput()
  if input
    if input.is_a?(OTChoice)
      choices = input.getChoices.getVector
      for choice in choices 
        text += Util.toPlainText(choice.getBodyText()) + '<br/>'
      end 
    elsif input.is_a?(OTEmbeddedTextInput)
      text += input.getBodyText.gsub(/<object .*?\/>/, '_')
    end
  end
  return text
end
