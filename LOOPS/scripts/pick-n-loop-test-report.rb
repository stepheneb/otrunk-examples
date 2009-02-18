require 'erb'
include_class 'org.concord.framework.otrunk.view.OTUserListService'
include_class 'org.concord.framework.otrunk.OTrunk'
include_class 'org.concord.datagraph.state.OTDataGraph'
include_class 'org.concord.datagraph.state.OTDataGraphable'

include_class 'org.concord.otrunk.intrasession.OTMultiUser'
include_class 'org.concord.otrunk.overlay.OTUserOverlayManager'
include_class 'org.concord.otrunk.user.OTUserObject'
include_class 'org.concord.otrunk.view.OTGroupListManager'
include_class 'org.concord.otrunk.view.OTGroupMember'

def getText
  if $model
    return "<h1> Here</h1>"
  end
  @otrunk = $graph.getOTObjectService().getOTrunkService(OTrunk.java_class);
  @groupListManager = $graph.getOTObjectService().getOTrunkService(OTGroupListManager.java_class);
  @overlayManager = $graph.getOTObjectService().getOTrunkService(OTUserOverlayManager.java_class);
    
  erb = ERB.new Java::JavaLang::String.new($template.src).to_s
  erb.result(binding)   
end

def users
  userListService = $viewContext.getViewService(OTUserListService.java_class)
  userListService.getUserList()
end

def intrasession_users
  @groupListManager.getUserList()
end

def embedObject(obj, view=nil)
  if view
    "<object refid=\"#{ obj.otExternalId() } viewid=\"#{ view.otExternalId() }\" \"/>"
  else
    "<object refid=\"#{ obj.otExternalId() }\"/>"
  end
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

def linkToSubViewObject
  "<a href=\"#{$activityRoot.otExternalId}\" viewid=\"#{$linkedViewEntry.otExternalId}\">link test</a>"
end

def linkToObject(link_text, obj, view=nil)
  if view
    "<a href=\"#{obj.otExternalId}\" viewid=\"#{view.otExternalId}\">#{link_text}</a>"
  else
    "<a href=\"#{obj.otExternalId}\">#{link_text}</a>"    
  end
end









