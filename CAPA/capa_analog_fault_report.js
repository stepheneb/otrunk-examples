importClass(Packages.java.lang.System)
importClass(Packages.org.concord.otrunk.labview.AnalogDCUtil)
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
 	
	var c_fault1 = parseInt(inv.get("c_fault1"))
	var s_fault1 = parseInt(inv.get("s_fault1"))	
	var c_fault2 = parseInt(inv.get("c_fault2"))
	var s_fault2 = parseInt(inv.get("s_fault2"))	
	var c_fault3 = parseInt(inv.get("c_fault3"))
	var s_fault3 = parseInt(inv.get("s_fault3"))	
	var totalTime = parseFloat(inv.get("time"))
	var activityLog = inv.get("activityLog")
	var t = ""
	
	t += "<h2>Details</h2>"
	t += "<table><tr>"
	points = getPoints("fault1")
	t += "<td colspan=\"2\"><b>Fault #1</b> (" + points[1] + " points for correct answer)</td>"
	t += "</tr><tr>"
	t += "<td>Correct answer</td><td>" + AnalogDCUtil.getFaultLocationLabel(c_fault1) + "</td>"
	t += "</tr><tr>"
  	t += "<td>Submitted answer</td><td>" + AnalogDCUtil.getFaultLocationLabel(s_fault1) + "</td>"
  	t += "</tr>"
	t += getAnswerLine(c_fault1 == s_fault1, points[0], points[1])
	t += "<tr></tr><tr>"
  	
	points = getPoints("fault2")  	
	t += "<td colspan=\"2\"><b>Fault #2</b> (20 points for correct answer)</td>"
	t += "</tr><tr>"
	t += "<td>Correct answer</td><td>" + AnalogDCUtil.getFaultLocationLabel(c_fault2) + "</td>"
	t += "</tr><tr>"
  	t += "<td>Submitted answer</td><td>" + AnalogDCUtil.getFaultLocationLabel(s_fault2) + "</td>"
  	t += "</tr>"
	t += getAnswerLine(c_fault2 == s_fault2, points[0], points[1])	
	t += "<tr></tr><tr>"
	
	points = getPoints("fault3")  		
	t += "<td colspan=\"2\"><b>Fault #3</b> (20 points for correct answer)</td>"
	t += "</tr><tr>"
	t += "<td>Correct answer</td><td>" + AnalogDCUtil.getFaultLocationLabel(c_fault3) + "</td>"
	t += "</tr><tr>"
  	t += "<td>Submitted answer</td><td>" + AnalogDCUtil.getFaultLocationLabel(s_fault3) + "</td>"
  	t += "</tr>"
	t += getAnswerLine(c_fault3 == s_fault3, points[0], points[1])		
	t += "<tr></tr><tr>"

	pts = getPoints("timeTotal");
	t += "<td colspan=\"2\"><b>Time Taken</b> (10 points for minimal time) </td>"
	t += "</tr><tr>"	
  	t += "<td>" + getTimeStringFromSeconds(totalTime) + "</td><td>" + pts[0] + " points (out of " + pts[1] + ")</td>"
	t += "</tr></table>"
	
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
	if (s == 0) { return '0 seconds' }
	var minStr = min > 0 ? min + " minutes " : ""
	var secStr = sec == 0 ? "" : sec + " seconds"
	return minStr + secStr
}
