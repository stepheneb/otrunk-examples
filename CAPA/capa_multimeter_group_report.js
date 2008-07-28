importClass(Packages.java.lang.System)
importClass(Packages.java.lang.StringBuffer)
importClass(Packages.org.concord.otrunk.capa.util.XHTMLTable)
importClass(Packages.org.concord.otrunk.capa.util.CSVTable)
importClass(Packages.org.concord.otrunkcapa.OTMultimeterAssessment)
importClass(Packages.org.concord.otrunkcapa.OTMultimeterAsessmentGradeUtil)
importClass(Packages.org.concord.otrunkcapa.rubric.RubricGradeUtil)

/*
 * Variables from Java:
 *   otRubric
 *   otSource
 */

// Store for calculation of stats, etc.
var s = {
	voltage : { lead : [], circuit : [], score : [] },
	current : { lead : [], circuit : [], score : [] },
	resistance : {lead : [], circuit : [], score : [] },
	total : [],
	time : [],
	blowUp : [],
	color : "#000000"
} 
 
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
	var indicatorMap = {}
	var indicators = rubrics[0].getIndicators() //assuming same set of indicators for rubrics 0..2
	for (var i = 0; i < indicators.size(); ++i) {
		var indicator = indicators.get(i)
		indicatorMap[indicator.getName()] = indicator
	}		
	
	return "<h3>CAPA Aggregate Report</h3>\n" +	getTableView(rubrics, labels, users, contentsMap, indicatorMap)
}

function getTableView(rubrics, labels, users, contentsMap, indicatorMap) {
	var b = new StringBuffer("")
	b.append("<table border=\"1\">\n")
	b.append("<tr><td></td><td colspan=\"3\">Voltage</td><td colspan=\"3\">Current</td><td colspan=\"3\">Resistance</td>")
	b.append("<td rowspan=\"2\">Total</td><td rowspan=\"2\">Time (s)</td><td rowspan=\"2\">Blown Meters</td></tr>")
	b.append("<tr><td></td><td>Leads</td><td>Circuit</td><td>Score</td><td>Leads</td><td>Circuit</td><td>Score</td><td>Leads</td><td>Circuit</td><td>Score</td>")
	for (var i = 0; i < users.size(); ++i) {
		var user = users.get(i)
		var uname = user.getName()
		var assessment = getAssessment(contentsMap.get(uname))
		if (assessment != null) {
			b.append(getUserLine(uname, assessment, rubrics, indicatorMap))
		}
	}
	b.append(getSummaryLine())
	b.append("</table>")
	return b.toString();
}

function getAssessment(contents) { 
	var gotAssessment = false
	var assessment = null
	
	for (var i = 0; i < contents.size(); ++i) {
		var content = contents.get(i)
		if (content instanceof OTMultimeterAssessment) {
			gotAssessment = true
			assessment = content 
		}
	}
	return assessment //get the last one for the user
}

function getUserLine(uname, assessment, rubrics, indicatorMap) {
	var b = new StringBuffer("<tr><td>" + uname + "</td>")
	subAssessments = assessment.getAnswers()
	
	var total_time = 0
	var total_blowup = 0
	
	for (var i = 0; i < subAssessments.size(); ++i) {
		var subAssessment = subAssessments.get(i)
		var rubric = rubrics[i]
		var indicatorValues = subAssessment.getIndicatorValues()
		
		var score = RubricGradeUtil.getTotalGrade(subAssessment, rubric).getPoints()
		total_time += parseFloat(indicatorValues.get("time"))
		total_blowup += parseInt(indicatorValues.get("brokenDMM"))

		var test = null;
		if (i == 0) { test = s.voltage; }
		else if (i == 1) { test = s.current; }
		else if (i == 2) { test = s.resistance; }
				
		var leadInd = parseInt(indicatorValues.get("leadPlacement"))
		test.lead.push(leadInd > 1 ? 1 : 0)
		
		var circuitInd = parseInt(indicatorValues.get("circuitSetting"))
		test.circuit.push(circuitInd > 0 ? 1 : 0)
		
		test.score.push(score)
			
		b.append("<td>" + getLabel(indicatorMap["leadPlacement"], subAssessment, rubric) + "</td>")
		b.append("<td>" + getLabel(indicatorMap["circuitSetting"], subAssessment, rubric) + "</td>")
		b.append("<td>" + score + "</td>")
	}

	var totalPoints = OTMultimeterAsessmentGradeUtil.getTotalGrade(assessment, otRubric).getPoints()
	
	s.total.push(totalPoints)
	s.time.push(total_time)
	s.blowUp.push(total_blowup)
	
	b.append("<td><font color=\"#2020f0\"><b>" +  totalPoints + "</b></font></td>")
	b.append("<td>" + total_time.toFixed(1) + "</td>")
	b.append("<td>" + total_blowup + "</td>")	
	
	return b.toString() + "</tr>\n"
}
function getLabel(indicator, assessment, rubric) {
	var indicatorGrade = RubricGradeUtil.getIndicatorGrade(assessment, indicator, rubric)
	return indicatorGrade.getOTIndicatorGrade().getLabel()
}

function getSummaryLine() {
	var b = new StringBuffer("<tr>")
	s.color = "#a030a0"
	b.append(ctd("<b>Average</b>"))
	b.append(ctd("<b>" + (avg(s.voltage.lead) * 100).toFixed(0) + "%</b>"))
	b.append(ctd("<b>" + (avg(s.voltage.circuit) * 100).toFixed(0) + "%</b>"))	
	b.append(ctd("<b>" + avg(s.voltage.score).toFixed(0) + "</b>"))		
	b.append(ctd("<b>" + (avg(s.current.lead) * 100).toFixed(0) + "%</b>"))	
	b.append(ctd("<b>" + (avg(s.current.circuit) * 100).toFixed(0) + "%</b>"))
	b.append(ctd("<b>" + avg(s.current.score).toFixed(0) + "</b>"))
	b.append(ctd("<b>" + (avg(s.resistance.lead) * 100).toFixed(0) + "%</b>"))		
	b.append(ctd("<b>" + (avg(s.resistance.circuit) * 100).toFixed(0) + "%</b>"))
	b.append(ctd("<b>" + avg(s.resistance.score).toFixed(0) + "</b>"))
	b.append(ctd("<b>" + avg(s.total).toFixed(0) + "</b>"))		
	b.append(ctd("<b>" + avg(s.time).toFixed(0) + "</b>"))			
	b.append(ctd("<b>" + avg(s.blowUp).toFixed(2) + "</b>"))		
	b.append("</tr>")
	return b.toString()
}

function ctd(text) {
	return "<td><font color=\"" + s.color + "\">" + text + "</font></td>" 
}

function avg(a) {
	var sum = 0
	for (var i = 0; i < a.length; ++i) {
		sum += a[i]
	}
	return a.length > 0 ? sum / a.length : 0
}
