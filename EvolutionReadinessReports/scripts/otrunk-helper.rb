require 'jruby'

include_class 'java.io.ByteArrayOutputStream'
include_class 'java.lang.System'

include_class 'org.concord.datagraph.state.OTDataCollector'
include_class 'org.concord.framework.otrunk.OTrunk'
include_class 'org.concord.framework.otrunk.view.OTUserListService'
include_class 'org.concord.otrunk.navigation.OTNavigationHistoryService'
include_class 'org.concord.otrunk.ui.menu.OTMenu'
include_class 'org.concord.otrunk.ui.question.OTQuestion'
include_class 'org.concord.otrunk.xml.ExporterJDOM'
include_class 'org.concord.otrunk.xml.XMLDatabase'
include_class 'org.concord.otrunkmw.OTModelerPage'

## OTrunk related routines
class OTrunkHelper
  
  attr_reader :otrunk

  def initialize
    @users = nil
    @questions = []
    _sanityCheck
    @otrunk = $viewContext.getViewService(OTrunk.java_class)
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
  
  ## Export the ot object to XML string
  def toXmlStr(otObject, depth=1)
    tempDb = XMLDatabase.new
    tempObjectService = @otrunk.createObjectService(tempDb)
    newObj = tempObjectService.copyObject(otObject, depth)
    tempDb.setRoot(newObj.getGlobalId)
    outStream = ByteArrayOutputStream.new
    ExporterJDOM.export(outStream, tempDb.getRoot(), tempDb)
    outStream.toString
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
    allQuestions = @otrunk.getAllObjects(org.concord.otrunk.ui.question.OTQuestion.java_class)
  allQuestions.each do |q|
    _addQuestion("",q)
  end
    @questions
  end
  
  def getMwModels
    models = []
  allModels = @otrunk.getAllObjects(org.concord.otrunkmw.OTModelerPage.java_class)
  allModels.each {|m| models << m}
    models
  end

  # returns an array of numbers, each number representing the index of each level
  # for most activities, this will be [section_num, page_num] or [section_num, page_num, inner_page_num]
  def objectLocationInActivity(object)
    indexes = []
    return indexes if object == nil
    # puts "object: " + object.java_class.name
    card_container_parent_paths = @otrunk.getIncomingReferences(object.getGlobalId(), OTCardContainer.java_class, true)
    card_container_parent_paths.sort{|a,b| b.size <=> a.size}.each do |path|
      containerId = path[path.size-1].getSource()
      cardId = path[path.size-1].getDest()
      index = _indexInCardContainer(containerId, cardId)
      indexes << index
    end
    return indexes.compact
  end
  
  def self.humanizeTime(seconds)
    years = months = days = hours = minutes = 0
        
    if seconds >= 60
      minutes = (seconds / 60).to_i
      seconds = seconds % 60
      if minutes >= 60
        hours = (minutes / 60).to_i
        minutes = (minutes % 60).to_i
        if hours >= 24
          days = (hours / 24).to_i
          hours = (hours % 24).to_i
          if days >= 30
            months = (days / 30).to_i
            days = (days % 30).to_i
            if months >= 12
              years = (months / 12).to_i
              months = (months % 12).to_i
            end
          end
        end
      end
    end
    
    out = ""
    outed = false
    if years != 0
      out << years
      outed = true
    end
    out,outed = _append(out, months, outed)
    out,outed = _append(out, days, outed)
    out,outed = _append(out, hours, outed)
    out,outed = _append(out, minutes, outed)
    if outed
      out << ":"
    end
    out << ("%02d" % seconds)
  end

 private
 
  def self._append(out, value, outed)
    if outed || value != 0
      out << ":" if outed
      out << ("%02d" % value)
      outed = true
    end
    return out,outed
  end

  def _indexInCardContainer(containerId, cardId)
    container = @otrunk.root_object_service.getOTObject(containerId)
    if container != nil
      cards = container.getCards()
      cards.each_with_index do |c, i|
        if cardId.equals(c.getGlobalId())
          return i+1
        end
      end
    end
    return nil
  end

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