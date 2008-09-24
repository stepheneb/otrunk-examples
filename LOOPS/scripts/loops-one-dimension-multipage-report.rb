require 'erb'

import java.lang.System

include_class 'org.concord.framework.otrunk.view.OTUserListService'
include_class 'org.concord.framework.otrunk.OTrunk'
include_class 'org.concord.datagraph.state.OTDataGraph'
include_class 'org.concord.datagraph.state.OTDataGraphable'
include_class 'org.concord.otrunk.script.ui.OTScriptVariable'
include_class 'org.concord.framework.otrunk.wrapper.OTString'

def getText
  @otrunk = $viewContext.getViewService(OTrunk.java_class);
  if $action
    actionStr = $action.string
  else
    actionStr = "page1"
  end
  eval(actionStr)
end

def page1
  render $template_page1
end

def page2
  render $template_page2
end

def page3
  render $template_page3
end

def render(templateBlob)
  erb = ERB.new Java::JavaLang::String.new(templateBlob.src).to_s
  erb.result(binding)   
end 

def embedObject(obj)
  "<object refid=\"#{ obj.otExternalId() }\"/>"
end

def linkToObject(link_text, obj)
  "<a href=\"#{ obj.otExternalId() }\">#{link_text}</a>"
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

def teacher_name
  System.getProperty("report.teacher.name") || "not available"
end

def class_name
  System.getProperty("report.class.name") || "not available"
end

def users
  userListService = $viewContext.getViewService(OTUserListService.java_class)
  userListService.getUserList()
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

def colors
  ["65AE24", "E08024", "905BF5", "568AD8", "B03A7F", "99A62A"]
end

def nextColor
  color = colors[@colorIndex % colors.length].hex
  @colorIndex += 1
  color
end

def multiUserGraph(dataGraph, dataStore)
  otCreate(OTDataGraph) { |multiUserGraph|
    multiUserGraph.title = dataGraph.title
    multiUserGraph.showGraphableList=true
    multiUserGraph.graphableListEditable=false
    multiUserGraph.xDataAxis = dataGraph.xDataAxis
    multiUserGraph.yDataAxis = dataGraph.yDataAxis
    @colorIndex = 0
    graphables = multiUserGraph.graphables
    users.each { |user|
      next unless hasUserModified(dataStore,user)
      graphables.add(otCreate(OTDataGraphable) { | graphable |
        graphable.name = user.name
        graphable.color = nextColor
        graphable.xColumn=0
        graphable.yColumn=1
        graphable.locked=true
        graphable.drawMarks=false
        graphable.dataStore = userObject(dataStore,user)
      })
    }  
  }   
end
