require 'jruby'
require 'erb'

include_class 'java.lang.System'
include_class 'org.concord.framework.otrunk.view.OTUserListService'
include_class 'org.concord.framework.otrunk.OTrunk'
include_class 'org.concord.framework.otrunk.wrapper.OTString'
include_class 'org.concord.otrunk.ui.OTText'
include_class 'org.concord.otrunk.ui.question.OTQuestion'
include_class 'org.concord.otrunk.script.ui.OTScriptVariable'
include_class 'org.concord.otrunkcapa.OTMultimeterAssessment'
include_class 'org.concord.otrunkcapa.OTMultimeterAsessmentGradeUtil'
include_class 'org.concord.otrunkcapa.rubric.OTAssessment'
include_class 'org.concord.otrunkcapa.rubric.RubricGradeUtil'

### BEGIN View/Controller Stuff ###

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
  @otrunk = $viewContext.getViewService(OTrunk.java_class)
  @users = _retrieveUsers
  @contentsMap = _createContentsMap
  @questions = _getQuestions
  @sep = '|' #field separator in csv text 
  @newline = "\n"
end

def default_template
  render $template
end

def render(templateBlob)
  erb = ERB.new Java::JavaLang::String.new(templateBlob.src).to_s
  erb.result(binding)   
end 

def embedObject(obj)
  "<object refid=\"#{obj.otExternalId()}\"/>"
end

def embedUserObject(obj, user)
  "<object refid=\"#{obj.otExternalId()}\" user=\"#{user.getUserId().toExternalForm()}\"/>"
end

def linkToObject(link_text, obj, viewEntry=nil)
  link = "<a href=\"#{obj.otExternalId()}\" "
  link += "viewid=\"#{viewEntry.otExternalId()}\" "  if viewEntry
  link += ">#{link_text}</a>"
end

def linkToObjectAction(link_text, obj, action)
  viewEntryCopy = $otObjectService.copyObject($viewEntry, 1)
  viewEntryCopy.variables.add(otCreate(OTScriptVariable){|scriptVar|
    scriptVar.name="action"
    scriptVar.reference = otCreate(OTString){|str|
      str.string=action
    }
  })
  "<a href=\"#{obj.otExternalId()}\" viewid=\"#{viewEntryCopy.otExternalId()}\">#{link_text}</a>"
end

def popupLinkToObject(link_text, obj, viewEntry=nil)
  link = "<a href=\"#{ obj.otExternalId() }\" "
  link += "viewid=\"#{ viewEntry.otExternalId() }\" "  if viewEntry
  link += " target=\"#{ popupFrame.otExternalId }\">#{link_text}</a>"  
end

def linkToUnitPage(link_text)
  firstObject = rootObject.reportTemplate
  firstView = rootObject.reportTemplateViewEntry
  linkToObject link_text, firstObject, firstView
end

def popupFrame
  return @frame if @frame 
  
  @frame = otCreate(org.concord.framework.otrunk.view.OTFrame) { |frame| }
end

### END View/Controller Stuff ###

### BEGIN OTrunk/Data Utilities ###

def otCreate(rconstant, &block)
  otObj = $otObjectService.createObject(rconstant.java_class)
  yield otObj
  otObj
end

def rootObject
  @otrunk.root
end

def userObject(obj, user)
  @otrunk.getUserRuntimeObject(obj, user);
end

def users
  @users
end

def hasUserModified(obj, user)
  @otrunk.hasUserModified(obj, user)
end

def findFirstChild(rconstant, startObject)
  # check if the startObject is one of theses
  # if not go through all of its children objects
  # perhaps we should just do this in java
end

def teacherName
  name = System.getProperty("report.teacher.name")
  if name == nil
    return 'Unknown'
  end
  name
end

def className
  name = System.getProperty("report.class.name")
  if name == nil
    return 'Unknown'
  end
  name
end

## @contentsMap is a hash where a key is an OTUser object
## and a value is a Vector of objects (possibly of OTAssessment type) for the user 
def contentsMap
  @contentsMap
end

def _retrieveUsers
  userListService = $viewContext.getViewService(OTUserListService.java_class)
  return userListService.getUserList().sort_by { |user| #sort users by name
    (user.name && !user.name.empty?) ? user.name.downcase.split.values_at(-1, 0) : ['']    
  }
end

def _createContentsMap
  contentsMap = {} #{ userObject => contentsList } 
  # users is a Java vector returned by OTUserListService.getUserList 
  # Ruby presents Java vectors as enumerables. This means you can use
  # any of the methods that Ruby's Enumerable module mixes in.
  users.each { |u| contentsMap[u] = @otrunk.getUserRuntimeObject($scriptObject, u).getContents.getVector }
  contentsMap
end

### END OTrunk/Data Utilities ###

### BEGIN Assessment Related ### 

def getLastAssessment(user)
  getLastContent(user, OTAssessment)
end

def getLastMultimeterAssessment(user)
  getLastContent(user, OTMultimeterAssessment)
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

### END Assessment Related ### 

### BEGIN CSV Related ###

def csvGetText
  t = ''
  t << csvGetHeader
  
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
      error("Assessment not present for user [#{user.getName}]")
      next
    end
    t << user.getName + @sep
    t << csvRubricLineSegment(user, $rubric.getVoltageRubric, assessments[0])
    t << csvRubricLineSegment(user, $rubric.getCurrentRubric, assessments[1])
    t << csvRubricLineSegment(user, $rubric.getResistanceRubric, assessments[2])    
    t << @newline
  end
  return t
end 
  
def csvGetHeader
  indicators = $rubric.getVoltageRubric.getIndicators.getVector
  t = ''
  t << @sep + 'Voltage' + @sep * indicators.size + 'Current'
  t << @sep * indicators.size + 'Resistance' + @newline
  t << 'Student Name' + @sep
  3.times {
    for indicator in indicators
      t << indicator.getName + @sep  
    end 
  }
  t << @newline
end

def csvRubricLineSegment(user, rubric, assessment)
  indicators = rubric.getIndicators.getVector
  indicatorValues = assessment.getIndicatorValues
  t = ''
  for indicator in indicators
    name = indicator.getName
    t << getIndicatorLabel(@indicatorMap[name], assessment, rubric) + @sep
    t << indicatorValues.get(name).to_s + @sep
    t << getIndicatorPoints(@indicatorMap[name], assessment, rubric).to_s + @sep
  end
  return t        
end

### END CSV Related ###

### BEGIN Misc. Utilities ###

def avg(list)
  list.inject(0) { |sum, e| sum + e } / list.length.to_f
end

def checkType?(obj, klass)
  return true if obj.is_a? klass
  
  error "obj is a #{obj.java_class} instead of being a #{klass.java_class.name}"
  false
end

def truncate (string, length)
  postFix = ""
  postFix = "..." if string.length > length
  string[0...length] + postFix
end

def error(message)
  System.err.println('capa-report.rb:' + message)
end

def log(message)
  System.out.println('capa-report.rb:' + message)
end

### END Misc. Utilities ###
 