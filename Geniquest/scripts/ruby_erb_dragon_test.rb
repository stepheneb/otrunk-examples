require 'java' 
require 'rbconfig'
require 'erb'
include_class 'org.concord.framework.otrunk.OTrunk'
include_class 'org.concord.biologica.state.OTBreedOffspring'
include_class 'org.concord.biologica.state.OTOrganism'
include_class 'org.concord.biologica.state.OTWorld'
include_class 'org.concord.biologica.state.OTChromosome'
include_class 'org.concord.biologica.state.OTStaticOrganism'
include_class 'org.concord.biologica.state.OTSex'
include_class 'org.concord.otrunk.ui.OTChoiceWithFeedback'
include_class 'org.concord.otrunk.ui.OTText'

import org.concord.biologica
import org.concord.biologica.ui
import org.concord.biologica.engine
import java.lang
import java.beans
include_class 'org.concord.otrunk.view.OTFolderObject'
include_class 'org.concord.biologica.ui.UIProp'
include_class 'org.concord.biologica.engine.EngineProp'

def getText
  if $model
    return "<h1> Here</h1>"
  end
  @otrunk = $viewContext.getViewService(OTrunk.java_class);
  erb= ERB.new Java::JavaLang::String.new($template.src).to_s
  erb.result(binding)
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


def self.init
  puts "Initial view"
  $meiosisViewInternal = $meiosisView.getComponent(0)
  #$textArea.setCurrentCard("meiosisStr")
  #$breedOffspringViewInternal = $breedOffspringView.getComponent(0)
  #$breedOffspringComponent = $breedOffspringView.getComponent(0)
  #$wingsHeredityChoiceInternal = $wings_heredity_choice.getComponent(0)
  #puts "Text generated."
  true
end

def self.save
  true
end

#Listener architecture (non-generic)
class ClickAction 
  include java.beans.PropertyChangeListener
  
  def propertyChange(evt)
    if (evt.getPropertyName == UIProp::SEX_VIEW_MODE)
      case $meiosisViewInternal.getSexViewMode
      when 1: 
        puts "Normal view"
        #$textArea.setCurrentCard("meiosisStr") # Normal view
        #bean.foo = 'Normal view'
      when 2 
        #$textArea.setCurrentCard("motherMagnifiedStr") # Viewing mother chromosomes
        #bean.foo = 'Mother view'
        #$meiosisViewInternal.setSexTextVisible(false)
        puts "Mother view"
      when 3
        puts "Father view"
        #$meiosisViewInternal.setSexTextVisible(true)
        #$textArea.setCurrentCard("fatherMagnifiedStr") # Viewing father chromosomes
        #bean.foo = 'Father view'
      end
    end
   end
end
