require 'jruby'
require 'erb'

include_class 'java.lang.System'
include_class 'org.concord.framework.otrunk.view.OTUserListService'
include_class 'org.concord.framework.otrunk.OTrunk'
include_class 'org.concord.framework.otrunk.wrapper.OTString'
include_class 'org.concord.otrunk.ui.OTText'
include_class 'org.concord.otrunk.script.ui.OTScriptVariable'

### BEGIN View/Controller Stuff ###

def default_template
  render $template
end

def render(templateBlob)
  erb = ERB.new Java::JavaLang::String.new(templateBlob.src).to_s
  erb.result(binding)   
end 

def embedObject(obj)
  "<object refid=\"#{obj.otExternalId()}\"/>"
end

def embedUserObject(obj, user)
  "<object refid=\"#{obj.otExternalId()}\" user=\"#{user.getUserId().toExternalForm()}\"/>"
end

def linkToObject(link_text, obj, viewEntry=nil)
  link = "<a href=\"#{obj.otExternalId()}\" "
  link += "viewid=\"#{viewEntry.otExternalId()}\" "  if viewEntry
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
  "<a href=\"#{obj.otExternalId()}\" viewid=\"#{viewEntryCopy.otExternalId()}\">#{link_text}</a>"
end

def popupLinkToObject(link_text, obj, viewEntry=nil)
  link = "<a href=\"#{ obj.otExternalId() }\" "
  link += "viewid=\"#{ viewEntry.otExternalId() }\" "  if viewEntry
  link += " target=\"#{ popupFrame.otExternalId }\">#{link_text}</a>"  
end

def linkToUnitPage(link_text)
  firstObject = rootObject.reportTemplate
  firstView = rootObject.reportTemplateViewEntry
  linkToObject link_text, firstObject, firstView
end

def popupFrame
  return @frame if @frame 
  
  @frame = otCreate(org.concord.framework.otrunk.view.OTFrame) { |frame| }
end

### END View/Controller Stuff ###

### BEGIN OTrunk/Data Utilities ###

def otCreate(rconstant, &block)
  otObj = $otObjectService.createObject(rconstant.java_class)
  yield otObj
  otObj
end

def rootObject
  @otrunk.root
end

def activityRoot
  rootObject.reportTemplate.reference
end

def userObject(obj, user)
  @otrunk.getUserRuntimeObject(obj, user);
end

def users
  @users
end

def hasUserModified(obj, user)
  @otrunk.hasUserModified(obj, user)
end

def findFirstChild(rconstant, startObject)
  # check if the startObject is one of theses
  # if not go through all of its children objects
  # perhaps we should just do this in java
end

def teacherName
  name = System.getProperty("report.teacher.name")
  if name == nil
    return 'Unknown'
  end
  name
end

def className
  name = System.getProperty("report.class.name")
  if name == nil
    return 'Unknown'
  end
  name
end

## @contentsMap is a hash where a key is an OTUser object
## and a value is a Vector of objects (possibly of OTAssessment type) for the user 
def contentsMap
  @contentsMap
end

def _retrieveUsers
  userListService = $viewContext.getViewService(OTUserListService.java_class)
  return userListService.getUserList().sort_by { |user| #sort users by name
    (user.name && !user.name.empty?) ? user.name.downcase.split.values_at(-1, 0) : ['']    
  }
end

def _createContentsMap
  contentsMap = {} #{ userObject => contentsList } 
  # users is a Java vector returned by OTUserListService.getUserList 
  # Ruby presents Java vectors as enumerables. This means you can use
  # any of the methods that Ruby's Enumerable module mixes in.
  users.each { |u| contentsMap[u] = userObject($scriptObject, u).getContents.getVector }
  contentsMap
end

def choiceNum(options, choice)
  num = 0
  options.size.times do |i|
    if options[i].otExternalId == choice.otExternalId
      num = i+1
      break
    end 
  end
  num
end

### END OTrunk/Data Utilities ###

### BEGIN Misc. Utilities ###

def avg(list)
  list.inject(0) { |sum, e| sum + e } / list.length.to_f
end

def checkType?(obj, klass)
  return true if obj.is_a? klass
  
  error "obj is a #{obj.java_class} instead of being a #{klass.java_class.name}"
  false
end

def truncate (string, length)
  postFix = ""
  postFix = "..." if string.length > length
  string[0...length] + postFix
end

def error(message)
  System.err.println(message)
end

def log(message)
  System.out.println(message)
end

### END Misc. Utilities ###
 