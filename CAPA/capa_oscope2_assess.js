// Variables to keep track of the oscilloscope states while traversing the log
var oscope = {
	vpd_a : null,
	vpd_b : null,
	tpd : null,
	channel : null, // 0, 1, or 2 (0: A&B, 1: B, 2: A)
	triggerSource : null, // "A" or "B"
	port : null, // "A" or "B"
	power : null // true or false
}

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
	//p("ENTER: validateAnswers()")
	
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
function assess(assessment) {
	//p("ENTER: assess()")
	
	var modulatorAmplitude = Double.parseDouble(glob.madw.getLastCIValue("amplitude2"))
	var a = Double.parseDouble(glob.madw.getLastCIValue("A")) // modulation constant
	
	answers.c_crFreq = Double.parseDouble(glob.madw.getLastCIValue("frequency1"))
	answers.c_mdFreq = Double.parseDouble(glob.madw.getLastCIValue("frequency2"))
	answers.c_mdIndex = modulatorAmplitude / a * 100.0
	
	var carrierFrqUnit = answers.s_crFreqUnit.getAbbreviation()
	var modFrqUnit = answers.s_mdFreqUnit.getAbbreviation()	
	
	var etime = glob.dateFormat.format(new Date())
	log("----------\n")
	log(etime + " - Correct carrier frequency = " + ScopeAssessmentUtil.getFrequencyString(answers.c_crFreq) + " (T = " + ScopeAssessmentUtil.getPeriodString(1/answers.c_crFreq) + ")" + "\n")
	log(etime + " - Correct modulator frequency = " + ScopeAssessmentUtil.getFrequencyString(answers.c_mdFreq) + " (T = " + ScopeAssessmentUtil.getPeriodString(1/answers.c_mdFreq) + ")" + "\n")
	log(etime + " - Correct modulation index = " + answers.c_mdIndex + "%\n")	
	
	var numChanges = glob.madw.getNumChanges()

  	log(etime + " - Answer submitted: carrier frequency = " + answers.s_crFreq + " " + carrierFrqUnit + "\n")
  	log(etime + " - Answer submitted: modulator frequency = " + answers.s_mdFreq + " " + modFrqUnit + "\n")
  	log(etime + " - Answer submitted: modulation index = " + answers.s_mdIndex + "%\n")  	

	var carrierFrqIndicator = checkFrequency(answers.c_crFreq, answers.s_crFreq, carrierFrqUnit)
	var modFrqIndicator = checkFrequency(answers.c_mdFreq, answers.s_mdFreq, modFrqUnit)
	var modIndexIndicator = checkModIndex()
	
	var carrierFrqUnitIndicator = checkFrqUnit(carrierFrqUnit)
	var modFrqUnitIndicator = checkFrqUnit(modFrqUnit)

	var timeTotal = glob.madw.getTimeTotal()
	var tpdIndicator = checkSettings()
	
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
	log(glob.helper.getChangeLog())
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

function checkSettings() {
	var civs = glob.madw.getSortedCIVs()
	var carrierTpdPoints = 0	
	var modulatorTpdPoints = 0
	var wasConsistent = false
	var isConsistent = false
	
	initScopeState()
	isConsistent =  channelSettingsAreConsistent()
	if (isConsistent) {
		carrierTpdPoints = updCarrierTpdPoints(oscope.tpd, carrierTpdPoints)		
		modulatorTpdPoints = updModulatorTpdPoints(oscope.tpd, modulatorTpdPoints)
	}
	wasConsistent = isConsistent
	
	for (var i = 0; i < civs.size(); ++i) {
		var civ = civs.get(i)
		var name = civ.getName()
		var value = civ.getValue()
		var time = civ.getTime()
		var vpd = null
		var tpd = null
		
		updateScopeState(name, value)
		
		isConsistent = channelSettingsAreConsistent()
		if (isConsistent && (name.equals(glob.helper.TPD) || !wasConsistent)) { 
			carrierTpdPoints = updCarrierTpdPoints(oscope.tpd, carrierTpdPoints)		
			modulatorTpdPoints = updModulatorTpdPoints(oscope.tpd, modulatorTpdPoints)
		}
		wasConsistent = isConsistent
	}
	return carrierTpdPoints + modulatorTpdPoints
}

function initScopeState() {
	var tracked = [ glob.helper.VPD_A, glob.helper.VPD_B, glob.helper.TPD, glob.helper.SOURCE, 
		glob.helper.CHANNEL, glob.helper.PORT_A, glob.helper.PORT_B, glob.helper.POWER ]
	
	for (var i = 0; i < tracked.length; ++i) {
		updateScopeState(tracked[i], glob.madw.getInitialCIValue(tracked[i]))
	}	
}

function updateScopeState(name, value) {
	if (name.equals(glob.helper.VPD_A)) {
		oscope.vpd_a = parseInt(value)
	}
	else if (name.equals(glob.helper.VPD_B)) {
		oscope.vpd_b = parseInt(value)
	}
	else if (name.equals(glob.helper.TPD)) {
		oscope.tpd = parseInt(value)		
	}
	else if (name.equals(glob.helper.SOURCE)) {
		oscope.triggerSource = value.equals("1") ? "A" : "B"
	}	
	else if (name.equals(glob.helper.CHANNEL)) {
		oscope.channel = parseInt(value)
	}
	else if (name.equals(glob.helper.PORT_A) && value.equals("1")) {
		oscope.port = "A"
	}
	else if (name.equals(glob.helper.PORT_B) && value.equals("1")) {
		oscope.port = "B"
	}
	else if (name.equals(glob.helper.POWER)) {
		oscope.power = value.equals("0") ? false : true
	}
}

function channelSettingsAreConsistent() {
	if (oscope.power == false) {
		return false
	}	
	if (oscope.port == "A") {
		return oscope.triggerSource == "A" && (oscope.channel == 0 || oscope.channel == 2)
	}
	else if (oscope.port == "B") {
		return oscope.triggerSource == "B" && (oscope.channel == 0 || oscope.channel == 1)
	} 
	return false
}

function updCarrierTpdPoints(tpdTick, oldPts) {
	var pts = glob.helper.getTimePerDivPoints(answers.c_crFreq, tpdTick)
	return pts > oldPts ? pts : oldPts
}

function updModulatorTpdPoints(tpdTick, oldPts) {
	var pts = glob.helper.getTimePerDivPoints(answers.c_mdFreq, tpdTick)
	return pts > oldPts ? pts : oldPts
}

function getDiff(a, b) {
	return Math.abs(a - b)	
}

function getRelDiff(a, b) {
	return Math.abs(a - b) / b	
}
