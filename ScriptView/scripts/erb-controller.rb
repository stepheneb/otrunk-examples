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

def embedObject(obj)
  "<object refid=\"#{ obj.otExternalId() }\"/>"
end

def otCreate(rconstant, &block)
  otObj = $otObjectService.createObject(rconstant.java_class)
  yield otObj
  otObj
end

def linkToObject(link_text, obj)
  "<a href=\"#{ obj.otExternalId() }\">#{link_text}</a>"
end