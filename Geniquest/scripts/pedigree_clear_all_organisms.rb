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

  $pedigreeViewInternal = $pedigreeView.getComponent(0)
  $pedigreeViewInternal.inspect
  $pedigreeOrganisms = $pedigreeViewInternal.getOrganisms
  puts $pedigreeOrganisms.inspect
  #$family = $pedigreeViewInternal.getFamilyForParents($mother, $father)
  #puts $family.inspect
  #$pedigreeViewInternal.removeFamily($family)
  #$pedigreeOrganisms.each {|o| $pedigreeViewInternal.removeOrganism(o.getOrganism)}
  $pedigreeViewInternal.setCrossOverTurnOn(true)
  puts $pedigreeViewInternal.inspect
  puts $pedigreeViewInternal.getNumberOfOrganisms
  puts $pedigreeViewInternal.isCrossOverTurnOn().to_s


def self.init
  puts "self.init called!"
  true
end

def self.save
  true
end