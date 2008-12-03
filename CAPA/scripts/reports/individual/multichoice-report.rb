require 'jruby'
require 'erb'

include_class 'java.lang.System'
include_class 'org.concord.otrunk.ui.OTChoice'
include_class 'org.concord.otrunk.view.document.OTCompoundDoc'

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
  otImport($utilScript)
  otImport($mcCommonScript)
  otImport($rptCommonScript)  
  otImport($questionScript)
  Qstn.loadQuestions()
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

def presentQuestion(question)
  text = ''
  prompt = question.getPrompt()
  if prompt and prompt.is_a?(OTCompoundDoc)
    text += toPlainText(question.getPrompt().getBodyText()) 
  else
    text += 'Question prompt not available'
  end
  text += '<br/><br/>'
  input = question.getInput()
  if input
    if input.is_a?(OTChoice)
      choices = input.getChoices().getVector()
      for choice in choices do
        text += toPlainText(choice.getBodyText()) + '<br/>'      end 
    end
  end
  text += '<br/>'
  text += "Correct Answer: #{Qstn.correctAnswerText(question)}<br/>"
  text += "Student Answer: #{Qstn.answerHtmlText(nil, question)}"      
  return text
end

