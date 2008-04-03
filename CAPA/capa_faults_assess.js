// Holder for answers
var answers =  { 
	s_fault : 0, // submitted fault location
	c_fault : 0, // correct fault location
	numChanges : 0,
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
	faultToGate : [ 0, 3, 6, 4, 5, 8],
	probeMap : [ "No Connection", "U1A Input", "U1A Output", "U1B Input", "U1B Output",
		"U1C Input", "U1C Output", "U1 Ground", "U1 VCC", "U2A Input1",
		"U2A Input 2", "U2A Input 3", "U2A Output", "U2B Input 1", "U2B Input 2",
		"U2B Input 3", "U2B Output", "U2C Input 1", "U2C Input 2", "U2C Input 3",
		"U2C Output", "U2 Ground", "U2 VCC", "U3A Input 1", "U3A Input 2",
		"U3A Output", "U3B Input 1", "U3B Input 2", "U3B Output", "U3 Ground",
		"U3 VCC"
	],
}

function getCorrectFaultyGate(madWrapper) {
	var faultID = parseInt(madWrapper.getLastCIValue("Fault"))
	return viMap.faultToGate[faultID]
}

function getSubmittedFaultyGate(madWrapper) {
	return parseInt(madWrapper.getLastCIValue("Fault List")) 
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

/**
 * This function mut be called AFTER the LabVIEW has exited, and AFTER validateAnswers().
 */
function assess(assessment, madWrapper) {
	p("ENTER: assess()")

	processUserEvents(madWrapper)
	answers.c_fault = getCorrectFaultyGate(madWrapper) // correct answer
	answers.s_fault = getSubmittedFaultyGate(madWrapper) // submitted answer
	
	var etime = glob.dateFormat.format(new Date())
	log("----------\n")
	log(etime + " - Correct fault location = " + viMap.gateToLabel[answers.c_fault] + "\n")
  	log(etime + " - Submitted fault location = " + viMap.gateToLabel[answers.s_fault] + "\n")

	var timeTotal = madWrapper.getTimeTotal()
	
	var indicators = assessment.getIndicatorValues()
	indicators.put("fault", answers.c_fault == answers.s_fault ? 1 : 0)
	indicators.put("numChanges", answers.numChanges)
	indicators.put("timeTotal", timeTotal)
	
	log("----------\n")		
	log(glob.activityLog)
}
