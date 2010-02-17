def clicked
  ConverterThread.new().start()  
end

class ConverterThread < java.lang.Thread

  def run
    
    unless $printObject
     $printObject = $viewContainer.parentContainer.currentObject
    end
  
    unless $printViewEntry
      $printViewEntry = $viewContainer.parentContainer.currentViewEntry
    end 
  
    htmlConverter = org.concord.otrunk.OTMLToXHTMLConverter.new(
        $viewContext.createChildViewFactory, $printObject,
		$printViewEntry, "print")
    outFile = java.io.File.createTempFile("ot_print",".html")
    htmlConverter.setXHTMLParams(outFile, 800, 600)
    htmlConverter.run
    fileWriter = java.io.FileWriter.new(outFile, true)
    fileWriter.append("<script language=\"JavaScript\">\n<!-- \nif (window.print) window.print();\n //--> \n</script>")
    fileWriter.close
    puts "ran converter " + outFile.toString()
    appService = $viewContext.getViewService(org.concord.framework.otrunk.view.OTExternalAppService.java_class)
    appService.showDocument(outFile.toURL())
  end
end