# Original template file: scripts/smart_graph_label_script_template.rb

# Setting the DEBUG constant to true will generate additional 
# debugging information in the Java console.
# DEBUG=true

eval Java::JavaLang::String.new($otrunk_ruby_script_tools.src).to_s
eval Java::JavaLang::String.new($smart_graph_range_response.src).to_s

# Edit the values in the response_key Hash below to customize the
# Smart Graph Query responses

response_key = {
  # Optional: You can specify the prompt in the script, this will override the 
  # value entered in the question object.
  # :prompt => "Please answer this question: how much?",
  
  # Specify the response_type as :label when the
  # learner responds to the question by entering a data point label. 
  :response_type => :label,
  
  # The value for a :range key can be any of the following:
  #
  #   a Ruby Range object
  #
  #     <start_of_range>..<end_of_range>
  #
  #   The values for start_of_range and end_of_range can be
  #   Fixnums (Integers) or Floats. Specify a floating point 
  #   by including a decimal point and at least one one digit
  #   to the right of the decimal point.
  #
  #   Example: 30.0..31.5
  #
  #   a Ruby number (Fixnum or Float)
  #
  #   Examples: 26, 30.0
  #
  # valid axis values are :x and :y
  #
  :correct_range => { :range => 0.0..5.0, :axis => :x },
  
  # Optional: specify the highlight_range if it is different than the correct_range
  # :highlight_range => { :range => 5..30, :axis => :x },
  :no_answer_entered => 
    { :text => "Use the label tool to add a label to the graph.", :highlight_region => false  },
  :correct => 
    { :text => "Correct! Go on to the next page.", :highlight_region => false },
  :first_wrong_answer => 
    { :text => "That's not correct. ", :highlight_region => false  },
  :second_wrong_answer => 
    { :text => "That's still not correct. Add a label to the highlighted part of the graph.", :highlight_region => true },
  :multiple_wrong_answers => 
    { :text => "That's still not correct. ", :highlight_region => true }
}

# Create a new SmartGraphRangeResponse object with your response_key and the 
# global variables created by the Smart Graph Label type Question input.
@smart_graph_range_response = SmartGraphRangeResponse.new(response_key, $graph, $smart, $correct, $times_incorrect, $question)

# When the "Check Answer" button is clicked the clicked method
# of the @smart_graph_range_response object will be called.
def self.clicked
  @smart_graph_range_response.clicked
end
