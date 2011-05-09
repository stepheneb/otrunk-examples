include_class 'java.lang.System'

include_class 'org.concord.framework.otrunk.wrapper.OTObjectSet'
include_class 'org.concord.otrunk.ui.question.OTQuestion'
include_class 'org.concord.otrunk.ui.OTText'
include_class 'org.concord.otrunk.view.document.OTCompoundDoc'
include_class 'org.concord.framework.otrunk.OTXMLString'
include_class 'org.concord.otrunk.ui.OTChoice'

include_class 'org.concord.otrunk.ui.OTCardContainer'

begin
  include_class 'org.concord.otrunk.capa.question.OTEmbeddedTextInput'
rescue NameError
  # capa libraries are not loaded
  $skipEmbeddedTextInput = true
end
include_class 'org.concord.data.state.OTDataTable'
include_class 'org.concord.framework.otrunk.wrapper.OTObjectSet'

## Helper for questions and grading
class Questions

  def initialize(otrunkHelper)
    @otrunkHelper = otrunkHelper
	@otrunk = @otrunkHelper.otrunk
    @questions = @otrunkHelper.getQuestions
  end

  ## Return list of questions for the activity
  def questions
    @questions
  end
  
  ## Return the prompt for the question, 
  ## e.g., as returned by OTQuestion#getPrompt()
  def prompt(question)
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

  ## Return a text representing the correct answer for the question,
  ## such as can be printed to a pure ASCII text report
  def correctAnswerText(question)
    if question.is_a?(OTQuestion)
      if question.input.is_a?(OTChoice)
        return correctChoiceText(question).join(',')
      elsif ! $skipEmbeddedTextInput && question.input.is_a?(OTEmbeddedTextInput)
        return correctAnswerET(question.input)
      elsif question.input.is_a?(OTDataTable)
        return question.correctAnswer.text
      elsif question.input.is_a?(OTObjectSet)
        return question.correctAnswer.text
      end
    end
    'N/A'
  end
  
  def correctChoiceText(question)
    answers = [question.getCorrectAnswer]
    answers = answers[0].objects if answers[0].is_a? OTObjectSet
    out = []
    answers.each do |answer|
      num = getChoiceNum(question.getInput.getChoices, [answer]).first
      text = optionText(answer)
      out << "#{num}. #{text}"
    end
    return out
  end
  
  ## Return correct answer text for a question that has 
  ## the input of type OTEmbeddedTextInput
  def correctAnswerET(input)
    if $skipEmbeddedTextInput
	  error("Can't handle OTEmbeddedTextInput -- incorrect jars loaded")
	  return ''
	end
    unless input.is_a?(OTEmbeddedTextInput)
      error("correctAnswerTexts: Expecting an OTEmbeddedTextInput")
      return ''
    end
    answers = input.getCorrectAnswers.map { |x| x.getText }
    answers.join(',')
  end
  
  ## Return the number (e.g., among 1 thru 4) that corresponds to 
  ## the user's answer to the multiple choice question
  def answerNum(userQuestion)
    answers = userQuestion.getInput.getCurrentChoices
    if answers == nil || answers.size < 1
      return []
    else
      return getChoiceNum(userQuestion.getInput.getChoices, answers)
    end
  end
  
  # return the number and text of the user's choice
  def choiceText(userQuestion)
    answers = userQuestion.getInput.getCurrentChoices
	out = []
	answers.each do |answer|
	  num = getChoiceNum(userQuestion.getInput.getChoices, [answer]).first
	  text = optionText(answer)
	  out << "#{num}. #{text}"
    end
	return out
  end
  
  def optionText(answer)
    if answer == nil
      return ""
    elsif answer.is_a? OTObjectSet
	  full_answer = []
	  answer.getObjects.each do |a|
	    answer_part = optionText(a)
		full_answer << answer_part
	  end
	  return full_answer.join(',')
    elsif answer.is_a? OTText
      return answer.getText
    elsif answer.is_a? OTCompoundDoc
      bodyText = answer.getBodyText
      return bodyText.is_a?(OTXMLString) ?  bodyText.getContent : bodyText
    else
      System.err.println("Unknown answer type " + answer.otClass().getName())
      return ""
    end
  end
  
  ## Get text for the user's answer to the question
  ## as can be printed to a pure ASCII text report
  def answerText(user, question)
    userQuestion = user ? @otrunkHelper.userObject(question, user) : question
    if question.is_a?(OTQuestion)
      input = userQuestion.input
      if input.is_a?(OTChoice)
        return choiceText(userQuestion).join(',')
      elsif ! $skipEmbeddedTextInput && input.is_a?(OTEmbeddedTextInput)
        return answerTextET(userQuestion.input)
      elsif input.is_a?(OTDataTable)
        return dtAnswerText(user, question.input)
      elsif input.is_a?(OTObjectSet)
        answers = []
        input.objects.each do |text|
          answers << @otrunkHelper.userObject(text, user).text
        end
        return answers.join(',')
	  elsif input.is_a?(OTText)
	    return input.text
      else
        return embedUserObject(question.input, user)
      end
    end
    embedUserObject(question, user)
  end
  
  ## input: OTEmbeddedTextInput
  def answerTextET(input)
    answers = input.getTextObjects.map { |x| 
      t = x.getText
      (t == nil) ? '-' : t 
    }
    answers.join(',')
  end
  
  ## Return a HTML text for the user's answer for the question
  def answerHtmlText(user, question)
    text = answerText(user, question)
	
    if isGradable(question)
	  correct = isCorrect(user, question)
      color = correct ? 'green' : 'red'
	  color = 'black' if correct == nil
      return "<b><font color=\"#{color}\">#{text}</font></b>"
    else
      return text
    end
  end
  
  ## For old (Weber State U) questions of type OTDataTable
  def dtAnswerText(user, dataTable)
    answers = []
    dt = @otrunkHelper.userObject(dataTable, user)
    values = dt.getDataStore.getValues
    numChannels = dt.getDataStore.getNumberChannels
    values.each_with_index do |value, i|
      if i % numChannels == numChannels - 1
        answers << (value ? value : '-')
      end
    end
    answers.join(',')
  end
  
  ## Return true if question has a correct answer
  def isGradable(question)
    question.is_a?(OTQuestion) and question.input.is_a?(OTChoice)
  end

  ## Return true if user answered the question correctly
  def isCorrect(user, question)
    if question.is_a?(OTQuestion)
      userQuestion = user ? @otrunkHelper.userObject(question, user) : question
      input = userQuestion.input  
      if input.is_a?(OTChoice)
        userAnswers = input.getCurrentChoices
		correctAnswer = question.getCorrectAnswer
		return nil if correctAnswer == nil
		correctAnswers = [correctAnswer]
		correctAnswers = correctAnswer.objects if correctAnswer.is_a?(OTObjectSet)
		if correctAnswers.size < 1
		  return nil
		end
		if arraysEqual(userAnswers.map{|a| a.otExternalId}, correctAnswers.map{|a| a.otExternalId})
		  return true
		end
		return false
      elsif ! $skipEmbeddedTextInput && input.is_a?(OTEmbeddedTextInput)
        answers = input.getTextObjects.map { |x| x.getText }
        correctAnswers = input.getCorrectAnswers.map { |x| x.getText }
        return answers == correctAnswers
      elsif input.is_a?(OTDataTable)
        answer = dtAnswerText(user, input)
        correctAnswer = correctAnswerText(question)
        return answer == correctAnswer
      elsif input.is_a?(OTObjectSet)
        return answerText(user, question) == correctAnswerText(question) 
      end
    end
    false
  end
  
  def arraysEqual(a,b)
    i = a & b
	u = a | b
	if a == b
	  return true
	end
	return false
  end
  
  ## Return a number corresponding to the choice, beginning with 1.
  ## @param options: an OTChoice
  ## @param choice: user's choice, as can be retrieved with getCurrentChoice()
  def getChoiceNum(options, choices)
    nums = []
	choicesMap = choices.map{|c| c ? c.otExternalId : nil}
    options.each_with_index do |option, i|
      if choicesMap.include?(option.otExternalId)
        nums << i + 1
      end
    end
    nums
  end
  
  ## Return a label (a, b, c, etc.) that corresponding to a choice number
  def choiceLabel(choiceNum)
    labels = ['a', 'b', 'c', 'd', 'e', 'f']
	out = []
	if choiceNum != nil
	  choiceNum.each do |n|
	    out << labels[n-1]
	  end
	end
    out.size > 0 ? out.join(',') : '-'
  end 
  
  ## Return total points for the user, counting each question as one point.
  ## Multiple choice tests only
  def getPoints(user)
    @questions.inject(0) { |sum, question| sum + (isCorrect(user, question) ? 1 : 0) }
  end
  
  ## Return total possible points for the multiple choice test
  def totalMaxPoints
    @questions.size
  end
end
