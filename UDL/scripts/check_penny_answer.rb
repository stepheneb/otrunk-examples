require 'java'

include_class 'javax.swing.JOptionPane'

def self.init
  puts "self.init called"
end

def self.clicked
  correct_range = 5..16
  response_key = {
    :no_label_entered => { :text => "Use the label tool to add a label to the graph!" },
    :correct => 
      { :text => "That's correct!\nNow you can move on to the next page", 
        :hightlight_region => false },
    :first_wrong_answer => 
      { :text => "Oops, that's not correct.\nWhere is the line going slowly upwards?" },
    :second_wrong_answer => 
      { :text => "Oops, that's not correct.\nThe area where the line is going slowly upwards in now marked.\nTry adding a label in that region.", 
        :hightlight_region => true },
    :multiple_wrong_answers => 
      { :text => "Oops, that's not correct.\nThe area where the line is going slowly upwards in now marked.\nTry adding a label in that region.", 
        :hightlight_region => true }
  }
  @label_range_response = LabelRangeResponse.new(correct_range, response_key)
  @label_range_response.clicked
end

class LabelRangeResponse
  
  attr_reader :correct_range, :response_key
  
  def initialize(correct_range, response_key)
    @correct_range = correct_range
    @response_key = response_key
  end
  
  def clicked
    unless lastLabel = getLastValidLabel($graph.getLabels)
      $correct.setValue(false)
      update(@response_key[:no_label_entered])
    else
      x = lastLabel.getXData
      if checkConditionWithParamaters(x, correct_range)
        $correct.setValue(true)
        update(@response_key[:correct])
      else
        $correct.setValue(false)
        $times_incorrect.setValue($times_incorrect.getValue + 1)
        case $times_incorrect.getValue
        when 1
          update(@response_key[:first_wrong_answer])
        when 2
          update(@response_key[:second_wrong_answer])
        else
          update(@response_key[:multiple_wrong_answers])
        end
      end
    end
  end

  def update(key)
    updateRegionHighlighting(key[:hightlight_region])
    showMessage(key[:text])
  end
  
  def updateRegionHighlighting(highlight_state)
    case highlight_state
    when true
      $smart.showRegionLabel(@correct_range.first, @correct_range.last)
    when false
      $smart.removeAllRegionLabels      
    end
  end
end

# returns true if value is within range
# returns false otherwise
def checkConditionWithParamaters(value, range)
  range.include?(value)
end

# displays message in dialog
def showMessage(message)
  JOptionPane.showMessageDialog(nil, message)
end

# looks for the last label entered by the learner
# returns nil if no labels have been enetered
# or if there are no valid labels
# 
# extra code is related to a bug where multiple invalid labels are created
def getLastValidLabel(labels)
  if labels.size == 0
    nil
  else
    label_array = labels.vector.to_a.reverse
    label_array.each {|l| puts "label: #{l.getX}, #{l.getY}"}
    label_array.find { |l| l.getX < 100000 }
  end
end
