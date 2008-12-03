require 'jruby'
require 'erb'

include_class 'java.lang.System'
include_class 'org.concord.framework.otrunk.view.OTUserListService'
include_class 'org.concord.framework.otrunk.OTrunk'
include_class 'org.concord.framework.otrunk.wrapper.OTString'
include_class 'org.concord.otrunk.ui.OTText'
include_class 'org.concord.otrunk.script.ui.OTScriptVariable'

class OTrunkHelper
  
  INDIVIDUAL_REPORT = 1
  GROUP_REPORT = 2
    
  def initialize(task)
    @task = task # INDIVIDUAL_REPORT or GROUP_REPORT
    @otrunk = $viewContext.getViewService(OTrunk.java_class)
  end
  
  def rootObject
    @otrunk.getRoot
  end
  
  def activityRoot
    case @task
      when INDIVIDUAL_REPORT then return $unit
      when GrOUP_REPORT then return $unit
    else
      return nil
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
  
  ## @scriptObjectContentsMap is a hash where a key is an OTUser object
  ## and a value is a Vector of objects (possibly of OTAssessment type) for the user 
  def scriptObjectContentsMap
    unless @scriptObjectContentsMap
      contentsMap = {} #{ userObject => contentsList } 
      users.each { |u| contentsMap[u] = userObject($scriptObject, u).getContents.getVector }
    end
    return @scriptObjectContentsMap
  end

  def otCreate(rconstant, &block)
    otObj = $otObjectService.createObject(rconstant.java_class)
    yield otObj
    otObj
  end
  
end
