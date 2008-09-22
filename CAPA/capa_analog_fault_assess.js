var c_fault1 //correct fault location 1
var c_fault2 //correct fault location 2
var c_fault3 //correct fault location 3
var numMeasurements = [0, 0, 0] //number of measurements for each of three circuits
var num1s = [0, 0, 0] //number of non-Vc/Vrc voltage measurements                       
var num2s = [0, 0, 0] //number of currency measurements
var resistanceMeasure = [0, 0, 0] //which resistance did student measure? 
var times = [0, 0, 0] //time spent on each problem                         

/**
 * This function mut be called AFTER the LabVIEW has exited, and AFTER validateAnswers().
 */
function assess(assessment, madWrapper) {
	System.out.println("ENTER: assess()")
	var questions = assessment.getQuestions()
	var q1 = questions.get(0)
	var q2 = questions.get(1)
	var q3 = questions.get(2)
	var inv = assessment.getInventory()
	
	processUserEvents(madWrapper)
	
	c_fault1 = parseInt(madWrapper.getLastCIValue("faultLocation1")) 
	var s_fault1 = parseInt(madWrapper.getLastCIValue("answer1"))
	q1.setCorrectAnswer(otCreateInt(c_fault1))
	q1.setInput(otCreateInt(s_fault1))
	
	c_fault2 = parseInt(madWrapper.getLastCIValue("faultLocation2"))
	var s_fault2 = parseInt(madWrapper.getLastCIValue("answer2"))
	q2.setCorrectAnswer(otCreateInt(c_fault2))
	q2.setInput(otCreateInt(s_fault2))
	
	c_fault3 = parseInt(madWrapper.getLastCIValue("faultLocation3"))
	var s_fault3 = parseInt(madWrapper.getLastCIValue("answer3"))
	q3.setCorrectAnswer(otCreateInt(c_fault3))
	q3.setInput(otCreateInt(s_fault3))	
	
	var faultInd1 = c_fault1 == s_fault1 ? 1 : 0
	var faultInd2 = c_fault2 == s_fault2 ? 1 : 0
	var faultInd3 = c_fault3 == s_fault3 ? 1 : 0
	var numInd = getNumMeasurementsIndicator()
	var numInd1 = getVoltageIndicator1()
	var numInd2 = getCurrentIndicator()
	var rInd = getResistanceIndicator()
	var timeInd = getTimeIndicator()
	
	var indicators = assessment.getIndicatorValues()
	indicators.put("fault1", faultInd1)
	indicators.put("fault2", faultInd2)	
	indicators.put("fault3", faultInd3)
	indicators.put("numMeasurements", numInd)
	indicators.put("voltage", numInd1)
	indicators.put("current", numInd2)	
	indicators.put("resistance", rInd)	
	indicators.put("timeTotal", timeInd)
	
	inv.put("num1", numMeasurements[0])
	inv.put("num2", numMeasurements[1])
	inv.put("num3", numMeasurements[2])
	inv.put("activityLog", glob.activityLog)	
}

function processUserEvents(madWrapper) {
	glob.activityLog += "Circuit 1\n"

	var fault2Start = -1
	var fault3Start = -1
	var wasNearTransition = true
	var dmmDial = parseInt(madWrapper.getInitialCIValue("DMM Dial"))
	var noProbeYet = true
	var start
	var civ
	
	var steps = madWrapper.getSortedCIVs("step")
	for (i = 0; i < steps.size(); ++i) {
		var step = parseInt(steps.get(i).getValue())
		var t = steps.get(i).getTime()
		switch (step) {
			case 1: fault2Start = t; break
			case 2: fault3Start = t; break
		}
	}
	System.out.println("Fault 2 start: " + fault2Start)
	System.out.println("Fault 3 start: " + fault3Start)	
	
	var civs = madWrapper.getSortedCIVs()
	var fault = 1
	var prevFault = 1

	
	for (var i = 0; i < civs.size(); ++i) {
		civ = civs.get(i)
		var name = civ.getName()
		var value = civ.getValue()		
		var timeString = glob.dateFormat.format(new Date(civ.getTime()))
		var nearFault2Start = Math.abs(civ.getTime() - fault2Start) < 250
		var nearFault3Start = Math.abs(civ.getTime() - fault3Start) < 250 		
	    var inTransition = (nearFault2Start && prevFault == 1) || (nearFault3Start && prevFault == 2)
				
		if (noProbeYet) {
			noProbeYet = false
			start = civ.getTime()
			System.out.println("Start(1): " + start)
		}
		
		if (inTransition) {
			times[fault-1] = parseInt((civ.getTime() - start) / 1000)
			start = civ.getTime()
			fault += 1
			System.out.println("Start(" + fault + "): " + start)
			glob.activityLog += "Circuit " + fault + "\n"
			
			if (nearFault2Start) { prevFault = 2 }
			if (nearFault3Start) { prevFault = 3 }
		}
		if (name == "DMM Dial") {
			dmmDial = parseInt(value)
		}
		if (name == "probeLocation") {
			var probeLoc = parseInt(value)
			glob.activityLog += timeString + " - Probed [" + 
				AnalogDCUtil.getProbeLocationLabel(probeLoc) + "] in [" +
				AnalogDCUtil.getMultimeterDialLabel(dmmDial) +	"] mode\n"

			numMeasurements[fault-1] += 1
			if (nonVcrc(dmmDial, probeLoc)) {
				num1s[fault-1] += 1
			}
			if (dmmDial == 0 || dmmDial == 1) {
				num2s[fault-1] += 1
			}
			if (isResistanceMeasurement(dmmDial, probeLoc)) {
				resistanceMeasure[fault-1] = probeLoc;
			}
		}
	}
	times[2] = parseInt((civ.getTime() - start) / 1000) 
}

