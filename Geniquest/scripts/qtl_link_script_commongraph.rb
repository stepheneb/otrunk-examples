include_class 'org.concord.otrunk.biologica.OTStaticOrganism'
include_class 'org.concord.otrunk.biologica.OTPedigree'
include_class 'org.concord.otrunk.biologica.OTSex'
include_class 'org.concord.otrunk.ui.OTChoiceWithFeedback'
include_class 'org.concord.otrunk.ui.OTText'

import org.concord.otrunk.biologica
import org.concord.otrunk.biologica.ui
import org.concord.otrunk.biologica.engine
import org.concord.biologica.qtl
import java.lang
import java.beans
include_class 'org.concord.otrunk.view.OTFolderObject'
include_class 'org.concord.biologica.ui.UIProp'
include_class 'org.concord.biologica.engine.EngineProp'
#include OTrunkRubyScriptTools

def self.clicked
  puts "Inspecting graphs"
  $remaining_budget = 500000
  puts "Initial budget: " + $remaining_budget.to_s
  puts "$QTL_graph.inspect!!: " + $QTLGraph.inspect
  $QTLGraphables = $QTLGraph.getGraphables.getVector
  puts "Graphables: " + $QTLGraphables.inspect
  $QTLGraphables.each {|g| g.setColor(0x00FFFFFF)}
  puts "$drakesCheckBoxes.inspect: " + $drakesCheckBoxes.inspect
  $selectedDrakes = $drakesCheckBoxes.getCurrentChoices.getVector
  puts "$drakesCheckBoxes.getCurrentChoices: "
  puts $selectedDrakes.inspect
  puts $selectedDrakes.size
  $selectedDrakes.each {|d| puts d.name}
  $textField.text = "Budget Remaining: $" + $remaining_budget.to_s
  
  if($selectedDrakes.size !== 2 )
    $textField.text = "Please select only two strains of Drakes for this run."
  end
  
  if($selectedDrakes.size == 2 && $remaining_budget != 0)
    if $selectedDrakes.include?("Mountain") {$QTLGraphables[0].setColor(0x00FF0000)}
    elsif $selectedDrakes.include?("Valley") {$QTLGraphables[1].setColor(0x00FF0000)}
    elsif $selectedDrakes.include?("Swamp") {$QTLGraphables[2].setColor(0x00FF0000)}
    else $QTLGraphables[3].setColor(0x0000FF00)
    end
    $remaining_budget = $remaining_budget - 100000
  else $textField.text = "You have no money remaining!"
  end
  $textField.text = "Budget Remaining: $" + $remaining_budget.to_s
  #puts $QTLGraphLabels = $QTLGraph.getLabels.getVector.inspect
  #puts "99pct Labels: "
  #$QTLGraphLabels.each {|l| puts l; l.setHorizontalVisible(true)}
  #puts "Setting horizontal visible to false again: "
  #$QTLGraphLabels[0].setHorizontalVisible(false)  
  #$QTLGraphThresh99 = $QTLGraphLabels[0]
  #$QTLGraphThresh90 = $QTLGraphLabels[1]
  #$QTLGraphThresh65 = $QTLGraphLabels[2]
  #$QTLHighlightLabel = $QTLGraphLabels[3]
  #puts "Turning on thresholds." 
  #
  #def show_threshold
  #  self.setHorizontalVisible(true)
  #  self.setLabelVisible(true)
  #end
  #$QTLGraphThresh99.show_threshold
  #$QTLGraphThresh90.show_threshold
  #$QTLGraphThresh65.show_threshold
  ##$textField.text="Now the 99%, 90% and 65% probability thresholds are displayed on the graph. Click the arrow at the bottom to move to the next page."
  
  #puts "Y 99pct threshold: " + $QTLGraphThresh99.yData.to_s

  #puts "99pct confidence interval from " + ($QTLHighlightLabel.x1 * 10000).to_i.to_s  + " to " + ($QTLHighlightLabel.x2 * 10000).to_i.to_s
  
  
  #puts "$QTL_graph_99pct_view.getComponent($QTL_graph_99pct).inspect: " + $QTL_graph_99pct_view.getComponent($QTL_graph_99pct).inspect
  #$QTL_graph_obj_99pct = $QTL_graph_99pct_view.getComponent($QTL_graph_99pct)
  #puts "X scale: " + $QTL_graph_obj_99pct.getXScale.to_s
  #puts "Turning off toolbar."
  #$QTLGraphables = $QTL_graph_obj_99pct.getObjList.getSelectedObjects
  #puts "Object List: "+ $QTLGraphables.inspect
  #puts "Vector: " + $QTLGraphables.size.to_s
  #
  #
  ##$QTLGraph.remove($QTLConfidenceLabels[4])
  #$QTLGraphableVector = $QTLGraphables.getVector
  #puts "99pct Graphables: "
  #puts
  #$QTLGraphableVector.each {|o| puts o.inspect}
  #puts "99pct Graphables DataStores: "
  #puts
  #$QTLGraphableVector.each {|o| puts o.getDataStore}
  #$QTLDataStoreZero = $QTLGraphableVector[0].getDataStore.getValues
  #puts $QTLDataStoreZero.size

  #num = 0
  #while num < $QTLDataStoreZero.size
  #  puts $QTLDataStoreZero.get(num)
  #  num += 1
  #end
  
  
  #$QTLGraphables.each {|g| puts "object: " + g.inspect;} 
  #$thresholdValues=$QTLSimulation.getThresholdValues(90.to_d)
  #$confidenceIntervals=$QTLSimulation.getComponent.getConfidenceInterval(1.to_s)
  #$scores=$QTLSimulation.getComponent.getScores
  
  #puts "Scores: " + $scores
  #puts
  #puts "Threshold Values: " + $thresholdValues
  #puts
  #puts "Confidence Intervals: " + $confidenceIntervals
  ##def round_to(x)
  ##  (self * 10**x).round.to_f / 10**x
  ##end
  ##def to_kbp
  ##  self * 10000
  ##end
  #$textField.text = "Threshold 99%: " + $thresholdAdjusted[0].round_to(2).to_s + "\nThreshold 90%: " + $thresholdAdjusted[1].round_to(2).to_s + "\nThreshold 85%: " + $thresholdAdjusted[2].round_to(2).to_s
end
def self.init
  puts "self.init called!"
end