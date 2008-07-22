// Holder for answers
var answers =  {
	c_fault1 : 0, //correct location of fault #1
	s_fault1 : 0, // submitted location of fault #1
	c_fault2 : 0, // correct location of fault #2	
	s_fault2 : 0, // submitted location of fault #2
	c_fault3 : 0, // correct location of fault #3	
	s_fault3 : 0, // submitted location of fault #3
	s_truthValues : "", // submitted answer to truth table question
	c_truthValues : "10100100", // correct answer to truth table question
	numHiddenProbes : 0, // number of useless probes
	numEvidentProbes : 0, // number of useful probes
	numChanges : 0, // number of changes (input switch flips + probes)
	time : 0 // total time taken
}

// Maps used to interpret the data from the LabVIEW VI
// fault: a number that identifies a fault
// gate: a number that identifies a gate
// For example, if fault id is 1, we can find by faultToGate[1] = 3 that gate 3 is faulty,
// then by looking up gateToLabel[3] find that it means inverter U1C.
var viMap = {
	gateToLabel : [
		"No answer", "Inverter U1A", "Inverter U1B", "Inverter U1C", "AND gate U2A", "AND gate U2B", 
		"AND gate U3B", "OR gate U3A", "OR gate U3B", "No faults"		
	],
	probeMap : [ "No Connection", "U1A Input", "U1A Output", "U1B Input", "U1B Output",
		"U1C Input", "U1C Output", "U1 Ground", "U1 VCC", "U2A Input1",
		"U2A Input 2", "U2A Input 3", "U2A Output", "U2B Input 1", "U2B Input 2",
		"U2B Input 3", "U2B Output", "U2C Input 1", "U2C Input 2", "U2C Input 3",
		"U2C Output", "U2 Ground", "U2 VCC", "U3A Input 1", "U3A Input 2",
		"U3A Output", "U3B Input 1", "U3B Input 2", "U3B Output", "U3 Ground",
		"U3 VCC"
	],
}

/**
 * This function mut be called AFTER the LabVIEW has exited, and AFTER validateAnswers().
 */
function assess(assessment, madWrapper) {
	p("ENTER: assess()")

	processUserEvents(madWrapper)
	answers.c_fault1 = parseInt(madWrapper.getLastCIValue("faultLocation1")) 
	answers.s_fault1 = parseInt(madWrapper.getLastCIValue("answer1")) 
	answers.c_fault2 = parseInt(madWrapper.getLastCIValue("faultLocation2"))
	answers.s_fault2 = parseInt(madWrapper.getLastCIValue("answer2")) 
	answers.c_fault3 = parseInt(madWrapper.getLastCIValue("faultLocation3"))
	answers.s_fault3 = parseInt(madWrapper.getLastCIValue("answer3")) 
	answers.time = madWrapper.getTimeTotal()
	
	var ttInd = parseInt(madWrapper.getLastCIValue("truthTableCorrect"))
	var faultInd1 = answers.c_fault1 == answers.s_fault1 ? 1 : 0
	var faultInd2 = answers.c_fault2 == answers.s_fault2 ? 1 : 0
	var faultInd3 = answers.c_fault3 == answers.s_fault3 ? 1 : 0	
	//var numProbesInd = getNumProbesIndicator(madWrapper, faultInd1, faultInd2, faultInd3, answers.numChanges)
	var timeInd = getTimeIndicator(answers.time, ttInd, faultInd1, faultInd2, faultInd3)
	
	var indicators = assessment.getIndicatorValues()
	indicators.put("truthTable", ttInd)
	indicators.put("fault1", faultInd1)
	indicators.put("fault2", faultInd2)	
	indicators.put("fault3", faultInd3)		
	indicators.put("uselessProbes", answers.numHiddenProbes)
	indicators.put("usefulProbes", answers.numEvidentProbes)
	indicators.put("timeTotal", timeInd)
}