function getTimeIndicator() {
	var faultIds = [AnalogDCUtil.getFaultId(c_fault1),
	                AnalogDCUtil.getFaultId(c_fault2),
	                AnalogDCUtil.getFaultId(c_fault3)]
    var sum = 0
    
    for (var i = 0; i < 3; ++i) {
    	System.out.println("times[" + i + "]=" + times[i])
    	if (faultIds[i] == 0) {
    		if (times[i] <= 150) { sum += 10 }
    		else if (times[i] <= 205) { sum += 9 }    		
    		else if (times[i] <= 235) { sum += 8 }
    		else if (times[i] <= 255) { sum += 7 }    		
    		else if (times[i] <= 268) { sum += 6 }    		
    		else if (times[i] <= 278) { sum += 5 }    		
    		else if (times[i] <= 286) { sum += 4 }    		
    		else if (times[i] <= 292) { sum += 3 }    		
    		else if (times[i] <= 297) { sum += 2 }    		
    		else if (times[i] <= 300) { sum += 1 }
    	}
    	else {
    		if (times[i] <= 290) { sum += 10 }
    		else if (times[i] <= 364) { sum += 9 }    		
    		else if (times[i] <= 400) { sum += 8 }
    		else if (times[i] <= 427) { sum += 7 }    		
    		else if (times[i] <= 448) { sum += 6 }    		
    		else if (times[i] <= 465) { sum += 5 }    		
    		else if (times[i] <= 478) { sum += 4 }    		
    		else if (times[i] <= 488) { sum += 3 }    		
    		else if (times[i] <= 496) { sum += 2 }    		
    		else if (times[i] <= 500) { sum += 1 }
    	}
    }
	
	var ind = parseInt(sum / 3)
	System.out.println("Time Indicator=" + ind)
	return ind
}

function getNumMeasurementsIndicator() {
	var faultIds = [AnalogDCUtil.getFaultId(c_fault1),
	                AnalogDCUtil.getFaultId(c_fault2),
	                AnalogDCUtil.getFaultId(c_fault3)]
	var p0  = [0, 10, 8,  6,  4, 2]
    var p1  = [0,  0, 0,  0, 10, 8, 4, 2]
    var p23 = [0,  0, 9, 10,  5, 2, 1]
    var p45 = [0,  0, 0,  0, 10, 8, 4, 2]
    var pointsTable = [p0, p1, p23, p23, p45, p45]
    var sum = 0

    for (var i = 0; i < 3; ++i) {
    	var points = pointsTable[faultIds[i]][numMeasurements[i]]
    	sum += ( points == null ?  0 : points )
    	System.out.println("n=" + numMeasurements[i] + " points=" + points)
    }
	System.out.println("Ind=" + parseInt(sum / 3))
	return parseInt(sum / 3)
}

function getVoltageIndicator1() {
	var faultIds = [AnalogDCUtil.getFaultId(c_fault1),
	                AnalogDCUtil.getFaultId(c_fault2),
	                AnalogDCUtil.getFaultId(c_fault3)]
	var p0  = [10,  8,  6, 4, 2]
    var p1  = [ 0, 10,  8, 4, 2]
    var p23 = [ 0,  9, 10, 5, 2, 1]
    var p45 = [ 0,  0, 10, 8, 5, 2]          
    var pointsTable = [p0, p1, p23, p23, p45, p45]
    var sum = 0
    
    for (var i = 0; i < 3; ++i) {
    	var points = pointsTable[faultIds[i]][num1s[i]]
    	sum += ( points == null ?  0 : points )
    	System.out.println("n1=" + num1s[i] + " points=" + points)
    }
	var ind = parseInt(sum / 3)
	System.out.println("Voltage Indicator=" + ind) 
	return ind
}

function getCurrentIndicator() {
	var sum = 0
	var pointsTable = [10, 8, 2]
	                   
	for (var i = 0; i < 3; ++i) {
		var points = pointsTable[num2s[i]]
        sum += (points == null ? 0 : points)
    	System.out.println("n2=" + num2s[i] + " points=" + points)        
	}
	var ind = parseInt(sum / 3)
	System.out.println("Current Indicator=" + ind) 
	return ind
}

function getResistanceIndicator() {
	var faultIds = [AnalogDCUtil.getFaultId(c_fault1),
	                AnalogDCUtil.getFaultId(c_fault2),
	                AnalogDCUtil.getFaultId(c_fault3)]
	var sum = 0
	for (var i = 0; i < 3; ++i) {
		var loc = resistanceMeasure[i]
		if (faultIds[i] == 0) { //no fault
			if (loc == 0) { sum += 10 }
		}
		else if (faultIds[i] == 1) {
			if (loc == 3 ) { sum += 10 } //Rc
			else if (loc != 0) { sum += 4 }
		}
		else if (faultIds[i] == 2 || faultIds[i] == 3) {
			if (loc == 1 || loc == 2) { sum += 10 } //Rb1 or Rb2
			else if (loc != 0) { sum += 4 }
		}
		else if (faultIds[i] == 4 || faultIds[i] == 5) {
			if (loc == 3 || loc == 4) { sum += 10 } //Rc or Re
			else if (loc != 0) { sum += 4 }
		}
	}
	var ind = parseInt(sum / 3) 
	System.out.println("Resistance Indicator=" + ind)
	return ind
}

function nonVcrc(dmmDial, probeLoc) {
	return dmmDial == 7 && probeLoc != 3 && probeLoc != 6 && probeLoc != 10 && probeLoc != 11 
}

function isResistanceMeasurement(dmmDial, probeLoc) {
	return dmmDial == 9 && probeLoc > 0 && probeLoc < 6
}

