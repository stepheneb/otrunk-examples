
# Setting the DEBUG constant to true will generate additional debugging
# information in the Java console
DEBUG=true

eval Java::JavaLang::String.new($otrunk_ruby_script_tools.src).to_s
eval Java::JavaLang::String.new($smart_graph_range_response.src).to_s

response_key = {
  :prompt => "How many seconds did it take for the penny to heat up?",
  :response_type => :number,
  :correct_range => { :range => 25..35, :axis => :x },
  :highlight_range => { :range => 5..30, :axis => :x },
  :no_answer_entered => { :text => "Use the label tool to add a label to the graph!" },
  :correct => 
    { :text => "That's correct!\nNow you can move on to the next page", 
      :highlight_region => false },
  :first_wrong_answer => 
    { :text => "Oops, that's not correct.\n" },
  :second_wrong_answer => 
    { :text => "Oops, that's still not correct.\n", 
      :highlight_region => true },
  :multiple_wrong_answers => 
    { :text => "Oops, that's still not correct.\n", 
      :highlight_region => true }
}

@smart_graph_range_response = SmartGraphRangeResponse.new(response_key, $graph, $smart, $correct, $times_incorrect, $question)

def self.clicked
  @smart_graph_range_response.clicked
end
