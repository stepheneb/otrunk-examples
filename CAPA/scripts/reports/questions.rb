include_class 'org.concord.otrunk.capa.question.OTEmbeddedTextInput'
include_class 'org.concord.otrunk.ui.question.OTQuestion'

class Questions
      
  def initialize(otrunkHelper)
    @otrunkHelper = otrunkHelper  
  end
  
  def questions
    unless @questions
      questions = []
      cards = @otrunkHelper.activityRoot.getActivity.getContent.getCards.getVector
      
      for doc in cards
        refs = doc.getDocumentRefs
        for ref in refs
          if ref.is_a?(OTQuestion) or ref.is_a?(OTDataTable) or ref.is_a?(OTText)
            questions << ref
          end
        end
      end
      @questions = questions
    end
    return @questions
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
      return nil
    end
  end
  
  ## question: an OTQuestion with an input of OTChoice
  def correctAnswerNum(question)
    answer = question.getCorrectAnswer
    choices = question.getInput.getChoices.getVector
    num = getChoiceNum(choices, answer)
    if num == 0
      err("correctAnswerNum: Correct answer not found")
    end
    return num
  end
  
  def correctAnswerText(question)
    if question.is_a?(OTQuestion)
      if question.input.is_a?(OTChoice)
        return choiceLabel(correctAnswerNum(question))
      elsif question.input.is_a?(OTEmbeddedTextInput)
        return correctAnswerET(question.input)
      end
    end
    return 'N/A'
  end
  
  def correctAnswerET(input)
    unless input.is_a?(OTEmbeddedTextInput)
      error("correctAnswerTexts: Expecting an OTEmbeddedTextInput")
      return ''
    end
    answers = input.getCorrectAnswers.getVector.map { |x| x.getText }
    return answers.join(',')
  end
  
  def answerNum(userQuestion)
    answer = userQuestion.getInput.getCurrentChoice
    if answer == nil
      return 0
    else
      return getChoiceNum(userQuestion.getInput.getChoices.getVector, answer)
    end
  end
  
  def answerText(user, question)
    userQuestion = user ? userObject(question, user) : question
    if question.is_a?(OTQuestion)
      if userQuestion.input.is_a?(OTChoice)
        return choiceLabel(answerNum(userQuestion))
      elsif userQuestion.input.is_a?(OTEmbeddedTextInput)
        return answerTextET(userQuestion.input)
      end
    elsif question.is_a?(OTDataTable)
      return dtAnswerText(user, question)
    elsif question.is_a?(OTText)
      return userQuestion.getText
    end
  end
  
  ## input: OTEmbeddedTextInput
  def answerTextET(input)
    answers = input.getTextObjects.getVector.map { |x| 
      t = x.getText
      (t == nil) ? '-' : t 
    }
    return answers.join(',')
  end
  
  def answerHtmlText(user, question)
    text = answerText(user, question)
    if isGradable(question)
      color = isCorrect(user, question) ? 'green' : 'red'
      return "<b><font color=\"#{color}\">#{text}</font></b>"
    else
      return text
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
      end
    }
    return text
  end
  
  def surveyAnswerText(user, question)
    userQuestion = userObject(question, user)
    if question.is_a?(OTQuestion) && question.input.is_a?(OTChoice)
      answer = userQuestion.input.getCurrentChoice
      return answer ? answer.getBodyText : '-'
    elsif question.is_a?(OTText)
      answer = userQuestion.getText
      return answer ? answer : '-'
    end
    return 'ERROR'
  end
  
  ## Return true if question has a correct answer
  def isGradable(question)
    return question.is_a?(OTQuestion) and (question.input.is_a?(OTChoice) or question.input.is_a?(OTEmbeddedTextInput))
  end
  
  def isCorrect(user, question)
    if question.is_a?(OTQuestion)
      userQuestion = user ? userObject(question, user) : question
      input = userQuestion.input  
      if input.is_a?(OTChoice)
        userAnswer = input.getCurrentChoice
        if userAnswer and question.getCorrectAnswer
          return question.correctAnswer.otExternalId == userAnswer.otExternalId
        end
      elsif input.is_a?(OTEmbeddedTextInput)
        answers = input.getTextObjects.getVector.map { |x| x.getText }
        correctAnswers = input.getCorrectAnswers.getVector.map { |x| x.getText }
        return answers == correctAnswers
      end
    end
    return false
  end
  
  def getChoiceNum(options, choice)
    num = 0
    options.size.times do |i| 
      if options[i].otExternalId == choice.otExternalId 
        num = i + 1
        break 
      end  
    end 
    return num 
  end
  
  def choiceLabel(choiceNum)
    labels = ['a', 'b', 'c', 'd', 'e', 'f']
    return choiceNum > 0 ? labels[choiceNum-1] : '-'
  end 
  
  def getPoints(user)
    return questions.inject(0) { |sum, question| sum + (isCorrect(user, question) ? 1 : 0) }
  end
  
  def totalMaxPoints
    return questions.size
  end
  
end
