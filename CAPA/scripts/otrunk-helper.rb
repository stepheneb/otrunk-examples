require 'jruby'
require 'erb'

include_class 'java.lang.System'

include_class 'org.concord.framework.otrunk.OTrunk'
include_class 'org.concord.framework.otrunk.view.OTUserListService'
include_class 'org.concord.framework.otrunk.wrapper.OTObjectSet'
include_class 'org.concord.framework.otrunk.wrapper.OTString'
include_class 'org.concord.otrunk.script.ui.OTScriptVariable'
include_class 'org.concord.otrunk.ui.OTText'

## OTrunk related routines
class OTrunkHelper

  MC_SINGLE_REPORT = 1 #Individual report for multi-choice test
  MC_GROUP_REPORT = 2  #Group report for multi-choice test 
  PF_SINGLE_REPORT = 3 #Individual report for performance assessment
  PF_GROUP_REPORT = 4  #Group report for performance assessment

  def initialize(task)
    @users = nil
    @scriptObjectContentsMap = nil
    @questions = nil

    @task = task 
    _sanityCheck

    @otrunk = $viewContext.getViewService(OTrunk.java_class)
  end
  
  ## Return root of the main OTML
  def rootObject
    @otrunk.getRoot
  end

  ## For reports, return the root of the OTML that it is reporting for
  def activityRoot
    return case @task
      when MC_SINGLE_REPORT 
        $unit
      when MC_GROUP_REPORT, PF_GROUP_REPORT 
        rootObject.reportTemplate.reference
      else 
        nil
      end
  end

  ## Return runtime user object
  def userObject(obj, user)
    @otrunk.getUserRuntimeObject(obj, user)
  end

  ## Return list of OTUsers
  def users
    unless @users
      userListService = $viewContext.getViewService(OTUserListService.java_class)
      @users = userListService.getUserList().sort_by { |user| #sort users by name
        (user.name && !user.name.empty?) ? user.name.downcase.split.values_at(-1, 0) : ['']    
      }
    end
    @users
  end

  def hasUserModified(obj, user)
    @otrunk.hasUserModified(obj, user)
  end

  def teacherName
    name = System.getProperty('report.teacher.name')
    (name == nil) ? 'Unknown' : name
  end

  def className
    name = System.getProperty('report.class.name')
    (name == nil) ? 'Unknown' : name
  end

  def activityName
    name = System.getProperty('report.activity.name')
    (name == nil) ? 'Unknown' : name
  end

  ## @scriptObjectContentsMap is a hash where a key is an OTUser object
  ## and a value is a Vector of objects (possibly of OTAssessment type) for the user 
  def scriptObjectContentsMap
    unless @scriptObjectContentsMap
      contentsMap = {} #{ userObject => contentsList } 
      users.each { |u| contentsMap[u] = userObject($scriptObject, u).getContents }
      @scriptObjectContentsMap = contentsMap
    end
    @scriptObjectContentsMap
  end

  ## Get last item in user script object contents that is a sub-type of contentType 
  def getLastContent(user, contentType)
    last = nil
    for content in scriptObjectContentsMap[user] 
      last = content if content.kind_of?(contentType) 
    end
    last
  end

  def otCreate(rconstant, &block)
    otObj = $otObjectService.createObject(rconstant.java_class)
    yield otObj
    otObj
  end

  def getQuestions
    unless @questions
      @questions = case @task
                   when MC_SINGLE_REPORT, MC_GROUP_REPORT
                     _getQuestionsThruDocRefs
                   when PF_SINGLE_REPORT, PF_GROUP_REPORT
                     _getQuestionsThruScriptObject
                   else
                     Util.error("Invalid @task value #{@task}")
                     nil 
                   end
    end
    @questions
  end

 private

  def _sanityCheck
    _varCheck($otObjectService, '$otObjectService')
    _varCheck($viewContext, '$viewContext')
    case @task
    when MC_SINGLE_REPORT
      _varCheck($unit, '$unit')
    when MC_GROUP_REPORT
    when PF_SINGLE_REPORT, PF_GROUP_REPORT
      _varCheck($scriptObject, '$scriptObject')
      _varCheck($rubric, '$rubric')
    else
      Util.error("Invalid @task value #{@task}")
    end
  end

  def _varCheck(v, name)
    if defined?(v)
      Util.error("#{name} is nil") unless v
    else
      Util.error("#{name} not defined")
    end
  end

  ## Multiple choice tests follow the UDL convention and 
  ## holds the questions as document refs
  def _getQuestionsThruDocRefs
    questions = []
    cards = activityRoot.getActivity.getContent.getCards

    ## Kludge to take care of OTDataTables of pre-OTQuestion era
    dtCount = 0
    dtCorrectAnswers = ['0,0,0,1', '0,1,1,1', '1,0', '1,0,1,0,0,0,1,0',
      '4,1,3,2']
    tCount = 0
    tQuestion = nil
    tInput = nil
    tCorrect = nil

    for doc in cards
      refs = doc.getDocumentRefs
      for ref in refs
        if ref.is_a?(OTQuestion) 
          questions << ref
        elsif ref.is_a?(OTDataTable)
          ## Kludge for old format (WSU) digital circuit multi-choice
          question = $otObjectService.createObject(OTQuestion.java_class)
          question.setInput(ref)
          text = $otObjectService.createObject(OTText.java_class)
          text.setText(dtCorrectAnswers[dtCount])
          question.setCorrectAnswer(text)
          questions << question
          dtCount += 1
        elsif ref.is_a?(OTText)
          ## Kludge for old format (WSU) digital circuit multi-choice(last question)
          if tCount == 0
            tQuestion = $otObjectService.createObject(OTQuestion.java_class)
            tInput = $otObjectService.createObject(OTObjectSet.java_class)
            tCorrect = $otObjectService.createObject(OTText.java_class)
            tCorrect.setText('4,1,3,2')
            tQuestion.setCorrectAnswer(tCorrect)
          end
          tInput.objects.add(ref)
          if tCount == 3
            tQuestion.setInput(tInput)
            questions << tQuestion
          end
          tCount += 1
        end
      end
    end
    questions
  end

  ## Performance assessments has user data in the script object
  def _getQuestionsThruScriptObject
    questions = []
    variables = $scriptObject.getVariables
    for v in variables
      questions << v.getReference if v.getReference.is_a? OTQuestion
    end
    questions
  end

end
