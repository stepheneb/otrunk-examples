include_class 'org.concord.otrunk.ui.OTText'
include_class 'org.concord.otrunk.ui.question.OTQuestion'
include_class 'org.concord.otrunk.intrasession.util.IntrasessionHelper'
include_class 'org.concord.otrunk.intrasession.ui.panels.StudentWorkPanel'
include_class 'org.concord.otrunk.logging.LogHelper'
include_class 'org.concord.otrunk.logging.OTModelLogging'
include_class 'org.concord.otrunk.view.document.OTCompoundDoc'
include_class 'org.concord.otrunk.view.OTGroupListManager'
include_class 'org.concord.datagraph.log.DataGraphLogHelper'
include_class 'org.concord.datagraph.state.OTDataCollector'
include_class 'org.concord.datagraph.state.OTDataGraph'
include_class 'org.concord.datagraph.analysis.GraphAnalyzerProvider'
include_class 'org.concord.datagraph.ui.DataGraph'
include_class 'org.concord.otrunk.overlay.CompositeDatabase'
include_class 'org.concord.otrunk.overlay.OTUserOverlayManager'
include_class 'org.concord.otrunk.xml.XMLDatabase'
include_class 'org.concord.otrunk.intrasession.util.ExcelExporter'
include_class 'org.concord.datagraph.analysis.GraphSegment'

class Reportable
  def initialize(obj, questions, otrunk)
    @object = obj
    @questions = questions
    @otrunk = otrunk
    
    _setGraphReadOnly(@object) if @object.is_a?(OTDataGraph)
    _setGraphReadOnly(@object.input) if @object.is_a?(OTQuestion) && @object.input.is_a?(OTDataGraph)
  end
  
  def _setGraphReadOnly(graph)
    # make the graph read-only
    graph.setShowToolbar(false)
    graph.setShowGraphableList(false)
    graph.setGraphableListEditable(false)
    
#      if (! graph.getUseAspectRatio())
#          graph.setUseAspectRatio(true);
#          graph.setAspectRatio(StudentWorkPanel::DEFAULT_ASPECT_RATIO);
#          graph.setAspectDimension(DataGraph::AspectDimension::HEIGHT);
#      end
    
    if graph.is_a?(OTDataCollector)
      graph.setShowControlBar(false)
      graph.setMultipleGraphableEnabled(false)
      graph.setReadOnlyLabels(true)
    end
  end
  
  def object
    @object
  end

  def otrunk
    @otrunk
  end
  
  def questions
    @questions
  end

  def prompt
    return @questions.prompt(@object) if @object.is_a?(OTQuestion)
    return @object.getName
  end

  def correctAnswer
    return @questions.correctAnswerText(@object) if @object.is_a?(OTQuestion)
    return "N/A"
  end

  def answerHtml(user)
    return @questions.answerHtmlText(user, @object) if @object.is_a?(OTQuestion)
    return _getOTTextAnswer(@object, user) if @object.is_a?(OTText)
    return user ? embedUserObject(@object, user) : embedObject(@object)
  end

  def answerText(user)
    answerText = ""
    answerText = @questions.answerText(user, @object) if @object.is_a?(OTQuestion)
    answerText = _getOTTextAnswer(@object, user) if @object.is_a?(OTText)

    if answerText.nil? || answerText.empty? || answerText =~ /refid=/
      obj = (@object.is_a?(OTQuestion) ? @object.getInput : @object)
      answerText = ExcelExporter.getObjectFilename(user.nil? ? obj : @otrunk.getUserRuntimeObject(obj, user))
    end
    return answerText
  end
  
  def _getOTTextAnswer(obj, user)
    obj = @otrunk.getUserRuntimeObject(@object, user) unless user.nil?
    answerText = obj.nil? ? "" : obj.getText
    return answerText
  end

  def equals(other)
    self == other
  end
end

class ReportableMeta
  def initialize(reportable)
    @reportable = reportable
    @otrunk = reportable.otrunk
    @overlayManager = @otrunk.getService(OTUserOverlayManager.java_class)
    @groupListManager = @otrunk.getService(OTGroupListManager.java_class)
  end

  def object
    @reportable.object
  end

  def correctAnswer
    ""
  end

  def answerText(user)
    answerHtml(user)
  end

  def prompt
    "TBD"
  end

  def answerHtml(user)
    "TBD"
  end

  def equals(other)
    self == other
  end

  def _shouldIncludeOldEventLog?(userObj)
    if userObj.is_a?(OTDataCollector)
      if ! userObj.getEventLog.nil?
        if userObj.getEventLog.getItems.size() > 0
          return true
        end
      end
    end
    return false
  end
end

