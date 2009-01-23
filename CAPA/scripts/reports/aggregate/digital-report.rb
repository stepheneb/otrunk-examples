require 'jruby'
require 'erb'

include_class 'java.lang.System'
include_class 'org.concord.otrunk.ui.question.OTQuestion'
include_class 'org.concord.otrunk.labview.DTSAssessmentUtil'
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

def getData(assessment)
  inv = assessment.getInventory
  ct = inv.get('c_truthValues') 
  st = inv.get('s_truthValues') 
  @c_truthValues = (ct ? "'" + ct : '-') 
  @s_truthValues = (st ? "'" + st : '-')
  @c_fault1 = getGateLabel(inv.get('c_fault1'))
  @s_fault1 = getGateLabel(inv.get('s_fault1'))
  @c_fault2 = getGateLabel(inv.get('c_fault2'))
  @s_fault2 = getGateLabel(inv.get('s_fault2'))
  @c_fault3 = getGateLabel(inv.get('c_fault3'))
  @s_fault3 = getGateLabel(inv.get('s_fault3'))
end

def getGateLabel(num)
  num ? DTSAssessmentUtil.getGateLabel(num) : '-'
end

### BEGIN CSV Related ###

def getCsvText
  t = ''
  t << getCsvHeader

  @indicatorMap = {}
  for indicator in $rubric.getIndicators
    @indicatorMap[indicator.getName] = indicator
  end 

  for user in @otrunkHelper.users
    assessment = @assessment.getLastAssessment(user)
    if assessment == nil 
      Util.error("Assessment not present for user [#{user.getName}]")
      next
    end
    getData(assessment)
    t << getCsvUserLine(user, assessment, $rubric)
  end
  t
end

def getCsvHeader
  t = ['Teacher', 'Class', 'First Name', 'Last Name', 'Activity Name'].join(@sep) + @sep
  
  t << 'Correct Truth Values' + @sep + 'Submitted Truth Values' + @sep
  3.times { |i|
    t << "Correct Fault #{i+1}" + @sep + "Submitted Fault #{i+1}" + @sep
  }

  for indicator in $rubric.getIndicators
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

  t << @c_truthValues + @sep + @s_truthValues + @sep
  t << @c_fault1 + @sep + @s_fault1 + @sep
  t << @c_fault2 + @sep + @s_fault2 + @sep
  t << @c_fault3 + @sep + @s_fault3 + @sep

  indicatorValues = assessment.getIndicatorValues

  for indicator in rubric.getIndicators
    name = indicator.getName
    t << RubricGradeUtil.getMaximumPoints(indicator).to_s + @sep
    t << @assessment.getIndicatorPoints(@indicatorMap[name], assessment, rubric).to_s + @sep
  end
  t << RubricGradeUtil.getTotalMaximumPoints(rubric).to_s + @sep
  t << RubricGradeUtil.getTotalGrade(assessment, rubric).getPoints.to_s + @newline
end

### END CSV Related ###
