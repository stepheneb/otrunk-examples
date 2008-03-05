/**
 * Create rubric from the OTModelActivityData object by populating the OTAssessment object
 * This must happen AFTER the LabVIEW has exited, and AFTER validateAnswers().
 */
function assess() {
	var converter = new LabviewReportConverter(_monitor)
	converter.markEndTime()
	var madwrapper = converter.getMADWrapper()
	_assessUtil = new ScopeAssessmentUtil(madwrapper)
	
	_correctAmp = 2 * Double.parseDouble(madwrapper.getLastCIValue("amplitude")) //peak-to-peak amplitude
	_correctFrq = Double.parseDouble(madwrapper.getLastCIValue("frequency"))
	
	var ampUnit = _submittedAmpUnit.getAbbreviation()
	var frqUnit = _submittedFrqUnit.getAbbreviation()
	
	var etime = _dateFormat.format(new Date())
	log(etime + " - Correct amplitude = " + ScopeAssessmentUtil.getAmplitudeString(_correctAmp))
	log(etime + " - Correct frequency = " + ScopeAssessmentUtil.getFrequencyString(_correctFrq) + " (T = " + ScopeAssessmentUtil.getPeriodString(1/_correctFrq) + ")")
	
	var numChanges = madwrapper.getNumChanges()
	
    log(etime + " - Answer submitted: amplitude = " + _submittedAmp + " " + ampUnit)
  	log(etime + " - Answer submitted: frequency = " + _submittedFrq + " " + frqUnit)
    
	var ampIndicator = checkAmplitude(_correctAmp, _submittedAmp, ampUnit)
	var frqIndicator = checkFrequency(_correctFrq, _submittedFrq, frqUnit)
	var ampUnitIndicator = checkAmpUnit(ampUnit)
	var frqUnitIndicator = checkFrqUnit(frqUnit)
	var timeTotal = madwrapper.getTimeTotal()
	var settingsIndicator = checkSettings(madwrapper)
	
	_otAssessment.setLabel("Oscilloscope")
	var indicators = _otAssessment.getIndicatorValues()
	indicators.put("amplitudeValue", ampIndicator)
	indicators.put("frequencyValue", frqIndicator)
	indicators.put("amplitudeUnit", ampUnitIndicator)
	indicators.put("frequencyUnit", frqUnitIndicator)
	indicators.put("numChanges", numChanges)
	indicators.put("timeTotal", timeTotal)
	indicators.put("controlSetting", settingsIndicator)
	
	++_currentStep
	
	if (_currentStep <= _lastStep){
		startStep(_currentStep)
	}
	else {
		endActivity()
	}

	log("----------")
	_info.setText(_info.getText() + _assessUtil.getChangeLog())
}
