include_class 'org.concord.otrunk.biologica.OTStaticOrganism'
include_class 'org.concord.otrunk.biologica.OTMultipleOrganism'
include_class 'org.concord.otrunk.ui.OTText'

import org.concord.otrunk.biologica
import org.concord.otrunk.biologica.ui
import org.concord.otrunk.biologica.engine
import java.lang
import java.beans
include_class 'org.concord.otrunk.view.OTFolderObject'
include_class 'org.concord.biologica.ui.UIProp'
include_class 'org.concord.biologica.engine.EngineProp'

def orgsShown
  $multiOrgViewInternal.getOrganisms()
end

class BreedActionChild
 include java.beans.PropertyChangeListener

 def propertyChange(evt)
   if (evt.getPropertyName == UIProp::ORGANISM)
     puts "Child organism change"
     #if newchild?
    #   oldchild = newchild
       
     newchild = $breedOffspringViewChild.getOrganism
     gender = newchild.getSexAsString
     puts gender
     #Create new copy of organism here, so we can remove label for multi-org view? Better: 
     #TODO separate control of labels in multi-org view…
     #orgsShown.each{|o| o.setNameTextVisible(false)}
     $multiOrgViewInternal.addOrganism(newchild)
   end
 end
end

# displays message in dialog
def showMessage(message)
  JOptionPane.showMessageDialog(nil, message)
end



def self.init
  puts "self.init called!"
  $breedOffspringViewInternal = $breedOffspringView
  $breedOffspringViewChild = $breedOffspringViewInternal.getComponent(4)
  $multiOrgViewInternal = $multiOrgView.getComponent(0).getComponent(0)
  $multiOrgViewInternal.removeAllOrganisms
  $multiOrgViewInternal.setNameTextVisible(false)
  $multiOrgViewInternal.setSexTextVisible(false)
  $multiOrgViewInternal.setCharacteristicsTextVisible(false)
  $multiOrgViewInternal.setSpeciesTextVisible(false)  
  $breedOffspringViewChild.addPropertyChangeListener BreedActionChild.new
  true
end

#def self.init
#  puts "Initializing multi-org/breeding script"
#  $breedView = $breedOffspringViewForStrains
#  $multiOrgView = $multiOrgView.get
#end

#$breedView.actionPerformed
  

def self.save
  true
end