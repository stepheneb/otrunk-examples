include_class 'java.lang.System'

include_class 'org.concord.data.state.OTDataTable'
include_class 'org.concord.framework.otrunk.OTXMLString'
include_class 'org.concord.framework.otrunk.wrapper.OTObjectSet'
include_class 'org.concord.otrunk.ui.OTChoice'
include_class 'org.concord.otrunk.ui.OTText'
include_class 'org.concord.otrunk.ui.question.OTQuestion'
include_class 'org.concord.otrunk.view.document.OTCompoundDoc'

## Helper for questions and grading
class QuestionHelper
  
  RED = 'ff0000'
  GREEN = '009900'

  def initialize(otrunkHelper)
    @otrunkHelper = otrunkHelper
  end

  ## Return the prompt for the question, 
  ## e.g., as returned by OTQuestion#getPrompt()
  def getPrompt(question)
    p = question.getPrompt
    if p == nil
      System.err.println("No prompt for question " + question.inspect)
      return ""
    elsif p.is_a? OTText
      return p.getText
    elsif p.is_a? OTCompoundDoc
      bodyText = p.getBodyText
      return bodyText.is_a?(OTXMLString) ?  bodyText.getContent : bodyText
    else
      System.err.println("Unknown prompt type " + p.java_class.inspect)
      return ""
    end
  end

  def plainPromptText(question)
    Util.toPlainText(getPrompt(question))
  end
  
  def questionAnswered(question)
    questionAnswerRaw(question) != nil
  end
  
  def questionAnswerRaw(question)
    input = question.input
    answer = nil
    if input.is_a? org.concord.otrunk.ui.OTText
      answer = input.text.gsub(/\s/," ") if input.text
    elsif input.is_a? org.concord.otrunk.view.document.OTCompoundDoc
      answer = input.bodyText.gsub(/\s/," ") if input.bodyText
    elsif input.is_a? org.concord.otrunk.ui.OTChoice
      answer = currentChoiceText input
    end
    
    answer
  end
  
  def questionFirstAnswerRaw(question)
    input = question.incorrectAnswers.size > 0 ? question.incorrectAnswers.get(0) : question.input
    answer = nil
    if input.is_a? org.concord.otrunk.ui.OTText
      answer = input.text.gsub(/\s/," ") if input.text
    elsif input.is_a? org.concord.otrunk.view.document.OTCompoundDoc
      answer = input.bodyText.gsub(/\s/," ") if input.bodyText
    elsif input.is_a? org.concord.otrunk.ui.OTChoice
      answer = currentChoiceText input
    end
    
    answer
  end
  
  def currentChoiceText(chooser)
    answer = chooser.getCurrentChoices.get(0)
    return nil if answer == nil
    
    if answer.is_a?(OTCompoundDoc)
      text = answer.bodyText
    elsif answer is_a?(OTText)
      text = answer.text
    else
      Util.error("Util.currentChoiceText: failed to convert #{answer} to text")
      text = ''
    end
    return Util.toPlainText(text)
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
  
  # this takes a userQuestion
  def questionAnswer(question)
    answer = questionAnswerRaw(question)
    
    answer = "-" if answer == nil
    return answer
  end
  
    # this takes a userQuestion
  def questionFirstAnswer(question)
    answer = questionFirstAnswerRaw(question)
    
    answer = "-" if answer == nil
    return answer
  end
  
  # this takes a userQuestion
  def questionAnswerHtml(question)
    correct = questionCorrect question
    text = questionAnswer question
    
    return '' if text == nil
    
    shortText = Util.truncate(text, 30)
    
    if correct
    	shortText += wrapWrong('<sup>*</sup>') unless questionFirstChoiceCorrect question
    end
  
    return text if correct == nil
    return wrapWrong(shortText) unless correct
    return wrapRight(shortText)
  end
  
  def questionFirstAnswerHtml(question)
    correct = questionFirstChoiceCorrect question
    text = questionFirstAnswer question
    return '' if text == nil
    
    shortText = Util.truncate(text, 30)
  
    return text if correct == nil
    return wrapWrong(shortText) unless correct
    return wrapRight(shortText)
  end
  
  ## PARAMS:
  ##   question: a userQuestion
  ## RETURNS:
  ##   true: correct answer
  ##   false: incorrect answer
  ##   nil: question is not gradable or no correct answer is defined
  def questionCorrect(question)
    if question.correctAnswer &&
       question.correctAnswer.is_a?(OTObjectSet) &&
       question.input.is_a?(OTChoice) &&
       question.input.currentChoices &&
       question.input.currentChoices.size > 0
    then
      return question.correctAnswer.objects.get(0) == question.input.currentChoices.get(0)
    end
    nil
  end
  
  ## PARAMS:
  ##   question: a userQuestion
  ## RETURNS:
  ##   true: correct answer and no incorrect answers
  ##   false: any incorrect answers
  ##   nil: question is not gradable or no correct answer is defined
  def questionFirstChoiceCorrect(question)
    if question.correctAnswer &&
       question.correctAnswer.is_a?(OTObjectSet) &&
       question.input.is_a?(OTChoice) &&
       question.input.currentChoices &&
       question.input.currentChoices.size > 0
    then
    	puts question.prompt.bodyText + " incorrectAnswers.size = "+question.incorrectAnswers.size.to_s
    	if question.incorrectAnswers.size > 0
    		return false
    	else
      		return question.correctAnswer.objects.get(0) == question.input.currentChoices.get(0)
      	end
    end
    nil
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

  # this takes an authored question
  def gradable?(question)
    return question.input.is_a?(org.concord.otrunk.ui.OTChoice) && question.correctAnswer
  end
  
  def isChoiceQuestion(question)
    return question.input.is_a? org.concord.otrunk.ui.OTChoice
  end
  
  ## Embellish the wrong answer with additional html tags
  def wrapWrong(str)
    %Q[<font color="#{RED}"><i>#{str}</i></font>]
  end
  
  ## Embellish the right answer with additional html tags
  def wrapRight(str)
    %Q[<font color="#{GREEN}">#{str}</font>]
  end
  
end
