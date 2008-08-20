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
