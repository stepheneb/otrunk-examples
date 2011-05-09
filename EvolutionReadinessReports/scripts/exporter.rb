class Exporter
  def initialize(objectIds, csvRows = [], infoColumns = 1, headerRows = 2, leftBorderColumns = [])
    @embeddedObjects = objectIds
    @csvRows = csvRows
    @infoColumns = infoColumns
    @headerRows = headerRows
    @leftBorderColumns = leftBorderColumns
  end
  
  def embedExportButton()
    scriptButton = otCreate(OTScriptButton) do |btn|
      btn.text = 'Export Excel'
      btn.script = otCreate(OTJRuby) do |scpt|
        scpt.script = getScript
      end
    end
    return "<div>#{embedObject(scriptButton)}<!-- #{getScript} --></div>"
  end
  
  def getScript
    script = "include_class 'org.concord.otrunk.intrasession.util.ExcelExporter'\n"
    script += "include_class 'org.concord.framework.otrunk.OTrunk'\n"
    script += "include_class 'java.util.ArrayList'\n\n"
    script += "@embeddedObjects = #{@embeddedObjects.inspect}\n"
    script += "@leftBorderColumns = #{@leftBorderColumns.inspect}\n"
    script += "@csvInfo = ArrayList.new\n"
    script += "csvRows = #{@csvRows.inspect}\n"
    script += "csvRows.each do |row|\n"
    script += "  rowInfo = ArrayList.new\n"
    script += "  row.each {|v| rowInfo.add v }\n"
    script += "  @csvInfo.add rowInfo\n"
    script += "end\n\n"
    script += '
      def clicked
        csvExporter = ExcelExporter.new($viewContext.getViewService(OTrunk.java_class), $jComponentViewContext, @csvInfo, @leftBorderColumns.to_java(:int))
        csvExporter.setInfoColumns(' + @infoColumns.to_s + ')
        csvExporter.setHeaderRows(' + @headerRows.to_s + ')
        csvExporter.export(@embeddedObjects.to_java :String)
      end
      '
    return script
  end
end