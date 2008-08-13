// Holder for answers
var answers =  {
	c_fault1 : 0, //correct location of fault #1
	s_fault1 : 0, // submitted location of fault #1
	c_fault2 : 0, // correct location of fault #2	
	s_fault2 : 0, // submitted location of fault #2
	c_fault3 : 0, // correct location of fault #3	
	s_fault3 : 0, // submitted location of fault #3
	time : 0 // total time taken
}

/**
 * This function mut be called AFTER the LabVIEW has exited, and AFTER validateAnswers().
 */
function assess(assessment, madWrapper) {
	System.out.println("ENTER: assess()")
	var inv = assessment.getInventory()

	processUserEvents(madWrapper)
	answers.c_fault1 = parseInt(madWrapper.getLastCIValue("faultLocation1")) 
	answers.s_fault1 = parseInt(madWrapper.getLastCIValue("answer1")) 
	answers.c_fault2 = parseInt(madWrapper.getLastCIValue("faultLocation2"))
	answers.s_fault2 = parseInt(madWrapper.getLastCIValue("answer2")) 
	answers.c_fault3 = parseInt(madWrapper.getLastCIValue("faultLocation3"))
	answers.s_fault3 = parseInt(madWrapper.getLastCIValue("answer3")) 
	answers.time = madWrapper.getTimeTotal()
	
	var faultInd1 = answers.c_fault1 == answers.s_fault1 ? 1 : 0
	var faultInd2 = answers.c_fault2 == answers.s_fault2 ? 1 : 0
	var faultInd3 = answers.c_fault3 == answers.s_fault3 ? 1 : 0	
	var timeInd = getTimeIndicator(answers.time, faultInd1, faultInd2, faultInd3)
	
	var indicators = assessment.getIndicatorValues()
	indicators.put("fault1", faultInd1)
	indicators.put("fault2", faultInd2)	
	indicators.put("fault3", faultInd3)		
	indicators.put("timeTotal", timeInd)
	
	inv.put("c_fault1", answers.c_fault1)
	inv.put("s_fault1", answers.s_fault1)
	inv.put("c_fault2", answers.c_fault2)
	inv.put("s_fault2", answers.s_fault2)	
	inv.put("c_fault3", answers.c_fault3)
	inv.put("s_fault3", answers.s_fault3)
	inv.put("time", answers.time)
	inv.put("activityLog", glob.activityLog)	
}

function processUserEvents(madWrapper) {
	glob.activityLog += "Fault 1\n"

	var fault2Start = -1
	var fault3Start = -1
	var wasNearTransition = true
	var dmmDial = parseInt(madWrapper.getInitialCIValue("DMM Dial"))
	
	var steps = madWrapper.getSortedCIVs("step")
	for (i = 0; i < steps.size(); ++i) {
		var step = parseInt(steps.get(i).getValue())
		var t = steps.get(i).getTime()
		switch (step) {
			case 1: fault2Start = t; break
			case 2: fault3Start = t; break
		}
	}
	
	var civs = madWrapper.getSortedCIVs()
	var fault = 1 
		
	for (var i = 0; i < civs.size(); ++i) {
		var civ = civs.get(i)
		var name = civ.getName()
		var value = civ.getValue()		
		var timeString = glob.dateFormat.format(new Date(civ.getTime()))
		var nearFault2Start = Math.abs(civ.getTime() - fault2Start) < 500
		var nearFault3Start = Math.abs(civ.getTime() - fault3Start) < 500 		
		var nearTransition =  (nearFault2Start || nearFault3Start) ? true : false
		
		if (nearTransition) {
			if (wasNearTransition == false) {
				fault += 1
				glob.activityLog += "Fault " + fault + "\n"				
			}
		}
		if (name == "DMM Dial") {
			dmmDial = parseInt(value)
		}
		if (name == "probeLocation") {
			glob.activityLog += timeString + " - Probed [" + 
			AnalogDCUtil.getProbeLocationLabel(parseInt(value)) + "] in [" +
			AnalogDCUtil.getMultimeterDialLabel(dmmDial) +	"] mode\n"
		}
		wasNearTransition = nearTransition
	}
}

function getTimeIndicator(timeTotal, faultInd1, faultInd2, faultInd3) {
	if (faultInd1 == 0 && faultInd2 == 0 && faultInd3 == 0) {
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



