importClass(Packages.java.lang.System)
importClass(Packages.org.concord.otrunk.labview.DTSAssessmentUtil)
importClass(Packages.org.concord.otrunk.capa.util.AssessmentHelper)
importClass(Packages.org.concord.otrunkcapa.rubric.RubricGradeUtil)


// Variables from otml 
var ot_assessment
var ot_rubric
 
var green = "20b020"
var red = "b02020"

// Return text to include in the report
function getText() {
	var indicators = ot_assessment.getIndicatorValues()
 	var inv = ot_assessment.getInventory()
 	
	var c_truthValues = inv.get("c_truthValues")
	var s_truthValues = inv.get("s_truthValues")
	var c_fault1 = parseInt(inv.get("c_fault1"))
	var s_fault1 = parseInt(inv.get("s_fault1"))	
	var c_fault2 = parseInt(inv.get("c_fault2"))
	var s_fault2 = parseInt(inv.get("s_fault2"))	
	var c_fault3 = parseInt(inv.get("c_fault3"))
	var s_fault3 = parseInt(inv.get("s_fault3"))	
	var numUselessProbes = parseInt(indicators.get("uselessProbes"))								
	var numUsefulProbes = parseInt(indicators.get("usefulProbes"))
	var totalTime = inv.get("timeTotal")
	var activityLog = inv.get("activityLog")
	var t = ""
	var points = getPoints("truthTable")
	t += "<h2>Details</h2>"
	t += "<table><tr>"
	t += "<td colspan=\"2\"><b>Truth Table</b> (" + points[1] + " points for correct answer)</td>"
	t += "</tr><tr>"
	t += "<td>Correct value</td><td>" + c_truthValues + "</td>"
	t += "</tr><tr>"
	t += "<td>Submitted value</td><td>" + s_truthValues + "</td>"
	t += "</tr>"
	t += getAnswerLine(c_truthValues.equals(s_truthValues), points[0], points[1])
	t += "<tr></tr><tr>"
	
	points = getPoints("fault1")
	t += "<td colspan=\"2\"><b>Fault #1</b> (" + points[1] + " points for correct answer)</td>"
	t += "</tr><tr>"
	t += "<td>Correct answer</td><td>" + DTSAssessmentUtil.getGateLabel(c_fault1) + "</td>"
	t += "</tr><tr>"
  	t += "<td>Submitted answer</td><td>" + DTSAssessmentUtil.getGateLabel(s_fault1) + "</td>"
  	t += "</tr>"
	t += getAnswerLine(c_fault1 == s_fault1, points[0], points[1])
	t += "<tr></tr><tr>"
  	
	points = getPoints("fault2")  	
	t += "<td colspan=\"2\"><b>Fault #2</b> (20 points for correct answer)</td>"
	t += "</tr><tr>"
	t += "<td>Correct answer</td><td>" + DTSAssessmentUtil.getGateLabel(c_fault2) + "</td>"
	t += "</tr><tr>"
  	t += "<td>Submitted answer</td><td>" + DTSAssessmentUtil.getGateLabel(s_fault2) + "</td>"
  	t += "</tr>"
	t += getAnswerLine(c_fault2 == s_fault2, points[0], points[1])	
	t += "<tr></tr><tr>"
	
	points = getPoints("fault3")  		
	t += "<td colspan=\"2\"><b>Fault #3</b> (20 points for correct answer)</td>"
	t += "</tr><tr>"
	t += "<td>Correct answer</td><td>" + DTSAssessmentUtil.getGateLabel(c_fault3) + "</td>"
	t += "</tr><tr>"
  	t += "<td>Submitted answer</td><td>" + DTSAssessmentUtil.getGateLabel(s_fault3) + "</td>"
  	t += "</tr>"
	t += getAnswerLine(c_fault3 == s_fault3, points[0], points[1])		
	t += "<tr></tr><tr>"
	
	t += "<td colspan=\"2\"><nobr><b>Number of useless<sup><font color=\"009000\">*</font></sup> probes</b> (10 points for minimal number)</nobr></td>"
	t += "</tr><tr>"
	var pts = getPoints("uselessProbes")
	t += "<td>" + numUselessProbes + "</td><td>" + pts[0].toFixed(0) + " points (out of " + pts[1] + ")</td>"
	t += "</tr><tr></tr><tr>"
			
	t += "<td colspan=\"2\"><nobr><b>Number of useful<sup><font color=\"009000\">**</font></sup> probes</b> (10 points for minimal number)</nobr></td>"
	t += "</tr><tr>"
	pts = getPoints("usefulProbes")
	t += "<td>" + numUsefulProbes + "</td><td>" + pts[0].toFixed(0) + " points (out of " + pts[1] + ")</td>"
	t += "</tr><tr></tr><tr>"	
	
	t += "<td colspan=\"2\"><b>Time Taken</b> (10 points for minimal time) </td>"
	t += "</tr><tr>"	
	pts = getPoints("timeTotal");
  	t += "<td>" + getTimeStringFromSeconds(totalTime) + "</td><td>" + pts[0] + " points (out of " + pts[1] + ")</td>"
	t += "</tr></table>"
	
	t += "<font color=\"009000\">"
	t += "<p><b>* </b> A probe measurement is useless if the inputs are set so that the circuit is functioning properly.<br/>"
	t += "<b>**</b> A probe measurement is useful if the inputs are set so that the circuit is malfunctioning.</p>"
	t += "</font>"	
	
	t += "<p/>---------- "			
	t += " The information below this line is only for debugging purpose "
	t += "----------<br/><pre>"		
	t += activityLog
	t += "</pre>"
	
	return t
}

function getAnswerLine(correct, points, maxPoints) {
	var word
	var color
	
	if (correct) {
	 	word = "Correct!"
	 	color = green
	}
	else {
		word = "Incorrect"
		color = red
	}
	return "<tr><td><font color=\"" + color + "\">" + word + "</font></td><td>" + points + " points (out of " + maxPoints + ")</td></tr>"
}

function getPoints(indicatorName) {
	var indicator = AssessmentHelper.getIndicatorByName(ot_rubric, indicatorName)	
	var grade = RubricGradeUtil.getIndicatorGrade(ot_assessment, indicator, ot_rubric)
	return [grade.getPoints(), RubricGradeUtil.getMaximumPoints(indicator)]
}

function getTimeStringFromSeconds(s) {
	var min = parseInt(s / 60)
	var sec = s % 60
	return "" + min + " minutes " + sec + " seconds"
}
