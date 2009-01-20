require 'jruby'
require 'erb'

include_class 'java.lang.System'
include_class 'org.concord.framework.otrunk.view.OTUserListService'
include_class 'org.concord.framework.otrunk.OTrunk'
include_class 'org.concord.framework.otrunk.wrapper.OTString'
include_class 'org.concord.otrunk.ui.OTText'
include_class 'org.concord.otrunk.script.ui.OTScriptVariable'

class OTrunkHelper

  MC_SINGLE_REPORT = 1 #Individual report for multi-choice test
  MC_GROUP_REPORT = 2  #Group report for multi-choice test 
  PF_SINGLE_REPORT = 3 #Individual report for performance assessment
  PF_GROUP_REPORT = 4  #Group report for performance assessment

  def initialize(task)
    @users = nil
    @scriptObjectContentsMap = nil
    @questions = nil

    @task = task 
    _sanityCheck

    @otrunk = $viewContext.getViewService(OTrunk.java_class)
  end
  
  def rootObject
    @otrunk.getRoot
  end

  def activityRoot
    return case @task
      when MC_SINGLE_REPORT 
        $unit
      when MC_GROUP_REPORT, PF_GROUP_REPORT 
        rootObject.reportTemplate.reference
      else 
        nil
      end
  end

  def userObject(obj, user)
    @otrunk.getUserRuntimeObject(obj, user)
  end

  def users
    unless @users
      userListService = $viewContext.getViewService(OTUserListService.java_class)
      @users = userListService.getUserList().sort_by { |user| #sort users by name
        (user.name && !user.name.empty?) ? user.name.downcase.split.values_at(-1, 0) : ['']    
      }
    end
    return @users
  end

  def hasUserModified(obj, user)
    @otrunk.hasUserModified(obj, user)
  end

  def teacherName
    name = System.getProperty('report.teacher.name')
    return (name == nil) ? 'Unknown' : name
  end

  def className
    name = System.getProperty('report.class.name')
    return (name == nil) ? 'Unknown' : name
  end

  def activityName
    name = System.getProperty('report.activity.name')
    return (name == nil) ? 'Unknown' : name
  end

  ## @scriptObjectContentsMap is a hash where a key is an OTUser object
  ## and a value is a Vector of objects (possibly of OTAssessment type) for the user 
  def scriptObjectContentsMap
    unless @scriptObjectContentsMap
      contentsMap = {} #{ userObject => contentsList } 
      users.each { |u| contentsMap[u] = userObject($scriptObject, u).getContents.getVector }
      @scriptObjectContentsMap = contentsMap
    end
    return @scriptObjectContentsMap
  end

  ## Get last item in user script object contents that is a sub-type of contentType 
  def getLastContent(user, contentType)
    last = nil
    for content in scriptObjectContentsMap[user] 
      last = content if content.kind_of?(contentType) 
    end
    return last
  end

  def otCreate(rconstant, &block)
    otObj = $otObjectService.createObject(rconstant.java_class)
    yield otObj
    otObj
  end

  def getQuestions
    unless @questions
      @questions = case @task
                   when MC_SINGLE_REPORT, MC_GROUP_REPORT
                     _getQuestionsThruDocRefs
                   when PF_SINGLE_REPORT, PF_GROUP_REPORT
                     _getQuestionsThruScriptObject
                   else
                     Util.error("Invalid @task value #{@task}")
                     nil 
                   end
    end
    return @questions
  end

 private

  def _sanityCheck
    _varCheck($otObjectService, '$otObjectService')
    _varCheck($viewContext, '$viewContext')
    case @task
    when MC_SINGLE_REPORT
      _varCheck($unit, '$unit')
    when MC_GROUP_REPORT
    when PF_SINGLE_REPORT, PF_GROUP_REPORT
      _varCheck($scriptObject, '$scriptObject')
      _varCheck($rubric, '$rubric')
    else
      Util.error("Invalid @task value #{@task}")
    end
  end

  def _varCheck(v, name)
    if defined?(v)
      Util.error("#{name} is nil") unless v
    else
      Util.error("#{name} not defined")
    end
  end

  def _getQuestionsThruDocRefs
    questions = []
    cards = activityRoot.getActivity.getContent.getCards.getVector

    for doc in cards
      refs = doc.getDocumentRefs
      for ref in refs
        if ref.is_a?(OTQuestion) or ref.is_a?(OTDataTable) or ref.is_a?(OTText)
          questions << ref
        end
      end
    end
    return questions
  end

  def _getQuestionsThruScriptObject
    questions = []
    variables = $scriptObject.getVariables.getVector
    for v in variables
      questions << v.getReference if v.getReference.is_a? OTQuestion
    end
    return questions
  end

end
