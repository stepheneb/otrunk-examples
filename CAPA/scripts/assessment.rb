## Helper for assessments and rubrics

require 'jruby'
require 'erb'

include_class 'java.lang.System'
include_class 'org.concord.otrunk.ui.question.OTQuestion'
include_class 'org.concord.otrunkcapa.rubric.OTAssessment'
include_class 'org.concord.otrunkcapa.rubric.RubricGradeUtil'

class Assessment
  
  def initialize(otrunkHelper)
    @otrunkHelper = otrunkHelper    
  end

  def getLastAssessment(user)
    return @otrunkHelper.getLastContent(user, OTAssessment)
  end

  ## Get label for rubric indicator
  def getIndicatorLabel(indicator, assessment, rubric)
    indicatorGrade = RubricGradeUtil.getIndicatorGrade(assessment, indicator, rubric)
    return indicatorGrade ? indicatorGrade.getOTIndicatorGrade().getLabel : '-'
  end

  def getIndicatorPoints(indicator, assessment, rubric)
    indicatorGrade = RubricGradeUtil.getIndicatorGrade(assessment, indicator, rubric)
    return indicatorGrade ? indicatorGrade.getPoints : 0
  end

  ## Get maximum points defined by rubric
  ## INPUT: rubric: an OTRubric
  def getMaxPoints(rubric)
    return RubricGradeUtil.getTotalMaximumPoints(rubric)
  end

  def _getQuestions
    questions = []
    variables = $scriptObject.getVariables.getVector
    for v in variables
      questions << v.getReference if v.getReference.is_a? OTQuestion
    end
    return questions
  end

end
