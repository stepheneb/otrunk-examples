require 'jruby'
require 'erb'

include_class 'java.lang.System'
include_class 'org.concord.otrunk.ui.question.OTQuestion'
include_class 'org.concord.otrunkcapa.OTMultimeterAssessment'
include_class 'org.concord.otrunkcapa.OTMultimeterAsessmentGradeUtil'
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
  eval(actionStr)
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

def getLastMultimeterAssessment(user)
  getLastContent(user, OTMultimeterAssessment)
end

def getCorrectAnswerText(userAssessment)
    cv = userAssessment.getCorrectValue
    return "%.3f %s" % [cv.getValue, cv.getUnit]
end 

def getAnswerText(userAssessment)
    cv = userAssessment.getAnswerValue
    return "%.3f %s" % [cv.getValue, cv.getUnit]
end 

### BEGIN CSV Related ###

def getCsvText
  t = ''
  t << getCsvHeader
  
  @indicatorMap = {} 
  # Assuming same set of indicators for voltage, current, and resistance rubric
  for indicator in $rubric.getVoltageRubric.getIndicators.getVector 
    @indicatorMap[indicator.getName] = indicator
  end 
    
  for user in users
    multimeterAssessment = getLastMultimeterAssessment(user)
    if multimeterAssessment == nil 
      error("Assessment not present for user [#{user.getName}]")
      next
    end
    assessments = multimeterAssessment.getAnswers.getVector
    if assessments == nil or assessments.length != 3
      error("Sub-Assessments not present for user [#{user.getName}]")
      error("dmmCsvGetText: #{assessments.length} sub-assessments present")
      next
    end
    name = user.getName.split
    t <<  (name.size > 1 ? name[0] : '') + @sep + name[-1] + @sep
    t << csvRubricLineSegment(user, $rubric.getVoltageRubric, assessments[0])
    t << csvRubricLineSegment(user, $rubric.getCurrentRubric, assessments[1])
    t << csvRubricLineSegment(user, $rubric.getResistanceRubric, assessments[2])
    t << OTMultimeterAsessmentGradeUtil.getTotalGrade(multimeterAssessment, $rubric).getPoints.to_s    
    t << @newline
  end
  return t
end 
  
def getCsvHeader
  indicators = $rubric.getVoltageRubric.getIndicators.getVector
  labels = ['Voltage', 'Current', 'Resistance']
  t = ''
  # First line
  skip = (indicators.size + 1) * 3
  t << @sep * 2 + 'Voltage' + @sep * skip + 'Current'
  t << @sep * skip + 'Resistance' + @newline
  
  # Second line
  t << @sep * 2 
  3.times { |i|
    t << @sep * 2
    for indicator in indicators
      t << indicator.getName + @sep * 3  
    end 
    t << @sep
  }
  t << @newline
  
  # Third line
  t << 'First Name' + @sep + 'Last Name' + @sep
  3.times { |i|
    t << "Submitted #{labels[i]}" + @sep + "Correct #{labels[i]}" + @sep
    for indicator in indicators
      t << "String" + @sep + "Indicator" + @sep + "Points" + @sep
    end 
    t << "Total #{labels[i]}Points" + @sep
  }
  t << "Final Grade"
  t << @newline
end

def csvRubricLineSegment(user, rubric, assessment)
  t = ''
  t << getAnswerText(assessment) << @sep
  t << getCorrectAnswerText(assessment) << @sep
    
  indicators = rubric.getIndicators.getVector
  indicatorValues = assessment.getIndicatorValues  
  
  for indicator in indicators
    name = indicator.getName
    log("NAME " + name + " IND " + @indicatorMap[name].inspect)
    t << getIndicatorLabel(@indicatorMap[name], assessment, rubric) + @sep
    t << indicatorValues.get(name).to_s + @sep
    t << getIndicatorPoints(@indicatorMap[name], assessment, rubric).to_s + @sep
  end
  t << RubricGradeUtil.getTotalGrade(assessment, rubric).getPoints.to_s + @sep
  return t        
end

### END CSV Related ###

 