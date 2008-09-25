require 'erb'
include_class 'org.concord.framework.otrunk.OTrunk'
include_class 'org.concord.otrunk.overlay.OTUserOverlayManager'
include_class 'org.concord.framework.otrunk.view.OTUserListService'

def render(templateBlob)
  erb = ERB.new Java::JavaLang::String.new(templateBlob.src).to_s
  erb.result(binding)   
end 

def getText
  $otrunk = $viewContext.getViewService(OTrunk.java_class);
  $userListService = $viewContext.getViewService(OTUserListService.java_class)
  $overlayManager = $viewContext.getViewService(OTUserOverlayManager.java_class)
  render($template)
end

def embedObjectFromUserOverlay(obj, user)
	obj = $overlayManager.getOTObject(user, obj.getGlobalId())
  if obj
  	begin
  	  "<object refid=\"#{ obj.getGlobalId().toInternalForm() }\" />"
  	rescue NoMethodError
  	  "<object refid=\"#{ obj.otExternalId() }\" />"
  	end
  else
    ""
  end
end

def users
  $userListService.getUserList()
end