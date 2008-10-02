require 'jruby'
require 'erb'

include_class 'java.lang.System'
include_class 'org.concord.otrunk.ui.question.OTQuestion'
include_class 'org.concord.otrunkcapa.rubric.OTAssessment'
include_class 'org.concord.otrunkcapa.rubric.RubricGradeUtil'


def getLastAssessment(user)
  return getLastContent(user, OTAssessment)
end

## Get last item in user script object contents that is a sub-type of contentType 
def getLastContent(user, contentType)
  last = nil
  for content in contentsMap[user] 
    last = content if content.kind_of?(contentType) 
  end
  return last
end

## Get label for rubric indicator
def getIndicatorLabel(indicator, assessment, rubric)
  indicatorGrade = RubricGradeUtil.getIndicatorGrade(assessment, indicator, rubric)
  return indicatorGrade ? indicatorGrade.getOTIndicatorGrade().getLabel : 'NO RECORD'
end

def getIndicatorPoints(indicator, assessment, rubric)
  indicatorGrade = RubricGradeUtil.getIndicatorGrade(assessment, indicator, rubric)
  return indicatorGrade ? indicatorGrade.getPoints : 0
end

def questions
  return @questions  
end

def _getQuestions
  questions = []
  variables = $scriptObject.getVariables.getVector
  for v in variables
    questions << v.getReference if v.getReference.is_a? OTQuestion
  end
  return questions
end

# @param question an OTQuestion
def promptText(question)
  prompt = question.getPrompt
  unless prompt.is_a?(OTText)
    return prompt.getText
  else
    return question.to_s
  end
end
