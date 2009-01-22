## Aggregate report for performance assessment "Using the Oscilloscope"

require 'jruby'
require 'erb'

include_class 'java.lang.System'
include_class 'org.concord.otrunk.ui.question.OTQuestion'
include_class 'org.concord.otrunkcapa.rubric.OTAssessment'
include_class 'org.concord.otrunkcapa.rubric.RubricGradeUtil'

# Called when the script view is loaded
def getText
  @debug = true  
  init 

  if $action
    actionStr = $action.string
  else
    actionStr = '@controller.defaultTemplate'
  end

  eval(actionStr)
end

def init
  otImport($utilScript)  
  otImport($otrunkScript)
  otImport($questionScript)
  otImport($assessmentScript)  
  otImport($controllerScript)

  @otrunkHelper = OTrunkHelper.new(OTrunkHelper::PF_GROUP_REPORT)
  @questions = Questions.new(@otrunkHelper)
  @assessment = Assessment.new(@otrunkHelper)
  @controller = Controller.new(binding) #erb templates will be evaluated in current binding

  @sep = '|' #field separator in csv text 
  @newline = "\n"

  @sep = '|' #field separator in csv text 
  @newline = "\n"
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

def parseLog(user)
  @correctAmp = '-'
  @correctFrq = '-'
  @submittedAmp = '-'
  @submittedFrq = '-'

  log = @otrunkHelper.getLastContent(user, OTText).getText
  n = 0

  for line in log
    case line
      when /Correct amplitude = (\S+\s+\S+)/; @correctAmp = Regexp.last_match(1); n += 1
      when /Correct frequency = (\S+\s+\S+)/; @correctFrq = Regexp.last_match(1); n += 1
      when /submitted: amplitude = (\S+\s+\S+)/; @submittedAmp = Regexp.last_match(1); n += 1
      when /submitted: frequency = (\S+\s+\S+)/; @submittedFrq = Regexp.last_match(1); n += 1
    end
    
    break if n > 3
  end
end

def getCsvText
  t = ''
  t << getCsvHeader

  @indicatorMap = {} 
  for indicator in $rubric.getIndicators.getVector
    @indicatorMap[indicator.getName] = indicator
  end 

  for user in @otrunkHelper.users
    assessment = @assessment.getLastAssessment(user)
    if assessment == nil
      Util.error("Assessment not present for user [#{user.getName}]")
      next
    end
    parseLog(user)
    t << getCsvUserLine(user, assessment, $rubric)
  end
  t
end

def getCsvHeader
  indicators = $rubric.getIndicators.getVector

  t = ['Teacher', 'Class', 'First Name', 'Last Name', 'Activity Name'].join(@sep) + @sep
  t << 'Correct Answer' + @sep + 'Submitted Answer' +  @sep

  t << 'Correct Amplitude' + @sep + 'Submitted Amplitude' + @sep
  t << 'Correct Frequency' + @sep + 'Submitted Frequency' + @sep

  for indicator in indicators
    t << "Max Points #{indicator.getName}"+ @sep
    t << "Points" + @sep
  end
  t << "Max Final Grade" << @sep
  t << "Final Grade" + @newline
end

def getCsvUserLine(user, assessment, rubric)
  t = @otrunkHelper.teacherName << @sep
  t << @otrunkHelper.className << @sep
  name = user.getName.split
  t << (name.size > 1 ? name[0] : '') + @sep + name[-1] + @sep
  t << @otrunkHelper.activityName << @sep

  t << @correctAmp + @sep + @submittedAmp + @sep
  t << @correctFrq + @sep + @submittedFrq + @sep

  indicators = rubric.getIndicators.getVector
  indicatorValues = assessment.getIndicatorValues

  for indicator in indicators
    name = indicator.getName
    t << RubricGradeUtil.getMaximumPoints(indicator).to_s + @sep
    t << @assessment.getIndicatorPoints(@indicatorMap[name], assessment, rubric).to_s + @sep
  end
  t << RubricGradeUtil.getTotalMaximumPoints(rubric).to_s + @sep
  t << RubricGradeUtil.getTotalGrade(assessment, rubric).getPoints.to_s + @newline
end
