/* 
 * capa_labview_assess.js
 * has routines that performs assessment.
 */
 
 /* 
  * GLOBAL variables declared in another file:
  * _correctAmp
  * _correctFrq
  * _submittedAmp
  * _submittedFrq
  * _submittedAmpUnit
  * _submittedFrqUnit
  */

/**
 * assessment: the OTAssessment object
 */
function assess(assessment) {
	_correctAmp = 2 * Double.parseDouble(_madw.getLastCIValue("amplitude1")) //peak-to-peak amplitude
	_correctFrq = Double.parseDouble(_madw.getLastCIValue("frequency1"))
	
	var ampUnit = _submittedAmpUnit.getAbbreviation()
	var frqUnit = _submittedFrqUnit.getAbbreviation()
	
	var etime = _dateFormat.format(new Date())
	log(etime + " - Correct amplitude = " + _helper.getAmplitudeString(_correctAmp) + "\n")
	log(etime + " - Correct frequency = " + _helper.getFrequencyString(_correctFrq) + " (T = " + ScopeAssessmentUtil.getPeriodString(1/_correctFrq) + ")" + "\n")
	
	var numChanges = _madw.getNumChanges()
	
    log(etime + " - Answer submitted: amplitude = " + _submittedAmp + " " + ampUnit + "\n")
  	log(etime + " - Answer submitted: frequency = " + _submittedFrq + " " + frqUnit + "\n")
    
	var ampIndicator = checkAmplitude(_correctAmp, _submittedAmp, ampUnit)
	var frqIndicator = checkFrequency(_correctFrq, _submittedFrq, frqUnit)
	var ampUnitIndicator = checkAmpUnit(ampUnit)
	var frqUnitIndicator = checkFrqUnit(frqUnit)
	var timeTotal = _madw.getTimeTotal()
	var settingsIndicator = checkSettings()
	
	var indicators = assessment.getIndicatorValues()
	indicators.put("amplitudeValue", ampIndicator)
	indicators.put("frequencyValue", frqIndicator)
	indicators.put("amplitudeUnit", ampUnitIndicator)
	indicators.put("frequencyUnit", frqUnitIndicator)
	indicators.put("numChanges", numChanges)
	indicators.put("timeTotal", timeTotal)
	indicators.put("controlSetting", settingsIndicator)
	

	log("----------\n")
	log(_helper.getChangeLog())
}

function checkSettings() {
	var tpdTick = _madw.getLastCIValue(_helper.TPD)
	var channel = "A"
	var vpdTick = null
	
	if (_madw.getLastCIValue(_helper.PORT_B).equals("1")) {
		channel = "B"
	}
	if (channel == "A") {
		vpdTick = _madw.getLastCIValue(_helper.VPD_A)
	}
	else {
		vpdTick = _madw.getLastCIValue(_helper.VPD_B)
	}
	
	var timePerDivPoints = _helper.getTimePerDivPoints(_correctFrq, tpdTick)
	var voltsPerDivPoints = _helper.getVoltsPerDivPoints(channel, _correctAmp, vpdTick)

	return timePerDivPoints + voltsPerDivPoints
}

function checkAmplitude(correctValue, answer, unit) {
	var answerValue = 0.0

	answerValue = Double.parseDouble(answer)

	if (unit == "mV") {
		answerValue *= 0.001		
		
	}
	else if (unit == "kV") {
		answerValue *= 1000
	}
	else if (unit != "V") {
		return 0 // totally wrong
	}
	
	var diff = getDiff(answerValue, correctValue)
	
	if (diff < 0.05) {
		return 4  //perfect
	}
	else if (diff < 0.1 ) {
		return 3  //close
	}

	// NOw check for possiblities of mistaken units
	diff = getDiff(answerValue, correctValue * 1000)
	if (diff < 0.05) {
		return 2
	} 
	else if (diff < 0.1) {
		return 1
	}
	diff = getDiff(answerValue, correctValue * 0.001)
	if (diff < 0.05) {
		return 2
	} 	
	else if (diff < 0.1) {
		return 1
	}
	return 0
}

function checkFrequency(correctValue, answer, unit) {
	var answerValue = 0.0

	answerValue = Double.parseDouble(answer) 
	
	if (unit == "kHz") {
		answerValue *= 1000		
		
	}
	else if (unit == "MHz") {
		answerValue *= 1.0e6
	}
	else if (unit != "Hz") {
		return 0 // totally wrong
	}
	
	var diff =  getDiff(answerValue, correctValue)
	
	if (diff < 0.05) {
		return 4  //perfect
	}
	else if (diff < 0.1 ) {
		return 3  //close
	}

	// NOw check for possiblities of mistaken units
	diff = getDiff(answerValue, correctValue * 1000)
	if (diff < 0.05) {
		return 2
	} 
	else if (diff < 0.1) {
		return 1
	}
	diff = getDiff(answerValue, correctValue * 1.0e6)
	if (diff < 0.05) {
		return 2
	} 	
	else if (diff < 0.1) {
		return 1
	}
	return 0
}

function checkAmpUnit(unit) {
	a = ["mV", "V", "kV"] 
	for (i in a) {
		if (a[i] == unit) {
			return 1
		} 
	}
	return 0
}

function checkFrqUnit(unit) {
	a = ["Hz", "kHz", "MHz"] 
	for (i in a) {
		if (a[i] == unit) {
			return 1
		} 
	}
	return 0
}

function getDiff(a, b) {
	return Math.abs(a - b) / b	
}
