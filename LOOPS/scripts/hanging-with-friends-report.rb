if $libraryScript
  # load in the library
  eval(Java::JavaLang::String.new($libraryScript.src).to_s)
end

def getText
  @otrunk = $viewContext.getViewService(OTrunk.java_class);
  do_setup
  render($template)
end

def do_setup
  # @sections = Card.new($Section1.content.cards.vector[0])
  @cards = $Section1.content.cards.vector.collect {|card| Card.new(card) }
end

class DataStore
  attr_accessor :ot_data_store
  attr_accessor :number_of_channels, :channel_descriptions, :values

  def initialize(data_store)
    @ot_data_store = data_store
    puts "@ot_data_store =>  #{@ot_data_store.otClass.name}"
    @number_of_channels = @ot_data_store.number_channels
    puts "@number_of_channels =>  #{@number_of_channels}"
    ot_resource_list = @ot_data_store.values
    @values = []
    (ot_resource_list.size-1).times {|i| @values << ot_resource_list.get(i) }
    puts "@values.length =>  #{@values.length}"
    @values.each { |value| puts "#{value.class}: #{value}" }
    @number_of_rows = @values.length / @number_of_channels
    @rows = []
    @number_of_rows.times { |i| @rows[i] = row(i) }
    @channel_descriptions = @ot_data_store.channel_descriptions.vector
    puts "@channel_descriptions.length =>  #{@channel_descriptions.length}"
    puts headings
    puts "rows: #{@rows.join}"
  end
  
  def headings
    @channel_descriptions.collect {|cd| cd.name }
  end

  def row(row_number)
    @values[(row_number*@number_of_channels)+1..row_number+@number_of_channels-1]
  end
  
  def any_data?
    !@rows.join.empty?
  end

end

class DataTable
  attr_accessor :ot_data_table
  attr_accessor :columns, :data_store

  def initialize(table)
    @ot_data_table = table
    @columns = @ot_data_table.columns
    puts "@ot_data_table =>  #{@ot_data_table.otClass.name}"
    puts "@ot_data_table.columns.vector.length =>  #{@ot_data_table.columns.vector.length}"
    @data_store = DataStore.new(@ot_data_table.dataStore)
  end

end

class Card
  attr_accessor :ot_card
  attr_accessor :data_table

  def initialize(section)
    @ot_card = section
    if table = @ot_card.documentRefsAsObjectList.vector.find {|ot_obj| ot_obj.is_a? org.concord.data.state.OTDataTable }
      @data_table = DataTable.new(table)
    else
      @data_table = nil
    end
  end
end
