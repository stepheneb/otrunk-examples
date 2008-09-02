
DEBUG=true

eval Java::JavaLang::String.new($otrunk_ruby_script_tools.src).to_s
eval Java::JavaLang::String.new($smart_graph_range_response.src).to_s

response_key = {
  :prompt => "Add a label to the graph showing one of the places where the penny was between 30 and 31 degrees C. Then click the button below to check your answer",
  :response_type => :label,
  :correct_range => { :range => 30.0..31.0, :axis => :y },

  :no_answer_entered => { :text => "Use the label tool to add a label to the graph!" },
  :correct => 
    { :text => "That's correct!\nNow you can move on to the next page", 
      :highlight_region => false },
  :first_wrong_answer => 
    { :text => "Oops, that's not correct.\nHint: Look at the Y axis scale on the left\nwhere it says \"Temperature (deg C)\" between 30 and 31." },
  :second_wrong_answer => 
    { :text => "Oops, that's not correct.\nThe regions of the graph where the penny was\nbetween 30 and 31 degrees are now highlighted.\nTry adding a label in that region.", 
      :highlight_region => true },
  :multiple_wrong_answers => 
  { :text => "Oops, that's not correct.\nThe regions of the graph where the penny was\nbetween 30 and 31 degrees are now highlighted.\nTry adding a label in that region.", 
      :highlight_region => true }
}

@smart_graph_range_response = SmartGraphRangeResponse.new(response_key, $graph, $smart, $correct, $times_incorrect, $Question)

def self.clicked
  @smart_graph_range_response.clicked
end
