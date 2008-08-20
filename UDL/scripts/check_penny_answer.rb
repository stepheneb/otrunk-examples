require 'java'

puts "ruby script: 'check_penny_answer.rb' evaluated"

module OTrunkRubyScriptTools

  include_class 'javax.swing.JOptionPane'

  # displays message in dialog
  def show_message(message)
    JOptionPane.showMessageDialog(nil, message)
  end
  
  # looks for the last label entered by the learner
  # returns nil if no labels have been enetered
  # or if there are no valid labels
  # 
  # extra code is related to a bug where multiple invalid labels are created
  #
  # pass in the labels object from an OTDataCollector
  #
  # either returns the most recently added valid OTLabel object for the OTDataCollector
  # or nil if there are no Labels or all the Labels are invalid
  def last_valid_label(labels)
    if labels.size == 0
      nil
    else
      label_array = labels.vector.to_a.reverse
      label_array.each {|l| puts "label: #{l.getX}, #{l.getY}"}
      label_array.find { |l| l.getX < 100000 }
    end
  end

end

class LabelRangeResponse
  include OTrunkRubyScriptTools
  
  attr_reader :correct_range, :response_key, :ot_graph, :ot_smart, :ot_correct, :ot_times_incorrect
  
  def initialize(ot_graph, ot_smart, ot_correct, ot_times_incorrect, correct_range, response_key)
    @correct_range = correct_range
    @response_key = response_key
    @ot_graph = ot_graph
    @ot_smart = ot_smart
    @ot_correct = ot_correct
    @ot_times_incorrect = ot_times_incorrect
  end
  
  # Within a class deﬁnition, Ruby will parse 'correct ='
  # as an assignment to a local variable named 'correct'.
  #
  # So within the class definition
  def correct=(value)
    @ot_correct.setValue(value)
  end
  
  def correct
    @ot_correct.getValue
  end

  def times_incorrect=(value)
    @ot_times_incorrect.setValue(value)
  end
  
  def times_incorrect
    @ot_times_incorrect.getValue
  end
  
  def clicked
    unless lastLabel = last_valid_label(ot_graph.getLabels)
      self.correct = false
      update(@response_key[:no_label_entered])
    else
      x = lastLabel.getXData
      if check_condition_with_paramaters(x, correct_range)
        self.correct = true
        update(@response_key[:correct])
      else
        self.correct = false
        self.times_incorrect += 1
        case times_incorrect
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
    update_region_highlighting(key[:hightlight_region])
    show_message(key[:text])
  end
  
  def update_region_highlighting(highlight_state)
    case highlight_state
    when true
      ot_smart.showRegionLabel(@correct_range.first, @correct_range.last)
    when false
      ot_smart.removeAllRegionLabels      
    end
  end
  
  # returns true if value is within range
  # returns false otherwise
  def check_condition_with_paramaters(value, range)
    range.include?(value)
  end
end

def self.init
  # This is currently not called when the script is run from an OTScriptButton object.
  # The init method is only called when a script is run from an OTScriptObject onject.
  puts "self.init called"
end

def self.clicked
  puts "times_incorrect: #{@label_range_response.times_incorrect}, class: #{@label_range_response.times_incorrect.class}"
  puts "times_incorrect + 1: #{@label_range_response.times_incorrect + 1}"
  @label_range_response.clicked
end

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
@label_range_response = LabelRangeResponse.new($graph, $smart, $correct, $times_incorrect, correct_range, response_key)