class ReportableSubmits < ReportableMeta
  def prompt
    "Submits:" #  + @reportable.prompt
  end

  def answerHtml(user)
    submits = AllSubmissions.new([@reportable], user)
    popupLinkToObject("#{_number(user)}", submits.document, nil, nil, false, user.getName() + " question history")
  end
  
  def answerText(user)
    "#{_number(user)}"
  end
  
  def _number(user)
    @numbers ||= {}
    return @numbers[user] if @numbers[user]
    @numbers[user] = IntrasessionHelper.getNumberOfSubmits(@overlayManager, @groupListManager.getIntrasessionUser(user), object)
    return @numbers[user]
  end
end

class ReportableCollects < ReportableMeta
  def prompt
    "Collects:" # + @reportable.prompt
  end

  def answerHtml(user)
    userObj = userObject(object, user)
    dgNum = 0
    if _shouldIncludeOldEventLog?(userObj)
      dgNum = DataGraphLogHelper.getNumCollections(userObj.getEventLog)
    end
    return "#{dgNum + LogHelper.getNumCollections(userObj)}"
  end
end

class ReportableTime < ReportableMeta
  def prompt
    "Time:" # + @reportable.prompt
  end

  def answerHtml(user)
    userObj = userObject(object, user)
    dgTime = 0
    if _shouldIncludeOldEventLog?(userObj)
      dgTime = DataGraphLogHelper.getTotalCollectionTime(userObj.getEventLog)
    end
    "#{OTrunkHelper.humanizeTime((dgTime + LogHelper.getTotalCollectionTime(userObj))/1000)}"
  end
end

class ReportableScore < ReportableMeta
  def prompt
    "Score:" #  + @reportable.prompt
  end

  def answerHtml(user)
    username = user ? "#{user.getName()} " : ""
    popupLinkToObject(answerText(user), _document(user), nil, nil, false, "#{username}graph score reasons")
  end
  
  def answerText(user)
    @scores ||= {}
    @scores[user] ||= ("%2.0f%%" % _score(user))
  end
  
  def _score(user)
    @results ||= {}
    @segments ||= {}

    @graph_service = GraphAnalyzerProvider.findAnalyzer(GraphAnalyzerProvider::Type::ANY)

    score = 0.0
    if object.getSource.getRubric.size() > 0 && ! @graph_service.nil?
      @expected = @graph_service.buildRubric(object.getSource.getRubric) unless @expected
    
      userObj = user ? userObject(object, user) : object
      graphable = userObj.getSource
    
      dataStore = graphable.getDataStore
      
      @segments[user] = @graph_service.getSegments(dataStore, 0, 1)
      @results[user] = @graph_service.compareGraphs(@expected, @segments[user])
      score = @results[user].score
      maxScore = @results[user].maxScore
      
      score = (score/maxScore)*100
    end
    return score
  end
  
  def _document(user)
    results = @results[user]
    historyDoc = otCreate(OTCompoundDoc) {|doc|  }
    historyDoc.bodyText = @graph_service.getHtmlReasons(results)
    return historyDoc
  end
end

class DefaultSubmission
  def timestamp
    ""
  end
  
  def answerText
    ""
  end
  
  def answerHtml
    ""
  end
  
  def reportableScore
    nil
  end
  
  def object
    nil
  end
end

class ReportableSubmission < DefaultSubmission
  def initialize(reportable, submissionReportable)
    @reportable = reportable
    @submissionReportable = submissionReportable

    @timestamp = IntrasessionHelper.getFormattedTimestamp(IntrasessionHelper.getSubmitTime(@submissionReportable.object))
    @reportableScore = ReportableScore.new(@submissionReportable) if @submissionReportable.object.is_a?(OTDataCollector) && @submissionReportable.object.source.rubric.size > 0
  end
  
  def object
    @submissionReportable.object
  end
  
  def submissionReportable
    @submissionReportable
  end
  
  def reportableScore
    @reportableScore
  end
  
  def timestamp
    @timestamp.to_s
  end

  def answerText
    @submissionReportable.answerText(nil)
  end
  
  def answerHtml
    @submissionReportable.answerHtml(nil)
  end
end

class ReportableSubmissions
  def initialize(reportable, user)
    @reportable = reportable
    @user = user
    @otrunk = @reportable.otrunk
    @overlayManager = @otrunk.getService(OTUserOverlayManager.java_class)
    @groupListManager = @otrunk.getService(OTGroupListManager.java_class)
    _initSubmissions
  end
  
  def reportable
    @reportable
  end
  
  def submissions
    return @submissions
  end
  
  def submission(i)
    @submissions.size > i ? @submissions[i] : DefaultSubmission.new
  end
  
  def _initSubmissions
    @submissions = []
    intraUser = @groupListManager.getIntrasessionUser(@user)
    if intraUser
      submissions = @overlayManager.getAllOTObjects(intraUser, @reportable.object)
      submissions.each do |s|
        rep = Reportable.new(s, @reportable.questions, @otrunk)
        @submissions << ReportableSubmission.new(@reportable, rep)
      end
    else
      puts "Couldn't find intrasession user for user: #{@user.getUserId}"
    end
  end
