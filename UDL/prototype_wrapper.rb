require 'rubygems'
require 'nokogiri'
require 'builder'
$id_counters = {}

##
## prevent duplicate global abd local_ids
##
def clean_ids(_node)
  _node.xpath(".//*[@local_id]").each do |node|
    parent_name = node.parent.node_name
    name = "#{parent_name}"
    if $id_counters[name]
      $id_counters[name] = $id_counters[name] + 1
    else
      $id_counters[name] = 1
    end
    node.set_attribute("local_id", "dyn_#{name}_#{$id_counters[name]}")
  end
  _node.xpath(".//*[@id]").each do |node|
    node.set_attribute("id", %x|uuidgen|.strip)
  end
end

##
## create a new protoTypeGraphables stanza
## (used as prototype when 'new' is clicked in multigraph)
##
def prototype(producer)
  builder = Builder::XmlMarkup.new(:indent => 2)
  builder.prototypeGraphables do |xml|
    xml << producer.to_s
  end
  results = Nokogiri::XML::DocumentFragment.parse(builder)
  
  # not sure why <strip/> tags are being generated, but remove them.
  results.xpath(".//strip").each { |n| n.remove } 
  # ensure unique local_ids in datastores
  clean_ids results
  return results
end

###################################
## Main entry
################################### 
outdir = "out"
%x| rm -rf #{outdir}|
%x| mkdir #{outdir} |

Dir.glob('*.otml').each do|f|
  xmlfile = Nokogiri::XML(File.open(f),nil,nil,nil)
  File.open("#{outdir}/old_#{f}", 'w') {|outfile| outfile.write(xmlfile) }
  puts "reading #{f}, (saving as #{outdir}/old_#{f} and #{outdir}/#{f}"
  dataCollectors = xmlfile.xpath('//OTDataCollector[@multipleGraphableEnabled="true"]')
  # dont modify anyone who already has a prototype stanza.
  dataCollectors = dataCollectors.reject do |dc|
    results = dc.xpath('.//prototypeGraphables')
    results.size > 0
  end
  puts "== #{outdir}/#{f} found #{dataCollectors.size} datacollectors needing update" if dataCollectors.size > 0
  dataCollectors.each do |dc|
    graphables = dc.xpath('.//source/OTDataGraphable')
    puts "     .. found #{graphables.size} graphables"
    graphable = graphables.last.dup
    graphable.xpath(".//dataStore").each {|g| g.remove}
    dc.add_child(prototype(graphable))
  end
  File.open("#{outdir}/#{f}", 'w') {|outfile| outfile.write(xmlfile) }
end

