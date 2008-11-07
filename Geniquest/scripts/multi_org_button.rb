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

def self.init
  puts "self.init called2"

  #$meiosisViewInternalContext=context.$meiosisViewComp.getComponent(0)
  #$context=context.getComponentForObject($meiosisViewComp).getComponent(0);
end

def self.clicked
 response_key = {
   :width_retrieved => { :text => "The width was retrieved." },
   :variable_not_set => { :text => "This variable isn't set. Odd, that."},
   :text_visible => { :text => "The text was visible. I'll make it go away." },
   :text_invisible => { :text => "The text was invisible. I'll make it appear."}
 }
 @label_range_response = LabelRangeResponse.new(response_key)
 @label_range_response.clicked
end

class LabelRangeResponse
  $pedigreeViewInternal=$pedigreeView.getComponent(0)
  $multiOrgViewInternal=$multiOrganismView.getComponent(0).getComponent(0)
  attr_reader :response_key
  
  def initialize(response_key)
    @response_key = response_key
  end
  
  def clicked
    puts $pedigreeViewInternal.isOrganismImagesVisible
    $pedigreeViewInternal.setOrganismImagesVisible(true)
    $pedigreeViewInternal.setOrganismImageSize(2)
    $pedigreeViewInternal.repaint
    puts $pedigreeViewInternal.getNumberOfOrganisms
    pedOrgs=$pedigreeViewInternal.getOrganisms
    selectedOrgs = $pedigreeViewInternal.getSelectionSet
    $multiOrgViewInternal.removeAllOrganisms
    #puts "Organism images visible: " + $multiOrgViewInternal.isOrganismImagesVisible
    puts "Organism size: " + $multiOrgViewInternal.getOrganismImageSize.to_s
    $multiOrgViewInternal.setOrganismImageSize(2)
    $multiOrgViewInternal.setSpeciesTextVisible(false)
    $multiOrgViewInternal.setSexTextVisible(false)
    $multiOrgViewInternal.setCharacteristicsTextVisible(false)
    $multiOrgViewInternal.setNameTextVisible(false)
    $multiOrgViewInternal.setLockSymbolVisible(false)
    pedOrgs.each {|p| $multiOrgViewInternal.addOrganism(p.getOrganism)}
    $multiOrgViewInternal.updateScrollBars
    $multiOrgViewInternal.setSelectionSet(selectedOrgs)
    

    #oldwidth=$meiosisViewVar.getWidth
    #puts oldwidth
    #$meiosisViewVar.setWidth(oldwidth + 5)
    #momMarkers=$oldMotherObj.getMarkerString
    #momAlleles = $oldMother.getAlleles
    #puts momMarkers
    #puts momAlleles
    #$oldMotherObj.setVisible(false)
    #sexViewMode=$meiosisViewInternal.getSexViewMode
    #puts sexViewMode
    #newnum=sexViewMode.to_i
    #newnum == 5? newnum = 1 : newnum = newnum + 1
    #$meiosisViewInternal.setSexViewMode(newnum)
  end

end

# displays message in dialog
def showMessage(message)
  JOptionPane.showMessageDialog(nil, message)
end