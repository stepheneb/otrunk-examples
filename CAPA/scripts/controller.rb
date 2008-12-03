require 'jruby'
require 'erb'

class Controller
    
  def initialize(templateBinding)
    @templateBinding = templateBinding
  end
  
  def defaultTemplate
    return render($template)
  end
  
  def render(templateBlob)
    erb = ERB.new Java::JavaLang::String.new(templateBlob.src).to_s
    return erb.result(@templateBinding)   
  end 
  
  def embedObject(obj)
    return "<object refid=\"#{obj.otExternalId()}\"/>"
  end
  
  def embedUserObject(obj, user)
    return "<object refid=\"#{obj.otExternalId()}\" user=\"#{user.getUserId().toExternalForm()}\"/>"
  end
  
  def linkToObject(link_text, obj, viewEntry=nil)
    link = "<a href=\"#{obj.otExternalId()}\" "
    link += "viewid=\"#{viewEntry.otExternalId()}\" "  if viewEntry
    link += ">#{link_text}</a>"
    return link
  end
  
  def linkToObjectAction(link_text, obj, action)
    viewEntryCopy = $otObjectService.copyObject($viewEntry, 1)
    viewEntryCopy.variables.add(otCreate(OTScriptVariable){|scriptVar|
      scriptVar.name="action"
      scriptVar.reference = otCreate(OTString){|str|
        str.string=action
      }
    })
   return  "<a href=\"#{obj.otExternalId()}\" viewid=\"#{viewEntryCopy.otExternalId()}\">#{link_text}</a>"
  end
  
  def popupLinkToObject(link_text, obj, viewEntry=nil)
    link = "<a href=\"#{ obj.otExternalId() }\" "
    link += "viewid=\"#{ viewEntry.otExternalId() }\" "  if viewEntry
    link += " target=\"#{ popupFrame.otExternalId }\">#{link_text}</a>"
    return link  
  end
  
  def linkToUnitPage(link_text)
    firstObject = rootObject.reportTemplate
    firstView = rootObject.reportTemplateViewEntry
    return linkToObject(link_text, firstObject, firstView)
  end
  
  def popupFrame
    unless @frame
      @frame = otCreate(org.concord.framework.otrunk.view.OTFrame) { |frame| }
    end
    return @frame
  end

end
