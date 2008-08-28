
DEBUG=true

eval Java::JavaLang::String.new($otrunk_ruby_script_tools.src).to_s
eval Java::JavaLang::String.new($label_range_response.src).to_s

response_key = {
  :prompt => "How many seconds did it take for the penny to heat up?",
  :response_type => :number,
  :correct_range => { :range => 25..35, :axis => :x },
  :highlight_range => { :range => 5..30, :axis => :x },
  :no_answer_entered => { :text => "Enter your estimate into the text entry box." },
  :correct => 
    { :text => "That's correct!\nNow you can move on to the next page", 
      :hightlight_region => false },
  :first_wrong_answer => 
    { :text => "Oops, that's not correct.\nFirst find the time when the penny first started to heat up.\nNow find the time when the penny when the penny was hottest.\nThink about how many seconds that took?" },
  :second_wrong_answer => 
    { :text => "Oops, that's still not correct.\nThe region on the graph when the penny was being heated is now marked.\nSubtract the time on the X axis at the start of that region\nfrom the time on the X axis at end of that region.", 
      :hightlight_region => true },
  :multiple_wrong_answers => 
    { :text => "Oops, that's still not correct.\nThe region on the graph when the penny was being heated is now marked.\nSubtract the time on the X axis at the start of that region\nfrom the time on the X axis at end of that region.", 
      :hightlight_region => true }
}

@label_range_response = LabelRangeResponse.new(response_key, $graph, $smart, $correct, $times_incorrect, $Question)

def self.clicked
  @label_range_response.clicked
end
