# Create a response_key Hash object describing the smart graph query interactions.
# 
# Elements that setup the smart graph query interaction:
# 
# Required:
# 
#   :response_type => :number
#   
#   Specify the type of response the learner will use to answer the question.
#   Valid types are: :number and :label.
#   
#   Example:
#   
#     :response_type => :number
#   
#   :correct_range
#   
#   Specify the corect range with a Ruby range object. To specify floating point
#   numbers make sure and add at least one digit to the left of the decimal point.
#   
#   In addition specify the :axis for the comparison. The valid values for :axis are:
#   
#     :x and :y
#   
#   Example:
#   
#     :correct_range => { :range => 25.0..35.5, :axis => :x }
# 
# Optional:
#   
#   :prompt
#   
#   Specifying the :prompt will override the content of the prompt in the OTQuestion object.
#   It can be useful to have the text of the prompt in the script just to make it easier to
#   fine tune the editing of the response hints.
#   
#   Example:
#   
#     :prompt => "How many seconds did it take for the penny to heat up?"
#   
#   :highlight_range
#   
#   Specify the :highlight_range if the range to be highlighted is different 
#   than the range used to specify the correct answer.
#   
#   Example:
#   
#     :highlight_range => { :range => 5..30, :axis => :x }
# 
# Elements that specify the interaction when the "Check Answer" button is clicked:
# 
#   All of these elements can optionally include a boolean value for :highlight_region. 
#   Valid values are true and false.
# 
#   :no_answer_entered
#   :correct
#   :first_wrong_answer
#   :second_wrong_answer
#   :multiple_wrong_answers
# 
#   Examples:
#   
#     :correct => { :text => "That's correct!\nNow you can move on to the next page", :highlight_region => false }
#     
#     :second_wrong_answer => 
#       { :text => "Oops, that's still not correct.\nThe region on the graph when the penny was being heated is now marked.\nSubtract the time on the X axis at the start of that region\nfrom the time on the X axis at end of that region.", 
#         :highlight_region => true }

      
class SmartGraphRangeResponse
  include OTrunkRubyScriptTools
  
  attr_reader :response_key, :ot_data_collector, :smart_graph_tool, :ot_correct, :ot_times_incorrect, :ot_question, :ot_question_text_field, :data_graph
  
  def initialize(response_key, ot_data_collector, smart_graph_tool, ot_correct, ot_times_incorrect, ot_question, ot_question_text_field=nil)
    puts "\n\ninitializing new SmartGraphRangeResponse object ...\n" if debugging?
    @response_key = response_key
    @correct_range = @response_key[:correct_range]
    @highlight_range = @response_key[:highlight_range] || @correct_range
    @ot_data_collector = ot_data_collector
    @smart_graph_tool = smart_graph_tool
    @ot_correct = ot_correct
    @ot_times_incorrect = ot_times_incorrect
    @ot_question = ot_question
    @ot_question_text_field = ot_question_text_field
    @prompt = @response_key[:prompt]
    if debugging?
      @prompt = "<small><i>(Response Type: #{@response_key[:response_type]}, axis: #{@response_key[:correct_range][:axis]})</i></small><br />" + @prompt
    end
    if @prompt && @ot_question
      if debugging?
        puts "resetting prompt in script ..."
        puts "original prompt:\n#{@ot_question.getPrompt.getBodyText}\n"
        puts "intended new prompt:\n#{@prompt}\n" 
      end 
      @ot_question.getPrompt.setBodyText(@prompt)
      if debugging?
        puts "resulting prompt:\n#{@ot_question.getPrompt.getBodyText}\n"
      end
    end
    @smart_graph_tool.removeAllRegionLabels
    if debugging?
      puts "-"*20
      puts "ot_data_collector data: #{@ot_data_collector.class}"
      puts "-"*20
      puts "smart_graph_tool data: #{@smart_graph_tool.class}"
      p_start = @smart_graph_tool.getStart
      puts "start: #{p_start.class}, #{p_start}"
      p_end = @smart_graph_tool.getEnd
      puts "end: #{p_end.class}, #{p_end}"
      # p_interesting = @smart_graph_tool.getInterestingPoints
      # puts "interesting: #{p_interesting.class}, #{p_interesting}"
      # generates error:
      #   org/concord/data/state/OTDataStoreRealObject.java:214:in 
      #   `getIndex': java.lang.IndexOutOfBoundsException: 
      #    Trying to lookup an invalid channel: 1 (NativeException)
    end
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
  
  def clicked
    # I don't yet have function access to the real datagraph object
    # so this setup for later test of access to the real object is commented out
    # @data_graph = get_real_data_graph(@ot_data_collector) unless @data_graph
    # @original_data_graph_title = @data_graph.getTitle unless @original_data_graph_title
    response = get_response
    unless response
      self.correct = false
      update(@response_key[:no_answer_entered])
      
      # I don't yet have function access to the real datagraph object
      # so this test is commented out
      # @data_graph.setTitle(@original_data_graph_title + "no answer")
    else
      if response[:correct]
        self.correct = true
        update(@response_key[:correct])

        # I don't yet have function access to the real datagraph object
        # so this test is commented out
        # @data_graph.setTitle(@original_data_graph_title + "correct")
      else
        self.correct = false
        self.times_incorrect += 1

        # I don't yet have function access to the real datagraph object
        # so this test is commented out
        # @data_graph.setTitle(@original_data_graph_title + "times incorrect: #{times_incorrect}")
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
      if lastLabel = last_valid_label(@ot_data_collector.getLabels)
        response = { :x => lastLabel.getXData, :y => lastLabel.getYData }
        response.merge!( { :correct => (@correct_range[:range] === response[@correct_range[:axis]]) })
      else
        false
      end
    when :number
      answer = question_number_answer
      puts "get_response: #{answer}" if debugging?
      if answer = question_number_answer
        case @correct_range[:axis]
        when :x
           response = { :x => answer, :y => nil }
           puts ":x response: #{response.inspect}" if debugging?
        when :y
          response = { :x => nil, :y => answer }
          puts ":y response: #{response.inspect}" if debugging?
        end
        response.merge!( { :correct => (@correct_range[:range] === response[@correct_range[:axis]]) })
        if debugging?
          puts "response[@correct_range[:axis]]: #{response[@correct_range[:axis]]}"
          puts "@correct_range[:range]: #{@correct_range[:range]}"
          puts "response result: #{response.inspect}" if debugging?
        end
        response
      else
        false
      end
    end
  end
  
  def question_number_answer
    if debugging?
      puts "question_number_answer:"
      puts "#{@ot_question_text_field}"
      puts "#{@ot_question_text_field.getText}"
    end
    if @ot_question_text_field && response = @ot_question_text_field.getText
      begin
        answer = Float(response)
      rescue ArgumentError
        false
      end
    else
      false
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
        @smart_graph_tool.showRegionLabel(@highlight_range[:range].first, @highlight_range[:range].last)
      when :y
        data = get_graph_data(@ot_data_collector)
        regions = find_y_regions(data, @highlight_range[:range])
        regions.each { |region| @smart_graph_tool.showRegionLabel(region.first, region.last) }
      end
    when false
      @smart_graph_tool.removeAllRegionLabels      
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
    if debugging? 
      puts "find_y_regions: #{regions.length}"
      puts data.length
      data.each { |p| puts p.join(', ') }
      puts regions.join(', ')
    end
    regions
  end
  
end
