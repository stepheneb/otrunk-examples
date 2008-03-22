// Holder for answers
var answers =  { 
	s_crFreq : 0, // submitted carrier frequency value in Hz
	s_mdFreq : 0, // submitted modulator frequency value in Hz
	s_crFreqUnit : null, // submitted carrier frequency unit
	s_mdFreqUnit : null, // submitted modulator frequency unit
	s_mdIndex : 0, // submitted modulation index
	c_crFreq : 0, // correct carrier frequency value in Hz
	c_mdFreq : 0, // correct modulator frequency value in Hz
	c_mdIndex : 0 // correct modulation index in percent
}

function validateAnswers() {
	p("ENTER: validateAnswers()")
	
	var carrierFrequency = 0.0
	var modulatorFrequency = 0.0
	var modulationIndex = 0.0
	
	var carrierFrequencyText= otc_answerBoxCarrierFrq.getText()
	var modulatorFrequencyText= otc_answerBoxModFrq.getText()
	var modulationIndexText = otc_answerBoxModIndex.getText()
	
    var carrierFrequencyUnit = ot_unitChoiceCarrierFrq.getCurrentChoice()
    var modulatorFrequencyUnit = ot_unitChoiceModFrq.getCurrentChoice()    
    
	if (carrierFrequencyUnit == null || carrierFrequencyUnit.getAbbreviation() == "") {
		JOptionPane.showMessageDialog(null, "Set the unit for carrier frequency and try again.")
		return false
	}
	if (modulatorFrequencyUnit == null || modulatorFrequencyUnit.getAbbreviation() == "") {
		JOptionPane.showMessageDialog(null, "Set the unit for modulator frequency and try again.")
		return false
	}
	try {
		carrierFrequency = Double.parseDouble(carrierFrequencyText)
	}
	catch (e) {
		JOptionPane.showMessageDialog(null, "Invalid carrier frequency value [" + carrierFrequencyText + "].\n" + "Please try again.")
		return false
	}
	try {
		modulatorFrequency = Double.parseDouble(modulatorFrequencyText)
	}
	catch (e) {
		JOptionPane.showMessageDialog(null, "Invalid modulator frequency value [" + modulatorFrequencyText + "].\n" + "Please try again.")
		return false
	}
	try {
		modulationIndex = Double.parseDouble(modulationIndexText)
	}
	catch (e) {
		JOptionPane.showMessageDialog(null, "Invalid modulator index value [" + modulationIndexText + "].\n" + "Please try again.")
		return false
	}
	
	answers.s_crFreq = carrierFrequency
	answers.s_crFreqUnit = carrierFrequencyUnit
	answers.s_mdFreq = modulatorFrequency
	answers.s_mdFreqUnit = modulatorFrequencyUnit
	answers.s_mdIndex = modulationIndex
	return true	
}

/**
 * This function must be called AFTER the LabVIEW has exited, and AFTER validateAnswers().
 */
