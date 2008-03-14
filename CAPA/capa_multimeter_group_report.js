importClass(Packages.java.lang.System)
importClass(Packages.java.lang.StringBuffer)
importClass(Packages.org.concord.otrunk.capa.util.XHTMLTable)
importClass(Packages.org.concord.otrunk.capa.util.CSVTable)
importClass(Packages.org.concord.otrunkcapa.OTMultimeterAssessment)
importClass(Packages.org.concord.otrunkcapa.rubric.RubricGradeUtil)

/*
 * Variables from Java:
 *   otRubric
 *   otSource
 */
 
function init() {
	System.out.println("init()")
}

function save() {
	System.out.println("save()")
}

// Called from OTXHTMLScriptView
function getText() {
	var rubrics = []
	rubrics[0] = otRubric.getVoltageRubric()
	rubrics[1] = otRubric.getCurrentRubric()
	rubrics[2] = otRubric.getResistanceRubric()
	var labels = ["voltage", "current", "resistance"]
	var users = otSource.getUsers()
	var contentsMap = otSource.getContentsMap()		
	
	return "<h3>CAPA Aggregate Report</h3>\n" + 
		getTableView(rubrics, labels, users, contentsMap) + 
		"<h3>CSV</h3>\n<pre>\n" + 
		getCSView(rubrics, labels, users, contentsMap) + 
		"\n</pre>\n"
}

function getTableView(rubrics, labels, users, contentsMap) {
	var table = null
	var text = new StringBuffer()
	var header = new XHTMLTable()

	header.set("", 0, 0)
	header.set("", 0, 1)	
	var indicators = rubrics[0].getIndicators()

	var col = 2
	for (var i = 0; i < indicators.size(); ++i) {
		header.set("<b>" + indicators.get(i).getLabel() + "</b>", 0, col)
		++col
	}
	header.set("<b>Total</b>", 0, col)
	
	for (var i = 0; i < users.size(); ++i) {
		var assessmentPresent = false
		var user = users.get(i)
		var name = user.getName()			
		var contents = contentsMap.get(name)

		text.append("<h3>" + name + "</h3>\n")
		
		for (var j = 0; j < contents.size(); ++j) {
			var content = contents.get(j)
			if (content instanceof OTMultimeterAssessment) {
				assessmentPresent = true
				
				table = new XHTMLTable()
				table.set(header, 0, 0)
				var row = 1
				var assessmentObjects = content.getAnswers()
					
				for (var k = 0; k < assessmentObjects.size(); ++k) {
					var assessment = assessmentObjects.get(k)
					var rubric = rubrics[k]
					indicatorValues = assessment.getIndicatorValues()

					table.set(labels[k], row, 0, 3, 1)
					table.set("Indicator", row, 1)
					table.set("Label", row+1, 1)
					table.set("Points", row+2, 1)

					col = 2
					
					for (var m = 0; m < indicators.size(); ++m) { // for each indicator for the assessment
						var indicator = indicators.get(m)						
						var indicatorGrade = RubricGradeUtil.getIndicatorGrade(assessment, indicator, rubric)
						if (indicatorGrade == null) {
							table.set("NA", row, col)
							table.set("NA", row+1, col)
							table.set("NA", row+2, col)
						}
						else {
							table.set("" + indicatorValues.get(indicator.getName()), row, col)
							table.set("" + indicatorGrade.getOTIndicatorGrade().getLabel(), row+1, col)
							table.set("" + indicatorGrade.getPoints(), row+2, col)
						}
						++col
					}
					table.set("" + RubricGradeUtil.getTotalGrade(assessment, rubric).getPoints(), row+2, col)
					row += 3
				}
				text.append(table.getText())
			}
		}
		if (!assessmentPresent) {
			text.append(name + ": empty" + "<p/>\n")
		}
	}
	return text.toString()
}

function getCSView(rubrics, labels, users, contentsMap) {
	var header = new CSVTable()
	var table = new CSVTable()
	var row = 0;
	var col = 0;
	var indicators = rubrics[0].getIndicators() // same indicators for voltage, current, resistance
	var assessment = null
		
	header.set("Name", 0, 0)
	header.set("Type", 0, 1)	
	col = 2
	for (var i = 0; i < indicators.size(); ++i) {
		var indicator = indicators.get(i)
		header.set(indicator.getLabel(), row, col)
		header.set("Indicator", row, col+1)
		header.set("Points", row, col+2)
		col += 3
	}
	header.set("Total", row, col)
	
	table.set(header, 0, 0)
	++row
	
	for (var i = 0; i < users.size(); ++i) {
		var user = users.get(i)
		var name = user.getName()
		var contents = contentsMap.get(name)
			
		for (var j = 0; j < contents.size(); ++j) {
			var content = contents.get(j)
			
			if (content instanceof OTMultimeterAssessment) {
				var assessmentObjects = content.getAnswers();
				for (var k = 0; k < assessmentObjects.size(); ++k) {
					var assessment = assessmentObjects.get(k)
					var indicatorValues = assessment.getIndicatorValues()
					
					table.set(name, row, 0)
					table.set(labels[k], row, 1)
					col = 2
					
					for (var m = 0; m < indicators.size(); ++m) { // for each indicator for the assessment
						var indicator = indicators.get(m)						
						var indicatorGrade = RubricGradeUtil.getIndicatorGrade(assessment, indicator, rubrics[k]);
						if (indicatorGrade == null) {
							table.set("NA", row, col)
							table.set("NA", row, col+1)
							table.set("NA", row, col+2)
						}
						else {
							table.set(indicatorGrade.getOTIndicatorGrade().getLabel(), row, col)
							table.set("" + indicatorValues.get(indicator.getName()), row, col+1) 
							table.set("" + indicatorGrade.getPoints(), row, col+2)
						}
						col += 3
					}
					table.set("" + RubricGradeUtil.getTotalGrade(assessment, rubrics[k]).getPoints(), row, col)
					++row
				}
			}
		}
	}
	return table.getText();
}	

