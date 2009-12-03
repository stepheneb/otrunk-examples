include_class 'org.concord.otrunk.biologica.OTStaticOrganism'
include_class 'org.concord.otrunk.biologica.OTSex'
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

class MeiosisAction
 include java.beans.PropertyChangeListener

 def propertyChange(evt)
   if (evt.getPropertyName == UIProp::SEX_VIEW_MODE)
     puts "change"
     case $meiosisViewInternal.getSexViewMode
     when 1 : $meiosisViewInternal.setSexTextVisible(false) # Normal view
     when 2 : $meiosisViewInternal.setSexTextVisible(false) # Viewing mother chromosomes
     when 3 : $meiosisViewInternal.setSexTextVisible(false) # Viewing father chromosomes
     end
   elsif (evt.getPropertyName == UIProp::MEIOSIS_MOTHER_STEP)
     puts UIProp::MEIOSIS_MOTHER_STEP.to_s
       #puts "Mother meiosis step: 10"
     #elsif UIProp::MEIOSIS_MOTHER_STEP == 20
    #   $meiosisView.reset
     #end 
     puts "Great. Now try running meiosis for the father."
     $textObject.text = "Great. Now try running meiosis for the father."
   end
 end
end

# displays message in dialog
def showMessage(message)
  JOptionPane.showMessageDialog(nil, message)
end

def self.init
  puts "self.init called"
  $meiosisViewInternal = $meiosisView.getComponent(0)
  $meiosisViewInternal.addPropertyChangeListener MeiosisAction.new
  true
end

def self.save
  true
end