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
import java.util.Vector
#import java.util.Enumeration
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
   $pedigreeViewInternal=$pedigreeView.getComponent(0)
   $multiOrgViewInt = $multiOrgView.getComponent(0).getComponent(0)
   #$multiOrgViewInt.setOrganismLayoutStyle(4)

  # #
  #if $multiOrgViewInternal.getSelectionSet.getNumberOfSelectedObjects.inspect == 0
  #  puts "No organisms selected."
  #else
  #  puts $pedigreeViewInternal.getSelectionSet.getNumberOfSelectedObjects.inspect + " organisms selected."
  #end


  def clicked
    puts "Saving Family"

    ##Testing multiorgvector
    multiOrgVector = $multiOrgViewInt.getOrganisms
    puts "multiOrgVector " + multiOrgVector.inspect
    
    ##Clear and initialize the multiOrg view
    #$multiOrgViewInt.removeAllOrganisms
    puts $multiOrgViewInt.inspect
    $multiOrgViewInt.setSpeciesTextVisible(false)
    $multiOrgViewInt.setSexTextVisible(false)
    $multiOrgViewInt.setCharacteristicsTextVisible(false)
    $multiOrgViewInt.setNameTextVisible(false)
    $multiOrgViewInt.setLockSymbolVisible(false)
    $multiOrgViewInt.updateScrollBars

    ##Get the selected organisms from Pedigree view
    selectionVector = $pedigreeViewInternal.getSelectionSet
    puts "selectionVector: " + selectionVector.inspect
    
    selectionVectorObj = $pedigreeViewInternal.getSelectionSet.getSelectedObjects
    puts "selectionVectorObj: " + selectionVectorObj.inspect
    
    numOrgs=selectionVector.getNumberOfSelectedObjects
    puts numOrgs.to_s + " organisms selected."
    
    ##Get actual organisms
    selectionVectorObj.each{|o| puts o.name; puts; $multiOrgViewInt.addOrganism(o)}
    #puts "Organism: "+ orgOne.getSexAsString + "named " + orgOne.getName + "."

    ##orgVector = $multiOrgViewInternal.getOrganisms
    #orgVector.each {|o| puts "here"; puts o.inspect; $multiOrgView.addOrganism(o)}
    #selectedOrgs = $multiOrgViewInternal.getSelectionSet

    # Add organisms to vertical view    

    #$multiOrgView.repaint
    
    #puts selectedOrgs.getNumberOfSelectedObjects
    ##puts "Ruby length: " + selectedOrgs.length
    #secondOrg = selectedOrgs.getSelectedObjectAtIndex(1)
    #if selectedOrgs.getNumberOfSelectedObjects > 1
    #  puts "The second selected organism is a " + secondOrg.getSexAsString + "."
    #end

    #while (iterator.hasMoreElements)
    #  organism = iterator.nextElement
    #  organismSex = organism.getSexAsString
    #  puts "First Organism Gender: " + organismSex
    #end
    #puts $strainFamilyInternal.getMother
    #puts $strainFamilyInternal.getFather
  end
end
