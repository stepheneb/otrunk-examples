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
 * helper: a ScopeAssessmentUtil object
 * madwrapper: a MADWrapper object
 */
function assess(assessment, helper, madwrapper) {
	_correctAmp = 2 * Double.parseDouble(madwrapper.getLastCIValue("amplitude1")) //peak-to-peak amplitude
	_correctFrq = Double.parseDouble(madwrapper.getLastCIValue("frequency1"))
	
	var ampUnit = _submittedAmpUnit.getAbbreviation()
	var frqUnit = _submittedFrqUnit.getAbbreviation()
	
	var etime = _dateFormat.format(new Date())
	log(etime + " - Correct amplitude = " + helper.getAmplitudeString(_correctAmp) + "\n")
	log(etime + " - Correct frequency = " + helper.getFrequencyString(_correctFrq) + " (T = " + ScopeAssessmentUtil.getPeriodString(1/_correctFrq) + ")" + "\n")
	
	var numChanges = madwrapper.getNumChanges()
	
    log(etime + " - Answer submitted: amplitude = " + _submittedAmp + " " + ampUnit + "\n")
  	log(etime + " - Answer submitted: frequency = " + _submittedFrq + " " + frqUnit + "\n")
    
	var ampIndicator = checkAmplitude(_correctAmp, _submittedAmp, ampUnit)
	var frqIndicator = checkFrequency(_correctFrq, _submittedFrq, frqUnit)
	var ampUnitIndicator = checkAmpUnit(ampUnit)
	var frqUnitIndicator = checkFrqUnit(frqUnit)
	var timeTotal = madwrapper.getTimeTotal()
	var settingsIndicator = checkSettings(helper, madwrapper)
	
	var indicators = assessment.getIndicatorValues()
	indicators.put("amplitudeValue", ampIndicator)
	indicators.put("frequencyValue", frqIndicator)
	indicators.put("amplitudeUnit", ampUnitIndicator)
	indicators.put("frequencyUnit", frqUnitIndicator)
	indicators.put("numChanges", numChanges)
	indicators.put("timeTotal", timeTotal)
	indicators.put("controlSetting", settingsIndicator)
	

	log("----------\n")
	log(helper.getChangeLog())
}

function checkSettings(helper, madWrapper) {
	var viewWidth = helper.getLastTimePerDiv() * 10
	var waveLength = 1.0 / _correctFrq
	var timePerDivPoints = 0
	var voltsPerDivPoints = 0
	var channel = "A"
	
	if (madWrapper.getLastCIValue("port_b").equals("1")) {
		channel = "B"
	}
	
	if (helper.optimalTimePerDivPossible(waveLength)) {
		if (viewWidth < 0.5 * waveLength) {
			timePerDivPoints = 0
		}
		else if (viewWidth < waveLength) {
			timePerDivPoints = 1 	
		}
		else if (viewWidth < 2 * waveLength) {
			timePerDivPoints = 2
		}
		else if (viewWidth < 3 * waveLength) {
			timePerDivPoints = 1
		}
		else {
			timePerDivPoints = 0
		}
	}
	else {
		if (viewWidth < 0.5 * waveLength) {
			timePerDivPoints = 0
		}
		else if (viewWidth < 3 * waveLength) {
			timePerDivPoints = 2
		}
		else {
			timePerDivPoints = 0
		}
	}
	
	var viewHeight = helper.getLastVoltsPerDiv(channel) * 8
	var voltsPerDivPoints = helper.getVoltsPerDivPoints(channel, _correctAmp)

	if (timePerDivPoints == 2 && voltsPerDivPoints == 2) {
		return 3
	}
	else if ((timePerDivPoints == 2 && voltsPerDivPoints == 1) || (timePerDivPoints == 1 && voltsPerDivPoints == 2)) {
		return 2
	}
	else if (timePerDivPoints == 1 && voltsPerDivPoints == 1) {
		return 1
	}
	else {
		return 0
	}
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