end

class AllSubmissions
  def initialize(reportables, user)
    @reportables = reportables
    @user = user
    if @reportables.size > 0
      @otrunk = reportables.first.otrunk
      @overlayManager = @otrunk.getService(OTUserOverlayManager.java_class)
      @groupListManager = @otrunk.getService(OTGroupListManager.java_class)
    end
    @csvText = ""
    _initReportableSubmissions
  end
  
  def document
    historyDoc = otCreate(OTCompoundDoc) do |doc|
    end
    historyDoc.bodyText = "<div style='min-width: #{@submissions.size * 400}px;'>\n" + table + csv + "\n</div>"
    return historyDoc
  end
  
  def table
    bodyText = "<table style='width: 100%;'><tr>"
    @submissions.each do |s|
      bodyText += "<th class='separator' style='width: 150px;'>Time</th><th style='width: 250px;'>#{s.reportable.prompt}</th><th>URL</th>"
      bodyText += "<th>Score</th>" if s.reportable.object.is_a?(OTDataCollector) && s.reportable.object.source.rubric.size > 0
    end
    bodyText += "</tr>\n"
    @mostSubmissions.times do |i|
      bodyText += "<tr class='#{_oddEven}'>"
      @submissions.each do |s|
        obj = s.submission(i).object
        score = s.submission(i).reportableScore
        answerHtml = s.submission(i).answerHtml
        if answerHtml =~ /refid=['"](.*?)['"]/
          @embeddedObjects ||= []
          obj = s.submission(i).object
          obj = obj.getInput if obj.is_a?(OTQuestion)
          @embeddedObjects << obj.getGlobalId.to_s.sub(/^%/,'')
        end
        bodyText += "<td class='separator' style='width: 150px;'>#{s.submission(i).timestamp}</td><td style='width: 250px;'>#{answerHtml}</td><td>#{(obj ? "#{@overlayManager.getOverlayURL(obj.getOTObjectService)}" : "")}</td>"
        bodyText += "<td>#{score ? score.answerHtml(nil) : ""}</td>" if s.reportable.object.is_a?(OTDataCollector) && s.reportable.object.source.rubric.size > 0
      end
      bodyText += "</tr>\n"
    end
    bodyText += "</table>\n"
    return bodyText
  end
  
  def csvValues
    rows = []
    headerRow = []
    @submissions.each do |s|
      headerRow += ["Time", s.reportable.prompt, "URL"]
      headerRow += ["Score"] if s.reportable.object.is_a?(OTDataCollector) && s.reportable.object.source.rubric.size > 0
    end
    rows << headerRow
        
    @mostSubmissions.times do |i|
      row = []
      @submissions.each do |s|
        obj = s.submission(i).object
        score = s.submission(i).reportableScore
        row += [s.submission(i).timestamp,s.submission(i).answerText, (obj ? "#{@overlayManager.getOverlayURL(obj.getOTObjectService)}" : "") ]
        row += [score ? score.answerText(nil) : ""] if s.reportable.object.is_a?(OTDataCollector) && s.reportable.object.source.rubric.size > 0
      end
      rows << row
    end
    return rows
  end
  
  def csv
    vals = csvValues
    bodyText = "<hr/>\n#{Exporter.new(@embeddedObjects, vals, 0, 1, @leftBorderColumns).embedExportButton}\n<div class='csvBlock'>\n<pre>\n"
    vals.each do |row|
      bodyText += row.map{|v| csvEscape(v) }.join(",") + "\n"
    end
    bodyText += "</pre>\n</div>"
    return bodyText
  end
  
  def _initReportableSubmissions
    @submissions = []
    @reportables.each do |rep|
      @submissions << ReportableSubmissions.new(rep, @user) if rep.kind_of?(Reportable)  # skip all ReportableMeta objects
    end
    @mostSubmissions = @submissions.sort{|a,b| a.submissions.size <=> b.submissions.size }.last.submissions.size
    
    @leftBorderColumns = []
    @submissions.size.times do |i|
      @leftBorderColumns << i*2
    end
  end
  
  @odd = false
  def _oddEven
    @odd = !@odd
    return @odd ? "odd" : "even"
  end
end

