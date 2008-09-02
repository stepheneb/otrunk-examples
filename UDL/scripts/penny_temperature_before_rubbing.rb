
DEBUG=true

eval Java::JavaLang::String.new($otrunk_ruby_script_tools.src).to_s
eval Java::JavaLang::String.new($smart_graph_range_response.src).to_s

response_key = {
  :prompt => "What was the temperature of the penny before the rubbing started? Hint: Look at the Y axis scale on the left, where it says \"Temperature (deg C)\".",
  :response_type => :number,
  :correct_range => { :range => 25.5..26.5, :axis => :y },
  :highlight_range => { :range => 0..6, :axis => :x },
  :no_answer_entered => { :text => "Enter your estimate into the text entry box." },
  :correct => 
    { :text => "That's correct!\nNow you can move on to the next page", 
      :highlight_region => false },
  :first_wrong_answer => 
    { :text => "Oops, that's not correct.\nThink about the change in the penny's temperature after the rubbing started.\nNow look at the graph just before that change." },
  :second_wrong_answer => 
    { :text => "Oops, that's still not correct.\nThe region on the graph before the penny was rubbed is now marked.\nWhat temperature is the penny in that region.", 
      :highlight_region => true },
  :multiple_wrong_answers => 
  { :text => "Oops, that's still not correct.\nThe region on the graph before the penny was rubbed is now marked.\nWhat temperature is the penny in that region.", 
      :highlight_region => true }
}

@smart_graph_range_response = SmartGraphRangeResponse.new(response_key, $graph, $smart, $correct, $times_incorrect, $Question)

def self.clicked
  @smart_graph_range_response.clicked
end
