class LabelRangeResponse
  include OTrunkRubyScriptTools
  
  attr_reader :response_key, :ot_graph, :ot_smart, :ot_correct, :ot_times_incorrect, :ot_question
  
  def initialize(response_key, ot_graph, ot_smart, ot_correct, ot_times_incorrect, ot_question=nil)
    @response_key = response_key
    @correct_range = @response_key[:correct_range]
    @highlight_range = @response_key[:highlight_range] || @correct_range
    @ot_graph = ot_graph
    @ot_smart = ot_smart
    @ot_correct = ot_correct
    @ot_times_incorrect = ot_times_incorrect
    @ot_question = ot_question
    @prompt = @response_key[:prompt]
    if DEBUG
      @prompt = "<small><i>(Response Type: #{@response_key[:response_type]}, axis: #{@response_key[:correct_range][:axis]})</i></small><br />" + @prompt
    end
    if @prompt && @ot_question
      @ot_question.getPrompt.setBodyText(@prompt)
    end
    # @ot_smart.removeAllRegionLabels
  end
  
  # Within a class deﬁnition, Ruby will parse the method 'correct='
  # as an assignment to a local variable named 'correct'.
  #
  # So within the class definition I need to use this form
  # to access the method:
  #
  #   self.correct = 
  #
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
  
  def question_number_answer
    if @ot_question && response = @ot_question.getInput.getText
      begin
        answer = Float(response)
      rescue ArgumentError
        false
      end
    else
      false
    end
  end
  
  def clicked
    response = get_response
    unless response
      self.correct = false
      update(@response_key[:no_answer_entered])
    else
      if response[:correct]
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

  def get_response
    case @response_key[:response_type]
    when :label
      if lastLabel = last_valid_label(@ot_graph.getLabels)
        response = { :x => lastLabel.getXData, :y => lastLabel.getYData }
        response.merge!( { :correct => check_condition_with_parameters(response[@correct_range[:axis]], @correct_range[:range]) })
      else
        false
      end
    when :number
      if answer = question_number_answer
        case @correct_range[:axis]
        when :x
           response = { :x => answer, :y => nil }
        when :y
          response = { :x => nil, :y => answer }
        end
        response.merge!( { :correct => check_condition_with_parameters(response[@correct_range[:axis]], @correct_range[:range]) })
      else
        false
      end
    end
  end

  def update(key)
    update_region_highlighting(key[:highlight_region])
    show_message(key[:text])
  end
  
  def update_region_highlighting(highlight_state)
    case highlight_state
    when true
      case @highlight_range[:axis]
      when :x
        @ot_smart.showRegionLabel(@highlight_range[:range].first, @highlight_range[:range].last)
      when :y
        data = get_graph_data(@ot_graph)
        regions = find_y_regions(data, @highlight_range[:range])
        regions.each { |region| @ot_smart.showRegionLabel(region.first, region.last) }
      end
    when false
      @ot_smart.removeAllRegionLabels      
    end
  end
  
  def find_y_regions(data, yrange)
    regions = []
    point = data[0]
    if yrange.include?(point[1])
      region_started = point[0]
    else
      region_started = false
    end
    data.each do |point|
      if region_started && ! yrange.include?(point[1])
        regions << (region_started..point[0])
        region_started = false
      end
      next if region_started
      region_started = point[0] if yrange.include?(point[1])
    end
    regions << (region_started..data.last[0]) if region_started
    if DEBUG 
      puts "find_y_regions: #{regions.length}"
      puts data.length
      data.each { |p| puts p.join(', ') }
      puts regions.join(', ')
    end
    regions
  end
  
  # returns true if value is within range
  # returns false otherwise
  def check_condition_with_parameters(value, range)
    range.include?(value)
  end
end
