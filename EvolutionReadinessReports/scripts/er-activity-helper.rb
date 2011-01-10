require 'jruby'
require 'rexml/document'

include_class 'org.concord.otrunk.udl.UDLContentHelper'

class ERActivityHelper
  
  def initialize(rootObject, otrunkHelper)
    @root = rootObject
    @otrunk = otrunkHelper
    @contentHelper = UDLContentHelper.getUDLContentHelper(@root)
    puts "@contentHelper=#{@contentHelper}"
  end
  
  ## Title of activity
  def title
    header = REXML::Document.new(@root.activity.header.bodyText)
    titleDiv = REXML::XPath.first(header, "//div[@class='title']")
    if titleDiv.text == nil || titleDiv.text.strip.length < 1
    	@root.activity.header.documentRefs.each do | ref |
	      if ref.is_a? org.concord.otrunk.udl.document.OTUDLCompoundDoc
	      	titleText = ref.bodyText.strip
	      end
	    end
	    titleText
    else
    	titleDiv.text.strip
    end
  end
  
  def activity
    return @root.activity
  end
  
  def sectionQuestions(section)
    questions = []
      
    return questions unless section.content.is_a? org.concord.otrunk.ui.OTCardContainer
    pageCards = allPages(section)
    pageCards.each do | doc |
      questions.concat documentQuestions(doc)
    end
  
    questions
  end
  
  def sectionLeveledQuestions(section)
    questions = []
      
    return questions unless section.content.is_a? org.concord.otrunk.ui.OTCardContainer
    
    pageCards = allPages(section)
  
    pageCards.each do | doc |
      questions.concat documentLeveledQuestions(doc)
    end
  
    questions
  end
  
  
  # Very quick way of getting back any question in this section that
  # has a specific uuid
  def sectionQuestionsForIds(section, otids)
    questions = []
    
    return questions unless section.content.is_a? org.concord.otrunk.ui.OTCardContainer
            
    return sectionQuestions(section) if otids.empty? 
    
    pageCards = allPages(section)
  
    pageCards.each do | doc |
      questions.concat documentQuestionsForIds(doc, otids)
    end
  
    questions
  end
  
  def documentQuestions(doc)
    if @contentHelper.version == 1
      v = @contentHelper.getDocumentQuestions(doc)
      ret = []
      for e in v do 
        ret << e
      end
      return ret
    end
    questions = []
    
    doc.documentRefs.each do | ref |
      questions << ref if ref.is_a? org.concord.otrunk.ui.question.OTQuestion
    end
  
    questions
  end
  
  def documentLeveledQuestions(doc)
    questions = []
    
    doc.documentRefs.each do | ref |
      questions << ref if ref.is_a? org.concord.otrunk.udl.question.OTUDLLeveledQuestions
    end
  
    questions  
  end
  
  def documentQuestionsForIds(doc, otids)
    if @contentHelper.version == 1
      v = @contentHelper.getDocumentQuestions(doc)
      ret = []
      for e in v do 
        ret << e
      end
      return ret
    end
    questions = []
    
    objService = doc.oTObjectService
    
    doc.documentRefs.each do | ref |
      if ref.is_a? org.concord.otrunk.udl.question.OTUDLQuestion
        otid = objService.getExternalID(ref)
        questions << ref unless otids.index(otid) == nil 
      end
    end
    
    questions  
  end

  #############################
  ###  UDL Specific
  #############################
  
  def linkToUnitPage(link_text)
    firstObject = rootObject.reportTemplate
    firstView = rootObject.reportTemplateViewEntry
    linkToObject link_text, firstObject, firstView
  end
  
  def unitTitle
    return @contentHelper.unitTitle
  end
  
  def sectionsContainer
    return @contentHelper.sectionsContainer
  end
  
  def unitSections
    sectionsContainer.cards.vector.select { |section|
      not "Home".eql? section.name
    }
  end
  
  def unitActivities
    unitSections.select do |section|
      not section.isPretest and not section.isPosttest
    end
  end
  
  def activitySections
    sectionsContainer.cards.vector
  end
  
  def visitedSections(user)
    userSectionContainer = @otrunkHelper.userObject(sectionsContainer, user)
    userSectionContainer.viewedCards.vector
  end
  
  # @param question: OTUDLQuesiton
  # @return comma separated string showing activity reference indices
  #         e.g. "0,3,6"  means the question is related to activity 0, 3, and 6 
  def activityRefString(question)
    activityIndexList = []
    question.getActivityReferences.getVector.each do |reference|
      activitySections.size.times do |i|
        if activitySections[i].otExternalId == reference.getReferencedObject.otExternalId
          activityIndexList << i      
        end
      end
    end
    activityIndexList.join(',')  
  end
  
  def allPages(section)
    allPagesForCardContainer(section.content)
  end
  
  def allPagesForCardContainer(cardContainer)
    pages = cardContainer.cards.vector
    innerPages = []
    pages.each do |page|
      page.documentRefs.each do | ref |
        if ref.is_a? org.concord.otrunk.ui.OTCardContainer
          innerPages.concat vectorToArray(allPagesForCardContainer(ref))
        end
      end
    end
    allPages = vectorToArray(pages).concat innerPages
  end
  
  def vectorToArray(vector)
    array = []
    vector.each do |i|
      array << i
    end
    array
  end
  
  # takes an authored section
  def relatedQuestions(section)
    relQuestions = []
  
    questions = sectionQuestions(pretest())
    questions.each do |question|
      question.getActivityReferences.getVector.each do |reference|
        if section.equals(reference.getReferencedObject)
          relQuestions << question
          break
        end
      end
    end
    
    relQuestions
  end  
  
  def pretest
    activitySections().each do |section|
      return section if section.getIsPretest()
    end
  end
  
  ###################
  ### models
  ###################
  def sectionModels(section)
    models = []
      
    return models unless section.content.is_a? org.concord.otrunk.ui.OTCardContainer
    pageCards = allPages(section)
    pageCards.each do | doc |
      models.concat documentModels(doc)
    end
  
    models
  end
  
  def documentModels(doc)
    models = []
    doc.documentRefs.each do | ref |
      models << ref if ref.is_a? org.concord.otrunk.biologica.environment.OTEnvironmentHolder
    end
  
    models  
  end
  
  ###################
  ### section view
  ###################
  def sectionTitle
    return $model.name
  end
  
  def basicSectionQuestions
    return sectionQuestions($model)
  end
  
  def preOrPost?
    title = sectionTitle.downcase
    title == "pre-test" or title == "post-test"
  end
  
  ###################
  ### glossary view
  ###################
  def glossaryWords
    if @contentHelper.version == 3
      return @contentHelper.getGlossaryWords
    end
  end
  
  def userGlossaryWords(user)
    if @contentHelper.version == 3
      return @contentHelper.getGlossaryWords($viewContext, user)
    end
  end
  
  def glossaryCount(user)
    glossary = @contentHelper.glossary()
    userGlossary = userObject(glossary, user)
    userGlossary.clickCount
  end
  
  def glossaryTime(user)
    glossary = @contentHelper.glossary()
    userGlossary = userObject(glossary, user)
    userGlossary.totalTimeOpenMs
  end
  
  ###################
  ### tts view
  ###################
  def ttsInstances(section, user)
    userSection = userObject(section, user)
    userPages = allPages(userSection)
    ttsCount = 0
    userPages.each do |page|
      if page.is_a? org.concord.otrunk.udl.document.OTUDLCompoundDoc
        ttsCount += page.timesTTSProduced
      end
    end
    ttsCount
  end

end
