module OTrunkRubyScriptTools

  def debugging?
    (defined? DEBUG) && DEBUG == true
  end
  
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

  def get_graph_data(ot_data_collector)
    ot_data_store = ot_data_collector.getSource.getDataStore
    ot_resource_list = ot_data_store.getValues
    values = []
    (ot_resource_list.size-1).times {|i| values << ot_resource_list.get(i) }
    x_values = []
    y_values = []
    puts "numberChannels #{ot_data_store.getNumberChannels}" if debugging?
    case ot_data_store.getNumberChannels
    when 1
      y_values = values
      dt = ot_data_store.getDt
      y_values.length.times {|i| x_values << i * dt }
    when 2
      values.each_with_index do |value, i| 
        if i % 2 == 0
          x_values << value
        else
          y_values << value
        end
      end
    end
    [x_values, y_values].transpose
  end
end
