require 'erb'
include_class 'org.concord.framework.otrunk.view.OTUserListService'
include_class 'org.concord.framework.otrunk.OTrunk'
include_class 'org.concord.datagraph.state.OTDataGraph'
include_class 'org.concord.datagraph.state.OTDataGraphable'

def getText
  @otrunk = $viewContext.getViewService(OTrunk.java_class);
    
  erb = ERB.new Java::JavaLang::String.new($template.src).to_s
  erb.result(binding)   
end

def users
  userListService = $viewContext.getViewService(OTUserListService.java_class)
  userListService.getUserList()
end

def embedObject(obj)
  "<object refid=\"#{ obj.otExternalId() }\"/>"
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
  ["FF0000", "00FF00", "0000FF", "FFFF00", "FF00FF", "00FFFF"]
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