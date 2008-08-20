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