function assess(assessment, helper, madWrapper) {
	p("ENTER: assess()")
	
	var modulatorAmplitude = Double.parseDouble(madWrapper.getLastCIValue("amplitude2"))
	var a = Double.parseDouble(madWrapper.getLastCIValue("A")) // modulation constant
	
	answers.c_crFreq = Double.parseDouble(madWrapper.getLastCIValue("frequency"))
	answers.c_mdFreq = Double.parseDouble(madWrapper.getLastCIValue("frequency2"))
	answers.c_mdIndex = modulatorAmplitude / a * 100.0
	
	var carrierFrqUnit = answers.s_crFreqUnit.getAbbreviation()
	var modFrqUnit = answers.s_mdFreqUnit.getAbbreviation()	
	
	var etime = glob.dateFormat.format(new Date())
	log("----------\n")
	log(etime + " - Correct carrier frequency = " + ScopeAssessmentUtil.getFrequencyString(answers.c_crFreq) + " (T = " + ScopeAssessmentUtil.getPeriodString(1/answers.c_crFreq) + ")" + "\n")
	log(etime + " - Correct modulator frequency = " + ScopeAssessmentUtil.getFrequencyString(answers.c_mdFreq) + " (T = " + ScopeAssessmentUtil.getPeriodString(1/answers.c_mdFreq) + ")" + "\n")
	log(etime + " - Correct modulation index = " + answers.c_mdIndex + "%\n")	
	
	var numChanges = madWrapper.getNumChanges()

  	log(etime + " - Answer submitted: carrier frequency = " + answers.s_crFreq + " " + carrierFrqUnit + "\n")
  	log(etime + " - Answer submitted: modulator frequency = " + answers.s_mdFreq + " " + modFrqUnit + "\n")
  	log(etime + " - Answer submitted: modulation index = " + answers.s_mdIndex + "%\n")  	

	var carrierFrqIndicator = checkFrequency(answers.c_crFreq, answers.s_crFreq, carrierFrqUnit)
	var modFrqIndicator = checkFrequency(answers.c_mdFreq, answers.s_mdFreq, modFrqUnit)
	var modIndexIndicator = checkModIndex()
	
	var carrierFrqUnitIndicator = checkFrqUnit(carrierFrqUnit)
	var modFrqUnitIndicator = checkFrqUnit(carrierFrqUnit)

	var timeTotal = madWrapper.getTimeTotal()
	var tpdIndicator = checkSettings(helper, madWrapper, modulatorAmplitude + a)
	
	assessment.setLabel("Oscilloscope")
	var indicators = assessment.getIndicatorValues()
	indicators.put("carrierFrequencyValue", carrierFrqIndicator)
	indicators.put("carrierFrequencyUnit", carrierFrqUnitIndicator)	
	indicators.put("modFrequencyValue", modFrqIndicator)
	indicators.put("modFrequencyUnit", modFrqUnitIndicator)			
	indicators.put("modIndex", modIndexIndicator)
	indicators.put("numChanges", numChanges)
	indicators.put("timeTotal", timeTotal)
	indicators.put("controlSetting", tpdIndicator)
	
	log("----------\n")		
	log(helper.getChangeLog())
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
	
	var diff =  getRelDiff(answerValue, correctValue)
	
	if (diff < 0.05) {
		return 4  //perfect
	}
	else if (diff < 0.1 ) {
		return 3  //close
	}

	// NOw check for possiblities of mistaken units
	diff = getRelDiff(answerValue, correctValue * 1000)
	if (diff < 0.05) {
		return 2
	} 
	else if (diff < 0.1) {
		return 1
	}
	diff = getRelDiff(answerValue, correctValue * 1.0e6)
	if (diff < 0.05) {
		return 2
	} 	
	else if (diff < 0.1) {
		return 1
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

function checkModIndex() {
	var d = getDiff(answers.s_mdIndex, answers.c_mdIndex)
	return (d < 5) ? 1 : 0 	
}

function checkSettings(helper, madWrapper, amplitude) {
	var timePerDivPoints = 0
	var voltsPerDivPoints = 0
	
	var timePerDivs = helper.getTimePerDivs()
	var voltsPerDivs = helper.getVoltsPerDivs()
	
	for (var i = 0; i < timePerDivs.size(); ++i) {
		var pts = checkTimePerDiv(timePerDivs.get(i), answers.c_crFreq)
		if (pts > timePerDivPoints) {
			timePerDivPoints = pts
		}		
		pts = checkTimePerDiv(timePerDivs.get(i), answers.c_mdFreq)
		if (pts > timePerDivPoints) {
			timePerDivPoints = pts
		}		
	}
	for (var i = 0; i < voltsPerDivs.size(); ++i) {
		var pts = helper.getVoltsPerDivPoints(amplitude)
		if (pts > voltsPerDivPoints) {
			voltsPerDivPoints = pts
		}
	}
	
	// Check for channel selection
	var channel = Integer.parseInt(madWrapper.getLastCIValue("SelectChannel"));
	
	if (channel == 2) {
		return 0 // bad: channel A has no signal 
	}
	
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

function checkTimePerDiv(tpd, correctFrq) {
	var viewWidth = tpd * 10
	var waveLength = 1.0 / correctFrq
	
	if (ScopeAssessmentUtil.optimalTimePerDivPossible(waveLength)) {
		if (viewWidth < 0.5 * waveLength) {
			return 0
		}
		else if (viewWidth < waveLength) {
			return 1 	
		}
		else if (viewWidth < 2 * waveLength) {
			return 2
		}
		else if (viewWidth < 3 * waveLength) {
			return 1
		}
		else {
			return 0
		}
	}
	else {
		if (viewWidth < 0.5 * waveLength) {
			return 0
		}
		else if (viewWidth < 3 * waveLength) {
			return 2
		}
		else {
			return 0
		}
	}
}

function getDiff(a, b) {
	return Math.abs(a - b)	
}

function getRelDiff(a, b) {
	return Math.abs(a - b) / b	
}
