require 'rexml/document'
require 'rexml/formatters/pretty'
require 'rexml/xpath'

include_class 'org.concord.otrunk.navigation.OTNavigationHistoryService'
include_class 'org.concord.otrunk.ui.OTChoice'
include_class 'org.concord.otrunk.ui.OTImage'
include_class 'org.concord.otrunk.ui.OTText'
include_class 'org.concord.otrunk.ui.question.OTQuestion'

class XmlReport
  
  def self.escapeXML(xmlText)
    xmlText.gsub!(/</, '&lt;')
  end
  
  def initialize(projectName, otrunkHelper, questions, mwModels, navigationHistory)
    @otrunkHelper = otrunkHelper
    @questions = questions + [:mw_interaction_log, :navigation_log]
    @mwModels = mwModels
    @navHistory = navigationHistory
    
    @doc = REXML::Document.new
    #@doc << REXML::XMLDecl.new
    
    schoolName = sysProp("report.school.name", "Undefined School Name")
    teacherName = sysProp("report.teacher.name", "Undefined Teacher Name")
    className = sysProp("report.class.name", "Undefined Class Name")
    activityName = sysProp("report.activity.name", "Undefined Activity Name")

    @rootElem = _createRoot(projectName, schoolName, teacherName, className, activityName)
    @questionsElem = @rootElem.add_element('questions')
    
    @numQuestions = 0;
    _addQuestions()
    
    @studentsElem = @rootElem.add_element('students')
  end
  
  def getText
    @doc.to_s
  end
  
  def getPrettyText
    text = ''
    REXML::Formatters::Pretty.new(2).write(@doc, text)
    text
  end
  
  def addStudent(user)
    studentElem = @studentsElem.add_element('student', 'name' => user.name)
    sdsId = _getUsersSdsWorkgroupId(user)
    if sdsId
      # $stderr.puts "adding sds id #{sdsId} to user #{user.name}"
      studentElem.attributes['sds_workgroup_id'] = sdsId
    end
    
    answersElem = studentElem.add_element('answers')
    @questions.each_with_index do |question, index|
      if question == :mw_interaction_log
        answersElem.add_element(_getMwLogElem(index, user))
      elsif question == :navigation_log
      else
        userQuestion = @otrunkHelper.userObject(question, user)
        answersElem.add_element(_getAnswerElem(userQuestion, index, user))
      end
    end
  end
  
  private
  
  # this is a kludge, but it works as long as the user's database is an XMLDatabase and is loaded from the SDS
  # basically parse the SDS url for the user's workgroup id
  def _getUsersSdsWorkgroupId(user)
    sdsId = nil
    dbUrl = user.getOTObjectService().getMainDb().getContextURL()
    # $stderr.puts "db url: #{dbUrl.to_s}"
    if dbUrl.to_s =~ /workgroups\/([0-9]+)\/ot_learner_data/
      # $stderr.puts "db url matched! #{$1}"
      sdsId = $1
    end
    return sdsId
  end
  
  
  def _addQuestions
    @questions.each_with_index do |question, index|
      @questionsElem.add_element(_getQuestionElem(question, @numQuestions))
      @numQuestions += 1
    end
  end
  
  def _getQuestionElem(question, index)
    questionType = _getQuestionType(question)
    elem = REXML::Element.new('question')
    elem.add_attributes('id' => (index+1).to_s,
      'prompt' => (question.is_a?(Symbol) ? '' : _plainPromptText(question)),
      'type' => questionType)
    if questionType == 'mw_interaction_log'
      elem.attributes['type'] = 'text'
      elem.attributes['tags'] = 'mw_interaction_log'
    end
    if questionType == 'navigation_log'
      elem.attributes['type'] = 'text'
      elem.attributes['tags'] = 'navigation_log'
    end
    elem
  end

  def _getAnswerElem(question, index, user)
    elem = REXML::Element.new('answer')
    elem.attributes['questionId'] = (index + 1).to_s
    case _getQuestionType(question)
      when 'choice' then
        _doChoiceAnswerElem(elem, question)
        STDERR.puts("choice")
      when 'text' then
        _doTextAnswerElem(elem, question)
        STDERR.puts("text")
      when 'image' then
        _doImageAnswerElem(elem, question)
        STDERR.puts("image")
    else
      elem.text = 'UNKNOWN'
      STDERR.puts("getAnswerElem: Unknown question type!")
    end
    elem
  end
  
  def _getMwLogElem(index, user)
    modelText = ''
    
    @mwModels.each do |model|
      userModel = @otrunkHelper.userObject(model, user)
      events = userModel.events
      
      actionText = ''
      events.each do |actionItem|
        xmlStr = @otrunkHelper.toXmlStr(actionItem)
        xmlStr.gsub!(/.*(<OTActionItem.*<\/OTActionItem>).*/m, '\1')
        actionText << xmlStr
      end
      
      modelText << %Q[<OTModelerPage authoredDataURL="#{model.authoredDataURL}"><events>#{actionText}</events></OTModelerPage>]
    end
      
    elem = REXML::Element.new('answer')
    elem.attributes['questionId'] = (index + 1).to_s
    elem.text = %Q{"#{modelText}"}
    elem
  end
  
  def _getNavLogElem(index, user)
    #navService = @otrunkHelper.otrunk.getService(OTNavigationHistoryService.java_class)
    #userNavHistory = navService.getNavigationHistory(user)
                                
    userNavHistory = @otrunkHelper.userObject(@navHistory, user)
    text = ''
    
    userNavHistory.objects.each do |navigationEvent|
      xmlStr = @otrunkHelper.toXmlStr(navigationEvent, 0)
      xmlStr.gsub!(/.*(<OTNavigationEvent.*<\/OTNavigationEvent>).*/m, '\1')
      text << xmlStr
    end
    
    #puts "svc=#{$otObjectService.getOTrunkService(OTNavigationHistoryService.java_class).inspect}"
    #puts "svc=#{@otrunkHelper.otrunk.getService(OTNavigationHistoryService.java_class).inspect}"

    elem = REXML::Element.new('answer')
    elem.attributes['questionId'] = (index + 1).to_s
    elem.text = %Q{"#{text}"}
    elem
  end

  def _doChoiceAnswerElem(answerElem, question)
    currentChoices = _getCurrentChoices(question.input)
    if currentChoices.size == 0
      STDERR.puts("    no answer")
      answerElem.text = 'NO_ANSWER'
      return
    end
    choicesElem = answerElem.add_element('choices')
    currentChoices.each do |num, text|
      STDERR.puts("      answer! "+num.to_s+" " +(text == nil ? 'nil' : text))
      choiceElem = choicesElem.add_element('choice')
      choiceElem.add_attributes('num' => num.to_s, 'text' => text)
    end
  end

  def _doTextAnswerElem(answerElem, question)
    text = question.input.text
    STDERR.puts("   text = "+(text == nil ? 'nil' : text))
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
    elsif question == :mw_interaction_log || question == :navigation_log
      return question.to_s
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
        #puts 'blob class=' + blob.java_class.to_s
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