
module OTrunkRubyScriptTools

  def debugging?
    (defined? DEBUG) && DEBUG == true
  end
  
  include_class 'javax.swing.JOptionPane'
  include_class 'org.concord.framework.otrunk.view.OTUserListService'
  include_class 'org.concord.framework.otrunk.OTrunk'
  include_class 'org.concord.datagraph.state.OTDataGraph'
  include_class 'org.concord.datagraph.state.OTDataGraphable'
  include_class 'org.concord.datagraph.state.OTDataGraphView'
  include_class 'org.concord.otrunk.script.ui.OTScriptVariable'
  include_class 'org.concord.framework.otrunk.wrapper.OTString'
  include_class 'org.concord.framework.otrunk.wrapper.OTInt'
  
  def users
    userListService = $viewContext.getViewService(OTUserListService.java_class)
    userListService.getUserList()
  end

  def hasUserModified(obj, user)
    @otrunk.hasUserModified(obj, user)
  end

  def userObject(obj, user)
    @otrunk.getUserRuntimeObject(obj, user);
  end

  def otCreate(rconstant, &block)
    otObj = $otObjectService.createObject(rconstant.java_class)
    yield otObj
    otObj
  end
  

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

  # Returns the values for the first channel of the
  # ot_data_collector's data_store. The values are returned
  # in an array of 2-element arrays consiting of [x, y] values
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
  
  # returns the real data_graph object referenced by 
  # and ot_data_collector
  def get_real_data_graph(ot_data_collector)
    # $viewContext.getViewByObject is not yet implemented so this doesn't work
    # ot_data_collector_view = $viewContext.getViewByObject(ot_data_collector)
    # data_collector_view = ot_data_collector_view.getDataCollectorView
    # data_graph = data_collector_view.getDataGraph
    
    # this doesn't work either
    # data_graph = $controllerService.getRealObject(ot_data_collector)
    
    # also this doesn't work
    # $viewContext.getViewService(DataGraphManager)
  end

end
