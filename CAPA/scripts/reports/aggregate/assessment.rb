require 'jruby'
require 'erb'

include_class 'java.lang.System'
include_class 'org.concord.otrunk.ui.question.OTQuestion'
include_class 'org.concord.otrunkcapa.rubric.OTAssessment'
include_class 'org.concord.otrunkcapa.rubric.RubricGradeUtil'


def getLastAssessment(user)
  getLastContent(user, OTAssessment)
end

## Get last item in user script object contents that is a sub-type of contentType 
def getLastContent(user, contentType)
  last = nil
  for content in contentsMap[user] 
    last = content if content.kind_of?(contentType) 
  end
  last
end

## Get label for rubric indicator
def getIndicatorLabel(indicator, assessment, rubric)
  indicatorGrade = RubricGradeUtil.getIndicatorGrade(assessment, indicator, rubric)
  return indicatorGrade.getOTIndicatorGrade().getLabel
end

def getIndicatorPoints(indicator, assessment, rubric)
  indicatorGrade = RubricGradeUtil.getIndicatorGrade(assessment, indicator, rubric)
  return indicatorGrade.getPoints
end

def questions
  @questions  
end

def _getQuestions
  questions = []
  variables = $scriptObject.getVariables.getVector
  for v in variables
    questions << v.getReference if v.getReference.is_a? OTQuestion
  end
  questions
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

def getAnswer(question)
  
end

def getCorrectAnswer(question)
  
end
