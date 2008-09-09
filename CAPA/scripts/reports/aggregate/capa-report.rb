require 'jruby'
require 'erb'
include_class 'java.lang.System'
include_class 'org.concord.framework.otrunk.view.OTUserListService'
include_class 'org.concord.framework.otrunk.OTrunk'
include_class 'org.concord.framework.otrunk.wrapper.OTString'
include_class 'org.concord.otrunk.script.ui.OTScriptVariable'
include_class 'org.concord.otrunkcapa.rubric.OTAssessment'
include_class 'org.concord.otrunkcapa.rubric.RubricGradeUtil'

ROWCOLOR1 = "#FFFEE9"
ROWCOLOR2 = "#FFFFFF"

# Called when the script view is loaded
def getText
  @debug = true  
  init 
  
  if $action
    actionStr = $action.string
  else
    actionStr = "default_template"
  end
  eval(actionStr)
end

def init
  @otrunk = $viewContext.getViewService(OTrunk.java_class)
  @users = _retrieveUsers
  @contentsMap = _createContentsMap
end

def users
  return @users
end

def teacherName
  name = System.getProperty("report.teacher.name")
  if name == nil
    return 'Unknown'
  end
  return name
end

def className
  name = System.getProperty("report.class.name")
  if name == nil
    return 'Unknown'
  end
  return name
end

def contentsMap
  return @contentsMap
end

def _retrieveUsers
  userListService = $viewContext.getViewService(OTUserListService.java_class)
  return userListService.getUserList().sort do |u1, u2| 
    sep = /[\s,]+/
    n1 = u1.name.split(sep)
    n2 = u2.name.split(sep)
    last1 = n1[n1.length-1]
    last2 = n2[n2.length-1]
    first1 = n1.length > 1 ? n1[0] : ''
    first2 = n2.length > 1 ? n2[0] : ''
  
    if last1 < last2 
      -1
    elsif last1 > last2
      1
    elsif first1 < first2
      -1
    elsif first1 > first2
      1
    else
      0
    end
  end
end

def _createContentsMap
  contentsMap = {} #{ userName => contentsList } 
  users.size.times do |i|
    user = users.get(i)
    runtimeObject = @otrunk.getUserRuntimeObject($scriptObject, user)
    contentsMap[user.getName] = runtimeObject.getContents
  end
  return contentsMap
end

def default_template
  render $template
end

def render(templateBlob)
  erb = ERB.new Java::JavaLang::String.new(templateBlob.src).to_s
  erb.result(binding)   
end 

def embedObject(obj)
  "<object refid=\"#{ obj.otExternalId() }\"/>"
end

def otCreate(rconstant, &block)
  otObj = $otObjectService.createObject(rconstant.java_class)
  yield otObj
  otObj
end

def linkToObject(link_text, obj, viewEntry=nil)
  link = "<a href=\"#{ obj.otExternalId() }\" "
  link += "viewid=\"#{ viewEntry.otExternalId() }\" "  if viewEntry
  link += ">#{link_text}</a>"
end

def linkToObjectAction(link_text, obj, action)
  viewEntryCopy = $otObjectService.copyObject($viewEntry, 1)
  viewEntryCopy.variables.add(otCreate(OTScriptVariable){|scriptVar|
    scriptVar.name="action"
    scriptVar.reference = otCreate(OTString){|str|
      str.string=action
    }
  })
  "<a href=\"#{ obj.otExternalId() }\" viewid=\"#{viewEntryCopy.otExternalId()}\">#{link_text}</a>"
end

def users
  return @users
end

def embedUserObject(obj, user)
  "<object refid=\"#{ obj.otExternalId() }\" user=\"#{ user.getUserId().toExternalForm() }\"/>"
end

def hasUserModified(obj, user)
  @otrunk.hasUserModified(obj, user)
end

def userObject(obj, user)
  @otrunk.getUserRuntimeObject(obj, user);
end

def otCreate(rconstant, &block)
  otObj = $otObjectService.createObject(rconstant.java_class)
  yield otObj
  otObj
end

def findFirstChild(rconstant, startObject)
  # check if the startObject is one of theses
  # if not go through all of its children objects
  # perhaps we should just do this in java
end

def error(message)
  System.err.println(message)
end

def info(message)
  System.out.println(message)
end

def checkType?(obj, klass)
  return true if obj.is_a? klass
  
  log "obj is a #{obj.java_class} instead of being a #{klass.java_class.name}"
  false
end

def rootObject
  @otrunk.root
end

def truncate (string, length)
  postFix = ""
  postFix = "..." if string.length > length
  string[0...length] + postFix
end

def popupFrame
  return @frame if @frame 
  
  @frame = otCreate(org.concord.framework.otrunk.view.OTFrame) { |frame|
   }
end

def popupLinkToObject(link_text, obj, viewEntry=nil)
  frame = popupFrame
  link = "<a href=\"#{ obj.otExternalId() }\" "
  link += "viewid=\"#{ viewEntry.otExternalId() }\" "  if viewEntry
  link += " target=\"#{ popupFrame.otExternalId }\">#{link_text}</a>"  
end

def linkToUnitPage(link_text)
  firstObject = rootObject.reportTemplate
  firstView = rootObject.reportTemplateViewEntry
  linkToObject link_text, firstObject, firstView
end

def getLastAssessment(userName)
  assessment = nil
  contents = contentsMap[userName]
  contents.size.times do |i| 
    if contents.get(i).kind_of?(OTAssessment)
      assessment = contents.get(i)
    end 
  end
  return assessment  
end
