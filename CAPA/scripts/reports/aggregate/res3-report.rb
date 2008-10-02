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
    actionStr = 'default_template'
  end
  
  return eval(actionStr)
end

def init
  otImport($commonScript)
  otImport($assessmentScript)
  
  @otrunk = $viewContext.getViewService(OTrunk.java_class)
  @users = _retrieveUsers
  @contentsMap = _createContentsMap
  @questions = _getQuestions
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
  @correctAnswer = '-'
  @submittedAnswer = '-'
  
  log = getLastContent(user, OTText).getText
  n = 0
  
  for line in log
    case line
      when /Solution is.*resistance = (\S+\s+\S+)/; @correctAnswer = Regexp.last_match(1); n += 1       
      when /Answer Submitted: (\S+\s+\S+)/; @submittedAnswer = Regexp.last_match(1); n += 1       
    end
    
    break if n > 1
  end
end

def getGateLabel(num)
  return(num ? DTSAssessmentUtil.getGateLabel(num) : '-')
end
  
### BEGIN CSV Related ###

def getCsvText
  t = ''
  t << getCsvHeader
  
  @indicatorMap = {} 
  for indicator in $rubric.getIndicators.getVector 
    @indicatorMap[indicator.getName] = indicator
  end 
    
  for user in users
    assessment = getLastAssessment(user)
    if assessment == nil 
      error("Assessment not present for user [#{user.getName}]")
      next
    end
    parseLog(user)
    t << getCsvUserLine(user, assessment, $rubric)
  end
  return t
end

def getCsvHeader
  indicators = $rubric.getIndicators.getVector
  t = ''
  # First line
  t << @sep * 4
  for indicator in indicators
    t << indicator.getName + '->' + @sep * 3
  end 
  t << @newline
  
  # Second line
  t << 'First Name' + @sep + 'Last Name' + @sep
  t << 'Submitted Answer' << @sep << 'Correct Answer' << @sep
  
  for indicator in indicators
    t << 'String' + @sep + 'Indicator' + @sep + 'Points' + @sep
  end
  t << 'Final Grade' + @newline
  return t
end

def getCsvUserLine(user, assessment, rubric)
  t = ''
  
  name = user.getName.split
  t <<  (name.size > 1 ? name[0] : '') + @sep + name[-1] + @sep
  t << @submittedAnswer + @sep + @correctAnswer + @sep
    
  indicators = rubric.getIndicators.getVector
  indicatorValues = assessment.getIndicatorValues  
  
  for indicator in indicators
    name = indicator.getName
    t << getIndicatorLabel(@indicatorMap[name], assessment, rubric) + @sep
    t << indicatorValues.get(name).to_s + @sep
    t << getIndicatorPoints(@indicatorMap[name], assessment, rubric).to_s + @sep
  end
  t << RubricGradeUtil.getTotalGrade(assessment, rubric).getPoints.to_s + @newline
  return t        
end

### END CSV Related ###
