## Individual report for multiple choice tests

require 'jruby'
require 'erb'

include_class 'java.lang.System'

include_class 'org.concord.otrunk.capa.question.OTEmbeddedTextInput'
include_class 'org.concord.otrunk.ui.OTChoice'
include_class 'org.concord.otrunk.view.document.OTCompoundDoc'

## Called when the script view is loaded
def getText
  @debug = true  
  init 
  
  if $action
    actionStr = $action.string
  else
    actionStr = '@controller.defaultTemplate'
  end
  eval(actionStr)
end

def init
  otImport($utilScript)  
  otImport($otrunkScript)
  otImport($questionScript)
  otImport($controllerScript)

  @otrunkHelper = OTrunkHelper.new(OTrunkHelper::MC_SINGLE_REPORT)
  @questions = Questions.new(@otrunkHelper)
  @controller = Controller.new(binding)
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
        text += Util.toPlainText(choice.getBodyText()) + '<br/>'      end 
    elsif input.is_a?(OTEmbeddedTextInput)
      text += input.getBodyText.gsub(/<object .*\/>/, '_')
    end
  end
  text += '<br/>'
  text += "Correct Answer: #{@questions.correctAnswerText(question)}<br/>"
  text += "Student Answer: #{@questions.answerHtmlText(nil, question)}"      
  return text
end

