require 'rexml/document'
require 'rexml/formatters/pretty'

include_class 'org.concord.otrunk.ui.OTChoice'
include_class 'org.concord.otrunk.ui.OTImage'
include_class 'org.concord.otrunk.ui.OTText'
include_class 'org.concord.otrunk.ui.question.OTQuestion'

class XmlReport
  
  def self.escapeXML(xmlText)
    xmlText.gsub!(/</, '&lt;')
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
  
  def addQuestions(questions, sectionId)
    questions.each_with_index do |question, index|
      @questionsElem.add_element(_getQuestionElem(question, index, sectionId))
    end
    @questions += questions
  end
  
  def addStudent(user)
    realUserId = user.globalId
    userDbURL = @otrunkHelper.otrunk.getOTDatabase(realUserId).sourceURL

    # need to do do a regex to get the workgroup id
    # http://saildataservice.concord.org/13/workgroups/69320/ot_learner_data.xml
    workgroup_id = /.*\/workgroups\/([0-9]*)\/.*/.match(userDbURL.to_s)[1]    

    studentElem = @studentsElem.add_element('student', {'name' => user.name, 'sds_workgroup_id' => workgroup_id})
    answersElem = studentElem.add_element('answers')
    @questions.each_with_index do |question, index|
      userQuestion = @otrunkHelper.userObject(question, user)
      answersElem.add_element(_getAnswerElem(userQuestion, index, user))
    end
  end
  
  private
  
  def _getQuestionElem(question, index, sectionId)
    questionType = _getQuestionType(question)
    elem = REXML::Element.new('question')
    elem.add_attributes('id' => question.otExternalId,
      'prompt' => _plainPromptText(question),
      'type' => questionType)
    elem
  end

  def _getAnswerElem(question, index, user)
    elem = REXML::Element.new('answer')
    elem.attributes['questionId'] = question.otExternalId
    case _getQuestionType(question)
      when 'choice' then
        _doChoiceAnswerElem(elem, question)
      when 'text' then
        _doTextAnswerElem(elem, question)
      when 'image' then
        _doImageAnswerElem(elem, question)
    else
      elem.text = 'UNKNOWN'
      STDERR.puts("getAnswerElem: Unknown question type!")
    end
    elem
  end

  def _doChoiceAnswerElem(answerElem, question)
    currentChoices = _getCurrentChoices(question.input)
    if currentChoices.size == 0
      answerElem.text = 'NO_ANSWER'
      return
    end
    choicesElem = answerElem.add_element('choices')
    currentChoices.each do |num, text|
      choiceElem = choicesElem.add_element('choice')
      choiceElem.add_attributes('num' => num.to_s, 'text' => text)
    end
  end

  def _doTextAnswerElem(answerElem, question)
    text = question.input.text
    text = text == nil ? '' : text.strip
    answerElem.text = text == '' ? 'NO_ANSWER' : text
  end

  def _doImageAnswerElem(answerElem, question)
    url = _getImageBlobUrl(question.input)
    if url
      imageElem = answerElem.add_element('image')
      imageElem.attributes['src'] =  url.toExternalForm
    else
      answerElem.text = 'NO_ANSWER'
    end
  end

  def _getQuestionType(question)
    if question.is_a?(OTQuestion)
      input = question.input
      if input.is_a?(OTChoice)
        return 'choice'
      elsif input.is_a?(OTText)
        return 'text'
      elsif input.is_a?(OTImage)
        return 'image'
      end
      puts "UNKNOWN INPUT TYPE #{input.getClass.getName} - #{question.prompt.text}"
    end
    return 'unknown'
  end

  ## Return a number corresponding to the choice, beginning with 1.
  ## choosers: an OTChoice
  ## choice: user's choice, as can be retrieved with getCurrentChoice()
  def _getChoiceNum(chooser, choice)
    num = 0
    chooser.getChoices.each_with_index do |option, i|
      if option.otExternalId == choice.otExternalId
        num = i + 1
        break
      end
    end
    num
  end

  ## Returns a list of pairs [choiceNum, choiceText]
  def _getCurrentChoices(chooser)
    choices = []
    answer = chooser.currentChoice

    if answer
      choices << [_getChoiceNum(chooser, answer), toPlainText(answer)]
    elsif chooser.currentChoices.size > 0
      chooser.currentChoices.each do |item|
        choices << [_getChoiceNum(chooser, item), toPlainText(item)]
      end
    end
    choices
  end

  ## image: an OTImage
  def _getImageBlobUrl(image)
    url = ''
    if image.isResourceSet("imageBytes")
      imageBytesProp = image.otClass.getProperty('imageBytes')
      return nil if imageBytesProp.nil?

      blob = image.otGet(imageBytesProp)
      if blob.nil?
        return nil
      else
        puts 'blob class=' + blob.java_class.to_s
        url = blob.getBlobURL
        if url.nil?
          return nil
        else
          return url
        end
      end
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

  def _promptText(question)
    obj = question.prompt
    if obj.is_a? org.concord.otrunk.view.document.OTCompoundDoc
      obj.bodyText
    elsif obj.is_a? org.concord.otrunk.ui.OTText
      obj.text
    end
  end

  def _plainPromptText(question)
    _toPlainText(question.prompt)
  end

  def _toPlainText(obj)
    text = ''
    if obj.is_a? org.concord.otrunk.view.document.OTCompoundDoc
      text = obj.bodyText
    elsif obj.is_a? org.concord.otrunk.ui.OTText
      text = obj.text
    elsif obj.is_a? String
      text = obj
    end
    text.gsub!(/<.*?>/, '')
    text.gsub!(/\s+/, ' ')
    text.strip
  end

end
