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
#include_class 'org.concord.otrunk.biologica.OTFamily'
include_class 'org.concord.otrunk.ui.OTChoiceWithFeedback'
include_class 'org.concord.otrunk.ui.OTText'

import org.concord.otrunk.biologica
import org.concord.otrunk.biologica.ui
import org.concord.otrunk.biologica.engine
import java.lang
import java.util.vector
import java.util.Enumeration
import java.beans
include_class 'org.concord.otrunk.view.OTFolderObject'
include_class 'org.concord.biologica.ui.UIProp'
include_class 'org.concord.biologica.engine.EngineProp'

def self.init
  puts "self.init called"
end

def self.clicked
  @button_response = ButtonResponse.new
  @button_response.clicked
end
  
class ButtonResponse
  $multiOrgVertical = $multiOrgView2.getComponent(0).getComponent(0)
  $multiOrgVertical.setOrganismLayoutStyle(4)
  $multiOrgVertical.setSpeciesTextVisible(false)
  $multiOrgVertical.setSexTextVisible(false)
  $multiOrgVertical.setCharacteristicsTextVisible(false)
  $multiOrgVertical.setNameTextVisible(false)
  $multiOrgVertical.setLockSymbolVisible(false)
  $multiOrgVertical.updateScrollBars
  
  def flip_up(array, element1_index, element2_index)
    #Flip order of organisms selected
    x = element1_index
    y = element2_index
    array.pop(y)
    array.insert(y,x-1)
    return array
  end
    
  if $multiOrgViewInternal.getSelectionSet.getNumberOfSelectedObjects.inspect == 0
    puts "No organisms selected."
  else
    puts $multiOrgViewInternal.getSelectionSet.getNumberOfSelectedObjects.inspect + " objects selected."
    #$multiOrgVertical.setSelectionSet(selectedOrgs)
  end

  #$strainFamilyInternal = $strainFamily


  def clicked
    puts "Saving Family"
    #iterate_organisms
    
    puts
    puts $multiOrgVertical.inspect
    orgVector = $multiOrgViewInternal.getOrganisms
    #puts orgVector.size
    puts orgVector
    puts orgVector.inspect
    orgVector.each {|o| puts "Generated organism: " + o.getSexAsString;     $multiOrgVertical.addOrganism(o)}
    puts "After iteration:"
    #puts orgVector.size
    puts orgVector
    puts orgVector.inspect
    orgVector.each {|i| puts i.getSexAsString}


    #orgVector = $multiOrgViewInternal.getOrganisms
    orgVector.each {|o| puts "here"; puts o.inspect; $multiOrgVertical.addOrganism(o)}
    selectedOrgs = $multiOrgViewInternal.getSelectionSet

    # Add organisms to vertical view    

    #$multiOrgVertical.repaint
    
    puts selectedOrgs.getNumberOfSelectedObjects
    secondOrg = selectedOrgs.getSelectedObjectAtIndex(1)
    if selectedOrgs.getNumberOfSelectedObjects > 1
      puts "The second selected organism is a " + secondOrg.getSexAsString + "."
    end

    #while (iterator.hasMoreElements)
    #  organism = iterator.nextElement
    #  organismSex = organism.getSexAsString
    #  puts "First Organism Gender: " + organismSex
    #end
    #puts $strainFamilyInternal.getMother
    #puts $strainFamilyInternal.getFather
  end
end
