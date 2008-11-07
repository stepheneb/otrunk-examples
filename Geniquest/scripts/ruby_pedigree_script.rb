require 'java' 
require 'rbconfig'
require 'erb'

include_class 'javax.swing.JOptionPane'

include_class 'org.concord.framework.otrunk.OTrunk'
include_class 'org.concord.otrunk.biologica.OTBreedOffspring'
include_class 'org.concord.otrunk.biologica.OTOrganism'
include_class 'org.concord.otrunk.biologica.OTWorld'
include_class 'org.concord.otrunk.biologica.OTChromosome'
include_class 'org.concord.otrunk.biologica.OTStaticOrganism'
include_class 'org.concord.otrunk.biologica.OTPedigree'
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

class PedigreeAction
 include java.beans.PropertyChangeListener

 def propertyChange(evt)
   if (evt.getPropertyName == UIProp::CROSS_SUCCEEDED)
     puts "Nice cross!"
     #case $meiosisViewInternal.getSexViewMode
     #when 1 : $meiosisViewInternal.setSexTextVisible(false) # Normal view
     #when 2 : $meiosisViewInternal.setSexTextVisible(false) # Viewing mother chromosomes
     #when 3 : $meiosisViewInternal.setSexTextVisible(false) # Viewing father chromosomes
     #end
   end
 end
end

# displays message in dialog
def showMessage(message)
  JOptionPane.showMessageDialog(nil, message)
end

def self.init
  puts "self.init called"
  $pedigreeViewInternal = $pedigreeView.getComponent(0)
  $pedigreeViewInternal.addPropertyChangeListener PedigreeAction.new
  true
end

def self.save
  true
end