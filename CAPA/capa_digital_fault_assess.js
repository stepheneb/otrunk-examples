// Holder for answers
var answers =  {
	c_fault1 : 0, // correct location of fault #1
	s_fault1 : 0, // submitted location of fault #1
	c_fault2 : 0, // correct location of fault #2	
	s_fault2 : 0, // submitted location of fault #2
	s_truthValues : "", // submitted answer to truth table question
	c_truthValues : "10100100", // correct answer to truth table question
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
		"No faults", "Inverter U1A", "Inverter U1B", "Inverter U1C", "AND gate U2A", "AND gate U2B", "AND gate U3B", 
		"OR gate U3A", "OR gate U3B", "OR gate U3C"		
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
	answers.time = madWrapper.getTimeTotal()
	
	log("----------\n")
	log("Correct truth table values: " + answers.c_truthValues + "\n")
	log("Submitted truth table values: " + getSubmittedTruthValuesString(madWrapper) + "\n")
	log("Correct fault #1 location: " + viMap.gateToLabel[answers.c_fault1] + "\n")
  	log("Submitted fault #1 location: " + viMap.gateToLabel[answers.s_fault1] + "\n")
	log("Correct fault #2 location: " + viMap.gateToLabel[answers.c_fault2] + "\n")
  	log("Submitted fault #2 location: " + viMap.gateToLabel[answers.s_fault2] + "\n")
  	log("Number of changes (probes + input switch): " + answers.numChanges + "\n")
  	log("Time taken: " + getTimeStringFromSeconds(answers.time) + "\n")

	var ttInd = parseInt(madWrapper.getLastCIValue("truthTableCorrect"))
	var faultInd1 = answers.c_fault1 == answers.s_fault1 ? 1 : 0
	var faultInd2 = answers.c_fault2 == answers.s_fault2 ? 1 : 0	
	var numProbesInd = getNumProbesIndicator(madWrapper, faultInd1, faultInd2, answers.numChanges)
	var timeInd = getTimeIndicator(answers.time, ttInd, faultInd1, faultInd2)
	
	var indicators = assessment.getIndicatorValues()
	indicators.put("truthTable", ttInd)
	indicators.put("fault1", faultInd1)
	indicators.put("fault2", faultInd2)	
	indicators.put("numChanges", numProbesInd)
	indicators.put("timeTotal", timeInd)
	
	log("----------\n")		
	log(glob.activityLog)
}

function processUserEvents(madWrapper) {
	var civs = madWrapper.getSortedCIVs();
	for (var i = 0; i < civs.size(); ++i) {
		var civ = civs.get(i)
		var name = civ.getName()
					
		if (name == "A" || name == "B" || name == "C" || 
			name == "Probe Location")
		{
			++ answers.numChanges;
			glob.activityLog += getLogLine(civ)	
		}
	}
}

function getTimeIndicator(timeTotal, ttInd, faultInd1, faultInd2) {
	if (ttInd == 0 && faultInd1 == 0 && faultInd2 == 0) {
		return 0
	}
	if (timeTotal < 360) {
		return 2
	}
	else if (timeTotal < 600) {
		return 1
	}
	else {
		return 0
	}
}

function getNumProbesIndicator(madWrapper, faultInd1, faultInd2, numChanges) {
	if (faultInd1 == 0 && faultInd2 == 0) {
		return 0
	}
	if (numChanges < 20) {
		return 2
	}	
	else if (numChanges < 30) {
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

function getLogLine(civ) {
	var name = civ.getName()
	var value = civ.getValue()
	var time = glob.dateFormat.format(new Date(civ.getTime()))
	
	if (name == "A" || name == "B" || name == "C") {
		return time + " - Input " + name + " flipped to " + value + "\n"
	}
	else if (name == "Probe Location") {
		return time + " - Probed [" + viMap.probeMap[parseInt(value)] + "]\n"		
	}		
}

function getTimeStringFromSeconds(s) {
	var min = parseInt(s / 60)
	var sec = s % 60
	return "" + min + " minutes " + sec + " seconds"
}
