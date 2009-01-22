## Aggregate report for performance assessment "Amplitude Modulation"

require 'jruby'
require 'erb'

include_class 'java.lang.System'
include_class 'org.concord.otrunk.ui.question.OTQuestion'
include_class 'org.concord.otrunkcapa.rubric.OTAssessment'
include_class 'org.concord.otrunkcapa.rubric.RubricGradeUtil'

## Called when the script view is loaded
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
  @correctCarrierFrq = '-'
  @correctModFrq = '-'
  @correctModIndex = '-'
  @submittedCarrierFrq = '-'
  @submittedModFrq = '-'
  @submittedModIndex = '-'

  log = @otrunkHelper.getLastContent(user, OTText).getText
  n = 0

  for line in log
    case line
      when /Correct carrier frequency = (\S+\s+\S+)/; @correctCarrierFrq = Regexp.last_match(1); n += 1       
      when /Correct modulator frequency = (\S+\s+\S+)/; @correctModFrq = Regexp.last_match(1); n += 1       
      when /Correct modulation index = (\S+)/; @correctModIndex = Regexp.last_match(1); n += 1
      when /submitted: carrier frequency = (\S+\s+\S+)/; @submittedCarrierFrq = Regexp.last_match(1); n += 1       
      when /submitted: modulator frequency = (\S+\s+\S+)/; @submittedModFrq = Regexp.last_match(1); n += 1              
      when /submitted: modulation index = (\S+)/; @submittedModIndex = Regexp.last_match(1); n += 1        
    end

    break if n > 5
  end
end

### BEGIN CSV Related ###

def getCsvText
  t = ''
  t << getCsvHeader

  @indicatorMap = {} 
  for indicator in $rubric.getIndicators.getVector 
    @indicatorMap[indicator.getName] = indicator
  end 

  Util.log("#{$rubric.getIndicators.getVector.size} indicators")

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

  t << 'Correct Carrier Frequency' + @sep + 'Submitted Carrier Frequency' + @sep
  t << 'Correct Modulator Frequency' + @sep + 'Submitted Modulator Frequency' + @sep
  t << 'Correct Modulation Index' + @sep + 'Submitted Modulation Index' + @sep

  for indicator in indicators
    t << "Max Points #{indicator.getName}"+ @sep
    t << "Points" + @sep
  end
  t << "Max Final Grade" << @sep
  t << "Final Grade" + @newline
end

def getCsvUserLine(user, assessment, rubric)
  t = ''

  name = user.getName.split
  t <<  (name.size > 1 ? name[0] : '') + @sep + name[-1] + @sep
  t << @correctCarrierFrq + @sep + @submittedCarrierFrq + @sep
  t << @correctModFrq + @sep + @submittedModFrq + @sep
  t << @correctModIndex + @sep + @submittedModIndex + @sep

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

### END CSV Related ###