function processUserEvents(madWrapper) {
	var savedA = null
	var savedB = null
	var savedC = null
	
	// evident: true if the output of the circuit agrees with the truth table 
	// of a non-faulty circuit 
	var evident = false 
	
	var a = parseInt(madWrapper.getInitialCIValue("A")) //input switch A
	var b = parseInt(madWrapper.getInitialCIValue("B")) //input switch B
	var c = parseInt(madWrapper.getInitialCIValue("C")) //input switch C
	var y = parseInt(madWrapper.getInitialCIValue("output")) //circuit output (LED)
	var evident = isEvident(a, b, c, y)
	
	glob.activityLog += "Fault 1: Initial switch setting: A=" + a + " B=" + b + " C=" + c + " Y=" + y + "\n"

	var fault2Start = -1
	var fault3Start = -1
	
	var steps = madWrapper.getSortedCIVs("step")
	for (i = 0; i < steps.size(); ++i) {
		var step = parseInt(steps.get(i).getValue())
		var t = steps.get(i).getTime()
		switch (step) {
			case 1: fault2Start = t; break;
			case 2: fault3Start = t; break;
		}
	}
	
	var civs = madWrapper.getSortedCIVs()
	var wasUserEvent = true

	var fault = 1 
		
	for (var i = 0; i < civs.size(); ++i) {
		var civ = civs.get(i)
		var name = civ.getName()
		var value = civ.getValue()		
		var timeString = glob.dateFormat.format(new Date(civ.getTime()))
		var nearFault2Start = Math.abs(civ.getTime() - fault2Start) < 100
		var nearFault3Start = Math.abs(civ.getTime() - fault3Start) < 100 		
		var isUserEvent =  (nearFault2Start || nearFault3Start) ? false : true
		var isSwitchEvent = name == "A" || name == "B" || name == "C"
		
		if (name.equals("step")) {
			fault = parseInt(value) + 1
		}
		
		if (isSwitchEvent) {
			if (name == "A") { a = value }
			else if (name == "B") { b = value }
			else if (name == "C") { c = value }
		}
		
		if (name == "output") {
			y = parseInt(value);
		}
		
		evident = isEvident(a, b, c, y)
		
		if (isUserEvent) {
			if (wasUserEvent == false) {
				glob.activityLog += "Fault " + fault + ": initial switch setting: A=" + savedA + " B=" + savedB + " C=" + savedC + " Y=" + y + "\n"				
			}
			if (isSwitchEvent) {
				glob.activityLog += timeString + " - Input " + name + " flipped to " + value + " (A=" + a + " B=" + b + " C=" + c + " Y=" + y + ")\n"
				++ answers.numChanges
			}
			else if (name == "probeLocation") {
				var ev = evident ? "(evident)" : "(hidden)"
				glob.activityLog += timeString + " - Probed [" + 
					viMap.probeMap[parseInt(value)] + "] " + ev + " \n"
				++ answers.numChanges						
				if (evident) {
					++ answers.numEvidentProbes
				}
				else {
					++ answers.numHiddenProbes
				}					
			}
		}
		else {
			savedA = a
			savedB = b
			savedC = c
		}			
		wasUserEvent = isUserEvent
	}
}

function isEvident(a, b, c, y) {
	var x = -1
	
	if (a == 0) {
		if (b == 0) {
			if (c == 0) { x = 1 } //000
			else { x = 0 } //001
		}
		else {
			if (c == 0) { x = 1 } // 010
			else { x = 0 } // 011
		}
	}
	else {
		if (b == 0) {
			if (c == 0) { x = 0 } // 100
			else { x = 1 } // 101
		}
		else {
			if (c == 0) { x = 0 } // 110
			else { x = 0 } // 111
		}
	}
	return x != y
}

function getTimeIndicator(timeTotal, ttInd, faultInd1, faultInd2, faultInd3) {
	if (ttInd == 0 && faultInd1 == 0 && faultInd2 == 0 && faultInd3 == 0) {
		return 0
	}
	if (timeTotal < 900) {
		return 2
	}
	else if (timeTotal < 1800) {
		return 1
	}
	else {
		return 0
	}
}

function getNumProbesIndicator(madWrapper, faultInd1, faultInd2, faultInd3, numChanges) {
	if (faultInd1 == 0 && faultInd2 == 0 && faultInd3 == 0) {
		return 0
	}
	if (numChanges < 25) {
		return 2
	}	
	else if (numChanges < 50) {
		return 1
	}
	else {
		return 0
	}
}

function getSubmittedTruthValuesString(madWrapper) {
	var s = ""
	
	for (var i = 0; i < 8; ++i) {
		var label = "TT" + i
		s += madWrapper.getLastCIValue(label)
	}	
	return s
}

function getTimeStringFromSeconds(s) {
	var min = parseInt(s / 60)
	var sec = s % 60
	return "" + min + " minutes " + sec + " seconds"
}

function getPoints(indicatorName) {
	var rubric = ot_assessment_view_config.getRubric()
	var indicators = rubric.getIndicators();
	var indicator = null
	for (var i = 0; i < indicators.size(); ++i) {
		indicator = indicators.get(i)
		if (indicator.getName() == indicatorName) {
			break;
		}
	}
	var grade = RubricGradeUtil.getIndicatorGrade(glob.otAssessment, indicator, rubric)
	return [grade.getPoints(), RubricGradeUtil.getMaximumPoints(indicator)]
}

