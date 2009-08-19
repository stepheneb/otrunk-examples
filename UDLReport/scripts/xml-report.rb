require 'rexml/document'
require 'rexml/formatters/pretty'

include_class 'org.concord.otrunk.ui.OTChoice'
include_class 'org.concord.otrunk.ui.OTImage'
include_class 'org.concord.otrunk.ui.OTText'
include_class 'org.concord.otrunk.ui.question.OTQuestion'
include_class 'org.concord.framework.otrunk.wrapper.OTObjectSet'

class XmlReport
  
  def self.escapeXML(xmlText)
    xmlText.gsub!(/</, '&lt;')
  end
  
  def self.getQuestionType(question)
    if question.is_a?(OTQuestion)
      input = question.input
      if input.is_a?(OTChoice)
        return 'choice'
      elsif input.is_a?(OTText)
        return 'text'
      elsif input.is_a?(OTImage)
        return 'image'
      end
    end
    return 'unknown'
  end

  def initialize(projectName, otrunkHelper)
    @otrunkHelper = otrunkHelper
    @doc = REXML::Document.new
    #@doc << REXML::XMLDecl.new
    
    schoolName = sysProp("report.school.name", "Undefined School Name")
    teacherName = sysProp("report.teacher.name", "Undefined Teacher Name")
    className = sysProp("report.class.name", "Undefined Class Name")
    activityName = sysProp("report.activity.name", "Undefined Activity Name")

    @rootElem = _createRoot(projectName, schoolName, teacherName, className, activityName)
    @sectionsElem = @rootElem.add_element('sections')
    @questionsElem = @rootElem.add_element('questions')
    @studentsElem = @rootElem.add_element('students')
    @questions = []
  end
  
  def getText
    @doc.to_s
  end
  
  def getPrettyText
    text = ''
    REXML::Formatters::Pretty.new(2).write(@doc, text)
    text
  end
  
  def addSection(section, id)
    sectionElem = @sectionsElem.add_element('section', 'id' => id, 'name' => section.name)
  end
  
  class StandardQuestionWrapper
    def initialize(question, otrunkHelper)
      @question = question
      @otrunkHelper = otrunkHelper
    end
    
    def setupQuestionElement(elem)
      questionType = XmlReport.getQuestionType(@question)
      if questionType == 'choice'
        correctAnswer = @question.correctAnswer
        if correctAnswer
          if correctAnswer.is_a? OTObjectSet
            correctAnswerText = correctAnswer.objects.collect{|answer|
              @otrunkHelper.toPlainText(answer)
            }.join("; ")
            if correctAnswer.objects.size > 0
              @hasScore = true
              @maxScore = correctAnswer.objects.size
            end

            # check if the correctAnswers are all in the choices
            # if not then do not include the hasScore
            correctAnswer.objects.each do |answer|
              if not @question.input.choices.include? answer
                @hasScore = false
                break
              end
            end

          else
            @maxScore = 1
            correctAnswerText = @otrunkHelper.toPlainText(correctAnswer)
            if @question.input.choices.include? correctAnswer
              @hasScore = true
            end
          end

          if @hasScore
            elem.add_attributes('hasScore' => 'true', 'maxScore' => @maxScore.to_s)
          end

          elem.add_attributes('correctAnswer' => correctAnswerText)

          # check if the correct Answer actually matches one of the objects in the choices list
          # there are cases of correct answers for choices that don't actually match
        end
      end
      elem.add_attributes(
      'prompt' => @otrunkHelper.plainPromptText(@question),
      'type' => questionType)
      elem
    end

    def setupAnswerElement(elem, otrunkHelper, user)
      userQuestion = @otrunkHelper.userObject(@question, user)

      case XmlReport.getQuestionType(@question)
        when 'choice' then
          _doChoiceAnswerElem(elem, @question)
        when 'text' then
          _doTextAnswerElem(elem, @question)
        when 'image' then
          _doImageAnswerElem(elem, @question)
      else
        elem.text = 'UNKNOWN'
        STDERR.puts("getAnswerElem: Unknown question type!")
      end
      elem
    end
    
    def questionId()
      @question.otExternalId
    end
    
    private 
    
    def _doChoiceAnswerElem(answerElem, question)
      currentChoices = @otrunkHelper.getCurrentChoices(question.input)
      if currentChoices.size == 0
        answerElem.text = 'NO_ANSWER'
        return
      end

      score = 0
      
      correctAnswer = @question.correctAnswer
      choicesElem = answerElem.add_element('choices')
      currentChoices.each do |num, choice|
        choiceElem = choicesElem.add_element('choice')
        choiceElem.add_attributes('num' => num.to_s, 'text' => @otrunkHelper.toPlainText(choice))
        if @hasScore
          if correctAnswer.is_a? OTObjectSet
            if correctAnswer.objects.include? choice
              score += 1
            end                            
          else
            if correctAnswer == choice
              score = 1
            end                  
          end          
        end
      end
      
      if @hasScore
        answerElem.add_attributes('score' => score)
      end
    end
  
    def _doTextAnswerElem(answerElem, question)
      text = question.input.text
      text = text == nil ? '' : text.strip
      answerElem.text = text == '' ? 'NO_ANSWER' : text
    end
  
    def _doImageAnswerElem(answerElem, question)
      url = @otrunkHelper.getImageBlobUrl(question.input)
      if url
        imageElem = answerElem.add_element('image')
        imageElem.attributes['src'] =  url.toExternalForm
      else
        answerElem.text = 'NO_ANSWER'
      end
    end

  end
  
  class LeveledQuestionLevelWrapper
    def initialize(question, otrunkHelper)
      @question = question
      @otrunkHelper = otrunkHelper
    end
    
    def setupQuestionElement(element)
      element.add_attributes('prompt' => getPrompt(),
        'type' => 'text')
    end
    
    def getPrompt()
      "Level of Leveled Question: " + @otrunkHelper.plainPromptText(@question.questions.get(0))
    end
    
    def setupAnswerElement(element, otrunkHelper, user)
      userQuestion = @otrunkHelper.userObject(@question, user)
      
      element.text = userQuestion.currentIndex.to_s
    end
    
    def questionId()
      "current_level:#{@question.otExternalId}"
    end
  end
  
  class LeveledQuestionClickedWrapper < LeveledQuestionLevelWrapper 
    def getPrompt()
      "Times Clicked of Leveled Question: " + @otrunkHelper.plainPromptText(@question.questions.get(0))
    end
    
    def setupAnswerElement(element, otrunkHelper, user)
      userQuestion = @otrunkHelper.userObject(@question, user)      
      element.text = userQuestion.timesClicked.to_s
    end
    
    def questionId()
      "times_clicked:#{@question.otExternalId}"
    end
  end

  class GlossaryWordStudentDefWrapper
    def initialize(glosWord, otrunkHelper)
      @glosWord = glosWord
      @otrunkHelper = otrunkHelper
      
      # these are weird hacks inorder to make the udl-multipage-report methods
      # work from this class
      @otrunk = @otrunkHelper.otrunk
      @contentHelper = UDLContentHelper.getUDLContentHelper(activityRoot)
    end
    
    def setupQuestionElement(element)
      element.add_attributes('prompt' => getPrompt(), 'type' => 'text')
    end
    
    def getPrompt()
      "Student Def of #{@glosWord.word}"
    end
    
    def getUserGlosWord(user)
      userGlossaryWords(user).select{|userGlosWord|
        userGlosWord.word == @glosWord.word
      }.first
    end
    
    def setupAnswerElement(element, otrunkHelper, user)      
      userGlosWord = getUserGlosWord(user)      
      element.text = userGlosWord.studentDefinition.to_s
    end
    
    def questionId()
      # the glosWords can be created dynamically from a text file list so they will
      # have changing ids so we can't just use their global id
      "student_def:#{@glosWord.word}"
    end
  end

  class GlossaryWordShownCountWrapper < GlossaryWordStudentDefWrapper
    
    def getPrompt()
      "Shown Count of #{@glosWord.word}"
    end
    
    def setupAnswerElement(element, otrunkHelper, user)      
      userGlosWord = getUserGlosWord(user)      
      element.text = userGlosWord.shownCount.to_s
    end

    def questionId()
      # the glosWords can be created dynamically from a text file list so they will
      # have changing ids so we can't just use their global id
      "def_shown_count:#{@glosWord.word}"
    end
  end

    
  def addQuestions(questions, sectionId)
    questions.each{|q|
      addQuestionWrapper(StandardQuestionWrapper.new(q, @otrunkHelper))
    }
  end
  
  def addQuestionWrapper(wrapper)
    elem = REXML::Element.new('question')
    elem.attributes['id'] = wrapper.questionId()
    wrapper.setupQuestionElement(elem) 
    @questionsElem.add_element(elem)
    @questions << wrapper
  end
  
  def addStudent(user)
    realUserId = user.globalId
    userDbURL = @otrunkHelper.otrunk.getOTDatabase(realUserId).sourceURL

    # need to do do a regex to get the workgroup id
    # http://saildataservice.concord.org/13/workgroups/69320/ot_learner_data.xml
    workgroup_id = /.*\/workgroups\/([0-9]*)\/.*/.match(userDbURL.to_s)[1]    

    studentElem = @studentsElem.add_element('student', {'name' => user.name, 'sds_workgroup_id' => workgroup_id})
    answersElem = studentElem.add_element('answers')
    @questions.each do |question|
      elem = REXML::Element.new('answer')
      elem.attributes['questionId'] = question.questionId()
      question.setupAnswerElement(elem, @otrunkHelper, user)
      answersElem.add_element(elem)
    end
  end
    
  def _createRoot(projectName, schoolName, teacherName, className, activityName)
    rootElem = @doc.add_element('report', { 'project' => projectName,
      'school' => schoolName,
      'teacher' => teacherName,
      'class' => className,
      'activity' => activityName
    })
  end

end
