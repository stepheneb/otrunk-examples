require 'java' 
require 'rbconfig'
require 'erb'
include_class 'org.concord.framework.otrunk.OTrunk'
<<<<<<< HEAD:Geniquest/scripts/ruby_erb_dragon_test.rb
include_class 'org.concord.otrunk.biologica.OTBreedOffspring'
include_class 'org.concord.otrunk.biologica.OTOrganism'
include_class 'org.concord.otrunk.biologica.OTWorld'
include_class 'org.concord.otrunk.biologica.OTChromosome'
include_class 'org.concord.otrunk.biologica.OTStaticOrganism'
include_class 'org.concord.otrunk.biologica.OTSex'
=======
include_class 'org.concord.otrunk.biologica.OTBreedOffspring'
include_class 'org.concord.otrunk.biologica.OTOrganism'
include_class 'org.concord.otrunk.biologica.OTWorld'
include_class 'org.concord.otrunk.biologica.OTChromosome'
include_class 'org.concord.otrunk.biologica.OTStaticOrganism'
include_class 'org.concord.otrunk.biologica.OTSex'
>>>>>>> 2ef16db80574f4a3c07a7e9a592a7f44f9f3b831:Geniquest/scripts/ruby_erb_dragon_test.rb
include_class 'org.concord.otrunk.ui.OTChoiceWithFeedback'
include_class 'org.concord.otrunk.ui.OTText'

import org.concord.otrunk.biologica
import org.concord.otrunk.biologica.ui
import org.concord.otrunk.biologica.engine
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
  $pedigreeViewInternal = $pedigreeView.getComponent(0)
  #$meiosisViewInternal = $meiosisView.getComponent(0)
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
    if (evt.getPropertyName == UIProp::CROSS_SUCCEEDED)
      puts "change"
      height = $pedigreeViewInternal.getHeight
      puts height
    end
   end
end
