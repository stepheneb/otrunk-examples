function clicked() {
	java.lang.System.out.println("clicked");

	numSamples = sourceDataStore.getTotalNumSamples();
    if(numSamples <= 0){
		java.lang.System.out.println("can't add point with no samples");
		return;
	}
	
	value = sourceDataStore.getValueAt(numSamples-1, 1);

	numCalibrationPoints = calibrationPoints.getTotalNumSamples();
	
	// Add the uncalibrated value
	calibrationPoints.setValueAt(numCalibrationPoints, 0, new java.lang.Float(value));	
	
	// Add a default value (0) for the calibrated value
	calibrationPoints.setValueAt(numCalibrationPoints, 1, new java.lang.Float(0));	
	
}
