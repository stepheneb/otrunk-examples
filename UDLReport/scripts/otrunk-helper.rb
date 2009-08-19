require 'jruby'

include_class 'java.lang.System'

include_class 'org.concord.datagraph.state.OTDataCollector'
include_class 'org.concord.framework.otrunk.OTrunk'
include_class 'org.concord.framework.otrunk.view.OTUserListService'
include_class 'org.concord.otrunk.overlay.OTOverlayWrapper'
include_class 'org.concord.otrunk.ui.menu.OTMenu'
include_class 'org.concord.otrunk.ui.question.OTQuestion'

## OTrunk related routines
class OTrunkHelper

  def initialize
    @users = nil
    @questions = []
    _sanityCheck
    @otrunk = $viewContext.getViewService(OTrunk.java_class)
  end

  def otrunk
    @otrunk
  end
  
  ## Return root of the main OTML (e.g., the report otml)
  def rootObject
    @otrunk.getRoot
  end

  ## For reports, return the root of the OTML that it is reporting for
  def activityRoot
    rootObject.reportTemplate.reference
  end

  ## Return runtime user object
  def userObject(obj, user)
    @otrunk.getUserRuntimeObject(obj, user)
  end

  ## Return list of OTUsers
  def users
    unless @users
      userListService = $viewContext.getViewService(OTUserListService.java_class)
      @users = userListService.getUserList().sort_by { |user| #sort users by name
        (user.name && !user.name.empty?) ? user.name.downcase.split.values_at(-1, 0) : ['']    
      }
    end
    @users
  end

  def hasUserModified(obj, user)
    @otrunk.hasUserModified(obj, user)
  end
  
  def schoolName
    name = System.getProperty('report.school.name')
    (name == nil) ? 'Unknown' : name
  end

  def teacherName
    name = System.getProperty('report.teacher.name')
    (name == nil) ? 'Unknown' : name
  end

  def className
    name = System.getProperty('report.class.name')
    (name == nil) ? 'Unknown' : name
  end

  def activityName
    name = System.getProperty('report.activity.name')
    (name == nil) ? 'Unknown' : name
  end

  ## @scriptObjectContentsMap is a hash where a key is an OTUser object
  ## and a value is a Vector of objects (possibly of OTAssessment type) for the user 
  def scriptObjectContentsMap
    unless @scriptObjectContentsMap
      contentsMap = {} #{ userObject => contentsList } 
      users.each { |u| contentsMap[u] = userObject($scriptObject, u).getContents }
      @scriptObjectContentsMap = contentsMap
    end
    @scriptObjectContentsMap
  end

  ## Get last item in user script object contents that is a sub-type of contentType 
  def getLastContent(user, contentType)
    last = nil
    for content in scriptObjectContentsMap[user] 
      last = content if content.kind_of?(contentType) 
    end
    last
  end

  def otCreate(rconstant, &block)
    otObj = $otObjectService.createObject(rconstant.java_class)
    yield otObj
    otObj
  end
  
  def getQuestions
    udlContainer = activityRoot
    sections = udlContainer.content.cards
    sections.each do |section|
      compoundDocs = section.content.cards
      compoundDocs.each do |doc|
        doc.documentRefs.each do |obj|
          case obj
          when OTQuestion
            puts 'ot-question'
            _addQuestion(section.name, obj)
          when OTOverlayWrapper
            wrappedObj = obj.wrappedObject
            puts 'wrapped-obj ' + wrappedObj.toString
            case wrappedObj
            when OTQuestion
              puts 'ot-question wrapped'
              _addQuestion(section.name, wrappedObj)
            when OTDataCollector
              puts 'ot-data-collector wrapped'
            else
              puts 'Unknown question type ' + wrappedObj.toString
            end
          when OTDataCollector
            puts 'ot-data-collector'
          when OTMenu
            cards = obj.cardContainer.cards
            cards.each do |doc|
              doc.documentRefs.each do |obj|
                if obj.is_a?(OTQuestion)
                  puts 'ot-question wrapped in ot-menu'
                  _addQuestion(section.name, obj)
                else
                  puts 'Unknown question type' + obj.toString
                end
              end
            end
          else
            puts 'Unknown question type ' + obj.toString
          end
        end
      end
    end
    @questions
  end

  ## Return a number corresponding to the choice, beginning with 1.
  ## choosers: an OTChoice
  ## choice: user's choice, as can be retrieved with getCurrentChoice()
  def getChoiceNum(chooser, choice)
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
  def getCurrentChoices(chooser)
    choices = []
    answer = chooser.currentChoice
  
    if answer
      choices << [getChoiceNum(chooser, answer), toPlainText(answer)]
    elsif chooser.currentChoices.size > 0
      chooser.currentChoices.each do |item|
        choices << [getChoiceNum(chooser, item), toPlainText(item)]
      end
    end
    choices
  end
  
  ## image: an OTImage
  def getImageBlobUrl(image)
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
    
  def promptText(question)
    obj = question.prompt
    if obj.is_a? org.concord.otrunk.view.document.OTCompoundDoc
      obj.bodyText
    elsif obj.is_a? org.concord.otrunk.ui.OTText
      obj.text
    end
  end
  
  def plainPromptText(question)
    toPlainText(question.prompt)
  end
  
  def toPlainText(obj)
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

  
 private

  def _addQuestion(sectionName, question)
    @questions << question
  end

  def _sanityCheck
    _varCheck($otObjectService, '$otObjectService')
    _varCheck($viewContext, '$viewContext')
  end

  def _varCheck(v, name)
    if defined?(v)
      Util.error("#{name} is nil") unless v
    else
      Util.error("#{name} not defined")
    end
  end

end
