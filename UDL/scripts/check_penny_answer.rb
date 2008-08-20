
puts "ruby script: 'check_penny_answer.rb' evaluated"

# require $otrunk_ruby_script_tools
# require $label_range_response
eval Java::JavaLang::String.new($otrunk_ruby_script_tools.src).to_s
eval Java::JavaLang::String.new($label_range_response.src).to_s

def self.init
  # This is currently not called when the script is run from an OTScriptButton object.
  # The init method is only called when a script is run from an OTScriptObject onject.
  puts "self.init called"
end

def self.clicked
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
