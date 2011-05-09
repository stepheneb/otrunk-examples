require 'jruby'
require 'erb'

include_class 'java.lang.System'
include_class 'org.concord.otrunk.logging.OTModelLogging'
include_class 'org.concord.otrunk.script.ui.OTScriptButton'
include_class 'org.concord.otrunk.script.jruby.OTJRuby'
include_class 'org.concord.otrunk.ui.question.OTQuestion'


def csvEscape(text)
  return '' if text == nil
  text = text.join(',') if text.is_a? Array
  return '"' + text.gsub('"', '""').gsub('<','[').gsub('>',']') + '"'
end

# Called when the script view is loaded
def getText
  otImport($libraryScript)
  otImport($otrunkHelperScript)
  otImport($questionScript)
  otImport($reportableScript)
  otImport($exporterScript)
  
  @otrunkHelper = OTrunkHelper.new
  @questions = Questions.new(@otrunkHelper)
  
  @locationReportableMap = {}

  @pageObjectLocations = []
  intrasessions = @otrunkHelper.getIntrasessionObjects
  intrasessions.each do |i|
    reportable = Reportable.new(i, @questions, @otrunkHelper.otrunk)
    reportableSubmits = ReportableSubmits.new(reportable)

    location = @otrunkHelper.objectLocationInActivity(i)

    # in order to make sure that the submit counts and other info stick to their question,
    # make sure we make the location info unique
    count = [0]
    while @pageObjectLocations.include?(location + count)
      count = [count[0] + 1]
    end
    location += count
    @pageObjectLocations << location

    @locationReportableMap[reportable] = location + [0]
    @locationReportableMap[reportableSubmits] = location + [1]

    if i.is_a?(OTModelLogging)
      reportableCollects = ReportableCollects.new(reportable)
      @locationReportableMap[reportableCollects] = location + [2]

      reportableTime = ReportableTime.new(reportable)
      @locationReportableMap[reportableTime] = location + [3]
    end
    
    if i.is_a?(OTDataCollector)
      reportableScore = ReportableScore.new(reportable)
      @locationReportableMap[reportableScore] = location + [4]
    end
  end

  @questions.questions.delete_if{|q| q.prompt == nil || q.input == nil}.each do |q|
    found = @locationReportableMap.keys.detect {|r| r.object.equals(q) }
    unless found
      reportable = Reportable.new(q, @questions, @otrunkHelper.otrunk)
      foundInput = @locationReportableMap.keys.detect {|r| r.object.equals(q.input) }
      if foundInput
        # this question's input was an intrasession object.
        # replace the intrasession reportable with this reportable,
        # so that the question prompt is included in the report
        loc = @locationReportableMap.delete(foundInput)
        @locationReportableMap[reportable] = loc
      else
        location = @otrunkHelper.objectLocationInActivity(q)

        # in order to make sure that the submit counts and other info stick to their question,
        # make sure we make the location info unique
        count = [0]
        while @pageObjectLocations.include?(location + count)
          count = [count[0] + 1]
        end
        location += count
        @pageObjectLocations << location
        @locationReportableMap[reportable] = location + [0]
      end
    end
  end

  @sortedReportables = @locationReportableMap.keys.compact.sort{|a,b| @locationReportableMap[a] <=> @locationReportableMap[b] }

  activityRoot = @otrunkHelper.activityRoot
  #puts activityRoot.toString()
  if $xmlReportScript
    otImport($xmlReportScript)
  
	getXmlReport
  end
  
  render($template)
end

def getCsv
  rows = []
  rows << ["Student"] + @sortedReportables.map{|q| q.prompt }
  rows << ["Correct Answer"] + @sortedReportables.map{|q| q.correctAnswer }

  @otrunkHelper.users.each do |u|
    rows << [u.getName()] + @sortedReportables.map{|q| q.answerText(u) }
  end
  return rows
end

def otImport(script)
  if script
      srcProp = script.otClass().getProperty('src')
      srcValue = script.otGet(srcProp)
      eval(Java::JavaLang::String.new(script.src).to_s, nil, srcValue.getBlobURL().toExternalForm())
  else
    System.err.println("Cannot import?? #{script}")
  end
end

def getXmlReport
  questions = @otrunkHelper.getQuestions
  
  report = XmlReport.new('loops', @otrunkHelper, questions, [], $navigationHistory)
  
  users.each do |user|
    studentElem = report.addStudent(user)
  end
  
  @xmlText = report.getText
  #@xmlPrettyText = report.getPrettyText
  #puts @xmlText
  #puts @xmlPrettyText
end
