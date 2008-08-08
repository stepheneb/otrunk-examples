require 'erb'
include_class 'org.concord.framework.otrunk.OTrunk'
include_class='org.concord.biologica.state.OTBreedOffspring'
include_class='org.concord.biologica.state.OTOrganism'
include_class='org.concord.biologica.state.OTWorld'
include_class='org.concord.biologica.state.OTChromosome'
include_class='org.concord.biologica.state.OTStaticOrganism'
include_class='org.concord.biologica.state.OTSex'
include_class='org.concord.otrunk.ui.OTChoiceWithFeedback'

def getText
  if $model
    return "<h1> Here</h1>"
  end
  @otrunk = $viewContext.getViewService(OTrunk.java_class);
  
  erb= ERB.new Java::JavaLang::String.new($template.src).to_s
end

def embedObject(obj)
  "<object refid=\"#{ obj.otExternalId() }\"/>"
end

def embedUserObject(obj, user)
  "<object refid=\"#{ obj.otExternalID() }\" user=\"#{user.getUserId().toExternalForm() }\" />"
end

def otCreate(rconstant, &block)
  otObj = $otObjectService.createObject(rconstant.java_class)
  yield otObj
  otObj
end

def linkToSubViewObject
  "<a href=\"#{obj.otExternalId}\" viewid=\"#{$linkedViewEntry.otExternalId}\">link test</a>"
end

def linkToObject(link_text, obj, view=nil)
  if view
    "<a href=\"#{obj.otExternalId}\">#{link_text}</a>"
  else
    "<a href=\"#{obj.otExternalId}\">#{link_text}</a>"
  end
end
