require 'erb'
include_class 'org.concord.framework.otrunk.OTrunk'
include_class 'org.concord.otrunk.overlay.OverlayImpl'
include_class 'org.concord.otrunk.overlay.CompositeDatabase'
include_class 'org.concord.otrunk.xml.ExporterJDOM'

include_class 'java.awt.EventQueue'
include_class 'java.awt.event.ActionListener'
include_class 'java.lang.Runnable'
include_class 'java.net.URL'
include_class 'java.io.BufferedReader'
include_class 'java.io.InputStreamReader'

# class MyActionListener
#   include java.awt.event.ActionListener
#   
#   def actionPerformed(event)
#     $overlays.each do |overlay|
#         objService = $map[overlay.getGlobalId]
#     	db = objService.getCreationDb
#     	url = URL.new("http://rails.dev.concord.org/webdav/" + overlay.getGlobalId + ".otml")
# 			
# 		$otrunk.remoteSaveData(db, url, "PUT")
#     end
#   end
# end
# $buttonListener = MyActionListener.new

# class MyRunnable
#   include java.lang.Runnable
#   
#   def run
#     $stderr.puts "#{$viewContext}: #{$viewContext.methods.inspect}"
#     buttonView = $viewContext.getViewByObject($otButton)
#     buttonCompnent = buttonView.getComponent($otButton)
#     buttonComponent.addActionListener $buttonListener unless buttonComponent == nil
#   end
# end

def render(templateBlob)
  erb = ERB.new Java::JavaLang::String.new(templateBlob.src).to_s
  erb.result(binding)   
end 

def getText
  $otrunk = $viewContext.getViewService(OTrunk.java_class);
  $overlays = $otrunk.system.overlays.vector
  
  # $stderr.puts $overlays
  
  $map = {}
  $map[nil] = $otrunk.getRootObjectService
  
  # strOverlays = ""
  # strDbs = ""
  # strObjs = ""
  # strObjServices = ""
  
  $overlays.each do |overlay|
  	myoverlay = OverlayImpl.new overlay
  	db = CompositeDatabase.new $otrunk.getDataObjectFinder, myoverlay
  	# strOverlays << "overlay: #{myoverlay.inspect}\n"
  	# db = myoverlay.getOverlayDatabase();
  	# strDbs << "db: #{db.inspect}\n"
  	objService = $otrunk.createObjectService(db);
  	# strObjServices << "objService: #{objService.inspect}\n"

  	$map[overlay.getGlobalId()] = objService;
  	
  	# otobj = getObjectFromOverlay($object, overlay)
  	# strObjs << "obj: #{otobj.inspect}\n"
  	# otobj.setText(otobj.getText() + " " + overlay.getName)
  end
  
  # $stderr.puts strOverlays
  # $stderr.puts strDbs
  # $stderr.puts strObjServices
  # $stderr.puts strObjs
  
  
  # $stderr.puts "map: #{$map.inspect}"
  
  # add the listener to the button later, hopefully after the button component exists
#   EventQueue.invokeLater(MyRunnable.new)
  
  render($template)
end

def getObjectFromOverlay(obj, overlay = nil)
	if overlay == nil
		$map[nil].getOTObject(obj.getGlobalId())
	else
		$map[overlay.getGlobalId()].getOTObject(obj.getGlobalId())
	end
end

def embedObjectFromOverlay(obj, overlay)
	obj = getObjectFromOverlay(obj, overlay)
	begin
	  "<object refid=\"#{ obj.getGlobalId().toInternalForm() }\" />"
	rescue NoMethodError
	  "<object refid=\"#{ obj.otExternalId() }\" />"
	end
end