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
  $pedigreeOrganismViewInternal = $pedigreeViewInternal.getPedigreeOrganismView
  $pedigreeViewInternal.inspect
  $pedigreeOrganisms = $pedigreeViewInternal.getOrganisms
  $pedigreeFamilies = $pedigreeViewInternal.getFamilies
  puts $pedigreeOrganisms.inspect
  
  $pedigreeFamilyInit = $pedigreeFamilies.dup
  #$pedigreeOrganismsInita= $pedigreeOrganismsInit[0]
  #$pedigreeOrganismsInitb= $pedigreeOrganismsInit[1]
  #$family = $pedigreeViewInternal.getFamilyForParents($mother, $father)
  #puts $family.inspect
  #$pedigreeViewInternal.removeFamily($family)
  $pedigreeViewInternal.setCrossOverTurnOn(true)
  puts $pedigreeViewInternal.inspect
  puts $pedigreeOrganismViewInternal.inspect
  $pedigreeFamilies.each {|f| puts "Family: "; puts f.inspect; puts;}
  puts $pedigreeViewInternal.getNumberOfOrganisms
  puts $pedigreeViewInternal.isCrossOverTurnOn().to_s

def self.clicked
  #$pedigreeFamilies.each {|f| f.removeChildren($pedigreeOrganismViewInternal) }
  $pedigreeViewInternal.removeAllOrganisms
  $pedigreeViewInternal.addOrganism($startingMale,50,0)
  $pedigreeViewInternal.addOrganism($startingFemale,100,0)
  ##$pedigreeFamilyInit.each {|f| $pedigreeViewInternal.addFamily(f.getFamily,40,0)}
end
def self.init
  puts "self.init called!"
  true
end

def self.save
  true
end