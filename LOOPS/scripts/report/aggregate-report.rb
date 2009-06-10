require 'jruby'
require 'erb'

# Called when the script view is loaded
def getText
  otImport($libraryScript)
  otImport($otrunkHelperScript)
  otImport($questionScript)
  otImport($xmlReportScript)
  
  @otrunkHelper = OTrunkHelper.new
  @questions = Questions.new(@otrunkHelper)
  
  activityRoot = @otrunkHelper.activityRoot
  puts activityRoot.toString()
  getXmlReport
  
  render($template)
end

def otImport(script)
  if script
      srcProp = script.otClass().getProperty('src')
      srcValue = script.otGet(srcProp)
      eval(Java::JavaLang::String.new(script.src).to_s, nil, srcValue.getBlobURL().toExternalForm())
  else
    System.err.println("Cannot import #{script}")
  end
end

def getXmlReport
  report = XmlReport.new('loops', @otrunkHelper)
  
  questions = @otrunkHelper.getQuestions
  report.addQuestions(questions)

  users.each do |user|
    studentElem = report.addStudent(user)
  end
  @xmlText = report.getText
  @xmlPrettyText = report.getPrettyText
end
