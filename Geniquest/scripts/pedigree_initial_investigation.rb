include_class 'org.concord.otrunk.biologica.OTStaticOrganism'
include_class 'org.concord.otrunk.biologica.OTPedigree'
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

class PedigreeAction
 include java.beans.PropertyChangeListener

 def propertyChange(evt)
   if (evt.getPropertyName == UIProp::CROSS_SUCCEEDED)
     puts "change"
     height = $pedigreeViewInternal.getHeight
     puts height
     $textField.text = "Great. Now add another generation."
   end
 end
end

# displays message in dialog
def showMessage(message)
  JOptionPane.showMessageDialog(nil, message)
end

def self.init
  puts "self.init called!"
  $pedigreeViewInternal = $pedigreeView
  $pedigreeViewInternal.addPropertyChangeListener PedigreeAction.new
  true
end

def self.save
  true
end