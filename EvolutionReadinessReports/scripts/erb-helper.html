class ErbHelper
  
  def initialize(otrunkHelper)
    @otrunkHelper = otrunkHelper
  end

  def render(templateBlob, in_binding)
    erb = ERB.new Java::JavaLang::String.new(templateBlob.src).trim.to_s
    srcProp = templateBlob.otClass().getProperty("src")
    srcValue = templateBlob.otGet(srcProp)  
    erb.filename = srcValue.getBlobURL().toExternalForm()
    erb.result(in_binding)
  end 
  
  def embedObject(obj, viewEntry=nil)
    return if obj == nil
    tag = "<object refid=\"#{ @otrunkHelper.objectIdStr(obj) }\" "
    tag += "viewid=\"#{ @otrunkHelper.objectIdStr(viewEntry) }\" "  if viewEntry
    tag += "/>"
  end
  
  def embedObjectFromUserOverlay(user, obj, viewEntry=nil)
    obj = @otrunkHelper.overlayManager.getOTObject(user, obj.getGlobalId())
    if obj
      embedObject(obj, viewEntry)
    else
      ""
    end
  end
  
  def linkToObject(link_text, obj, viewEntry=nil, frame=nil)
    link = "<a href=\"#{ @otrunkHelper.objectIdStr(obj) }\" "
    link += "viewid=\"#{ @otrunkHelper.objectIdStr(viewEntry) }\" "  if viewEntry
    link += "target=\"#{ @otrunkHelper.objectIdStr(frame) }\" " if frame
    link += ">#{link_text}</a>"
  end
  def popupFrame
    return @frame if @frame 
    
    @frame = @otrunkHelper.otCreate(org.concord.framework.otrunk.view.OTFrame) { |frame|
       frame.width = 500
       frame.height = 600
     }
  end
  
  def popupLinkToObject(link_text, obj, viewEntry=nil)
    frame = popupFrame()
    linkToObject(link_text, obj, viewEntry, frame)
  end
  
  def linkToObjectAction(link_text, obj, action)
    viewEntryCopy = $otObjectService.copyObject($viewEntry, 1)
    viewEntryCopy.variables.add(otCreate(OTScriptVariable){|scriptVar|
      scriptVar.name="action"
      scriptVar.reference = otCreate(OTString){|str|
        str.string=action
      }
    })
    linkToObject(link_text, obj, viewEntryCopy)
  end
  
end