function assessment_text() {
	var t = ""
	
	t += "<h2>Details</h2>"
	t += "<table><tr>"
	t += "<td colspan=\"2\"><b>Truth Table</b> (10 points for correct answer)</td>"
	t += "</tr><tr>"
	t += "<td>Correct value</td><td>" + answers.c_truthValues + "</td>"
	t += "</tr><tr>"
	t += "<td>Submitted value</td><td>" + getSubmittedTruthValuesString(glob.madWrapper) + "</td>"
	t += "</tr>"
	t += "<tr><td colspan=\"2\""
	if (answers.c_truthValues == getSubmittedTruthValuesString(glob.madWrapper)) {
		t += "<font color=\"009000\">Correct! 10 points (out of 10)</font>\n"
	}
	else {
		t += "<font color=\"900000\">Incorrect 0 points (out of 10)</font>\n"		
	}
	t += "</td></tr><tr></tr>"
	
	t += "<td colspan=\"2\"><b>Fault #1</b> (20 points for correct answer)</td>"
	t += "</tr><tr>"
	t += "<td>Correct answer</td><td>" + viMap.gateToLabel[answers.c_fault1] + "</td>"
	t += "</tr><tr>"
  	t += "<td>Submitted answer</td><td>" + viMap.gateToLabel[answers.s_fault1] + "</td>"
  	t += "</tr><tr>"
	t += "<td colspan=\"2\""
	if (answers.c_fault1 == answers.s_fault1) {
		t += "<font color=\"009000\">Correct! 20 points (out of 20)</font>\n"
	}
	else {
		t += "<font color=\"900000\">Incorrect 0 points (out of 20)</font>\n"		
	}
	t += "</td></tr><tr></tr>"
  	
	t += "<td colspan=\"2\"><b>Fault #2</b> (20 points for correct answer)</td>"
	t += "</tr><tr>"
	t += "<td>Correct answer</td><td>" + viMap.gateToLabel[answers.c_fault2] + "</td>"
	t += "</tr><tr>"
  	t += "<td>Submitted answer</td><td>" + viMap.gateToLabel[answers.s_fault2] + "</td>"
  	t += "</tr><tr>"
	t += "<td colspan=\"2\""
	if (answers.c_fault2 == answers.s_fault2) {
		t += "<font color=\"009000\">Correct! 20 points (out of 20)</font>\n"
	}
	else {
		t += "<font color=\"900000\">Incorrect 0 points (out of 20)</font>\n"		
	}
	t += "</td></tr><tr></tr>"
	
	t += "<td colspan=\"2\"><b>Fault #3</b> (20 points for correct answer)</td>"
	t += "</tr><tr>"
	t += "<td>Correct answer</td><td>" + viMap.gateToLabel[answers.c_fault3] + "</td>"
	t += "</tr><tr>"
  	t += "<td>Submitted answer</td><td>" + viMap.gateToLabel[answers.s_fault3] + "</td>"
  	t += "</tr><tr>"
	t += "<td colspan=\"2\""
	if (answers.c_fault3 == answers.s_fault3) {
		t += "<font color=\"009000\">Correct! 20 points (out of 20)</font>\n"
	}
	else {
		t += "<font color=\"900000\">Incorrect 0 points (out of 20)</font>\n"		
	}
	t += "</td></tr><tr></tr>"
	
	t += "<td colspan=\"2\"><b>Number of useless<sup><font color=\"009000\">*</font></sup> probes</b> (10 points for minimal number)</td>"
	t += "</tr><tr>"
	var pts = getPoints("uselessProbes")
	t += "<td>" + answers.numHiddenProbes + "</td><td>" + pts[0] + " points (out of " + pts[1] + ")</td>"
	t += "</tr><tr>"
			
	t += "<d colspan=\"2\"><b>Number of useful<sup><font color=\"009000\">**</font></sup> probes</b> (10 points for minimal number)</td>"
	t += "</tr><tr>"
	pts = getPoints("usefulProbes")
	t += "<td>" + answers.numEvidentProbes + "</td><td>" + pts[0] + " points (out of " + pts[1] + ")</td>"
	t += "</tr><tr>"	
	
	t += "<td colspan=\"2\"><b>Time Taken</b> (10 points for minimal time) </td>"
	t += "</tr><tr>"	
	pts = getPoints("timeTotal");
  	t += "<td>" + getTimeStringFromSeconds(answers.time) + "</td><td>" + pts[0] + " points (out of " + pts[1] + ")</td>"
	t += "</tr></table>"
	
	t += "<font color=\"009000\">"
	t += "<p><b>* </b> A probe measurement is useless if the inputs are set so that the circuit is functioning properly.<br/>"
	t += "<b>**</b> A probe measurement is useful if the inputs are set so that the circuit is malfunctioning.</p>"
	t += "</font>"	
	
	t += "<p/>---------- "			
	t += " The information below this line is only for debugging purpose "
	t += "----------<br/><pre>"		
	t += glob.activityLog
	t += "</pre><hr/>"
	
	return t
}