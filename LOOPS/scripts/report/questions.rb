include_class 'java.lang.System'

include_class 'org.concord.framework.otrunk.wrapper.OTObjectSet'
include_class 'org.concord.otrunk.ui.question.OTQuestion'

## Helper for questions and grading
class Questions

  def initialize(otrunkHelper)
    @otrunkHelper = otrunkHelper
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

  ## Return correct answer number for a multiple choice question.
  ## @param question: an OTQuestion with an input of OTChoice
  def correctAnswerNum(question)
    answer = question.getCorrectAnswer
    choices = question.getInput.getChoices
    num = getChoiceNum(choices, answer)
    if num == 0
      Util.error("correctAnswerNum: Correct answer not found")
    end
    num
  end

  ## Return a text representing the correct answer for the question,
  ## such as can be printed to a pure ASCII text report
  def correctAnswerText(question)
    if question.is_a?(OTQuestion)
      if question.input.is_a?(OTChoice)
        return choiceLabel(correctAnswerNum(question))
      elsif question.input.is_a?(OTEmbeddedTextInput)
        return correctAnswerET(question.input)
      elsif question.input.is_a?(OTDataTable)
        return question.correctAnswer.text
      elsif question.input.is_a?(OTObjectSet)
        return question.correctAnswer.text
      end
    end
    'N/A'
  end
  
  ## Return correct answer text for a question that has 
  ## the input of type OTEmbeddedTextInput
  def correctAnswerET(input)
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
    answer = userQuestion.getInput.getCurrentChoice
    if answer == nil
      return 0
    else
      return getChoiceNum(userQuestion.getInput.getChoices, answer)
    end
  end
  
  ## Get text for the user's answer to the question
  ## as can be printed to a pure ASCII text report
  def answerText(user, question)
    userQuestion = user ? @otrunkHelper.userObject(question, user) : question
    if question.is_a?(OTQuestion)
      input = userQuestion.input
      if input.is_a?(OTChoice)
        return choiceLabel(answerNum(userQuestion))
      elsif input.is_a?(OTEmbeddedTextInput)
        return answerTextET(userQuestion.input)
      elsif input.is_a?(OTDataTable)
        return dtAnswerText(user, question.input)
      elsif input.is_a?(OTObjectSet)
        answers = []
        input.objects.each do |text|
          answers << @otrunkHelper.userObject(text, user).text
        end
        return answers.join(',')
      end
    end
    nil
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
      color = isCorrect(user, question) ? 'green' : 'red'
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
    values.each_with_index { |value, i|
      if i % numChannels == numChannels - 1
        answers << (value ? value : '-')
      end
    }
    answers.join(',')
  end
  
  ## Return true if question has a correct answer
  def isGradable(question)
    question.is_a?(OTQuestion) and question.input.is_a?(OTChoice)
  end

  ## Return true iff user answered the question correctly
  def isCorrect(user, question)
    if question.is_a?(OTQuestion)
      userQuestion = user ? @otrunkHelper.userObject(question, user) : question
      input = userQuestion.input  
      if input.is_a?(OTChoice)
        userAnswer = input.getCurrentChoice
        if userAnswer and question.getCorrectAnswer
          return question.correctAnswer.otExternalId == userAnswer.otExternalId
        end
      elsif input.is_a?(OTEmbeddedTextInput)
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
  
  ## Return a number corresponding to the choice, beginning with 1.
  ## @param options: an OTChoice
  ## @param choice: user's choice, as can be retrieved with getCurrentChoice()
  def getChoiceNum(options, choice)
    num = 0
    options.each_with_index do |option, i|
      if option.otExternalId == choice.otExternalId
        num = i + 1
        break
      end
    end
    num
  end
  
  ## Return a label (a, b, c, etc.) that corresponding to a choice number
  def choiceLabel(choiceNum)
    labels = ['a', 'b', 'c', 'd', 'e', 'f']
    choiceNum > 0 ? labels[choiceNum-1] : '-'
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
