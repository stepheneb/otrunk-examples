// Holder for answers
var answers =  {
    c_fault1 : 0, //correct location of fault #1
    s_fault1 : 0, // submitted location of fault #1
    c_fault2 : 0, // correct location of fault #2
    s_fault2 : 0, // submitted location of fault #2
    c_fault3 : 0, // correct location of fault #3
    s_fault3 : 0, // submitted location of fault #3
    s_truthValues : "", // submitted answer to truth table question
    c_truthValues : "10100100", // correct answer to truth table question
    numHiddenProbes : 0, // number of useless probes
    numEvidentProbes : 0, // number of useful probes
    numChanges : 0, // number of changes (input switch flips + probes)
    time : 0 // total time taken
}

/**
 * This function mut be called AFTER the LabVIEW has exited, and AFTER validateAnswers().
 */
function assess(assessment, madWrapper) {
    System.out.println("ENTER: assess()")
    var inv = c.assessment.getInventory()

    processUserEvents(madWrapper)
    answers.c_fault1 = parseInt(madWrapper.getLastCIValue("faultLocation1")) 
    answers.s_fault1 = parseInt(madWrapper.getLastCIValue("answer1")) 
    answers.c_fault2 = parseInt(madWrapper.getLastCIValue("faultLocation2"))
    answers.s_fault2 = parseInt(madWrapper.getLastCIValue("answer2")) 
    answers.c_fault3 = parseInt(madWrapper.getLastCIValue("faultLocation3"))
    answers.s_fault3 = parseInt(madWrapper.getLastCIValue("answer3")) 
    answers.time = madWrapper.getTimeTotal()

    var ttInd = parseInt(madWrapper.getLastCIValue("truthTableCorrect"))
    var faultInd1 = answers.c_fault1 == answers.s_fault1 ? 1 : 0
    var faultInd2 = answers.c_fault2 == answers.s_fault2 ? 1 : 0
    var faultInd3 = answers.c_fault3 == answers.s_fault3 ? 1 : 0    
    //var numProbesInd = getNumProbesIndicator(madWrapper, faultInd1, faultInd2, faultInd3, answers.numChanges)
    var timeInd = getTimeIndicator(answers.time, ttInd, faultInd1, faultInd2, faultInd3)
    
    var indicators = assessment.getIndicatorValues()
    indicators.put("truthTable", ttInd)
    indicators.put("fault1", faultInd1)
    indicators.put("fault2", faultInd2)    
    indicators.put("fault3", faultInd3)        
    indicators.put("uselessProbes", answers.numHiddenProbes)
    indicators.put("usefulProbes", answers.numEvidentProbes)
    indicators.put("timeTotal", timeInd)
    
    inv.put("c_truthValues", answers.c_truthValues) //save correct answer
    inv.put("s_truthValues", getSubmittedTruthValuesString(g.madWrapper)) //save submitted answer
    inv.put("c_fault1", answers.c_fault1)
    inv.put("s_fault1", answers.s_fault1)
    inv.put("c_fault2", answers.c_fault2)
    inv.put("s_fault2", answers.s_fault2)    
    inv.put("c_fault3", answers.c_fault3)
    inv.put("s_fault3", answers.s_fault3)
    inv.put("timeTotal", answers.time)
    inv.put("activityLog", g.activityLog)    
}

function processUserEvents(madWrapper) {
    var savedA = null
    var savedB = null
    var savedC = null
    
    // evident: true if the output of the circuit agrees with the truth table 
    // of a non-faulty circuit 
    var evident = false 
    
    var a = parseInt(madWrapper.getInitialCIValue("A")) //input switch A
    var b = parseInt(madWrapper.getInitialCIValue("B")) //input switch B
    var c = parseInt(madWrapper.getInitialCIValue("C")) //input switch C
    var y = parseInt(madWrapper.getInitialCIValue("output")) //circuit output (LED)
    var evident = isEvident(a, b, c, y)
    
    g.activityLog += "Fault 1: Initial switch setting: A=" + a + " B=" + b + " C=" + c + " Y=" + y + "\n"

    var fault2Start = -1
    var fault3Start = -1
    
    var steps = madWrapper.getSortedCIVs("step")
    for (i = 0; i < steps.size(); ++i) {
        var step = parseInt(steps.get(i).getValue())
        var t = steps.get(i).getTime()
        switch (step) {
            case 1: fault2Start = t; break;
            case 2: fault3Start = t; break;
        }
    }
    
    var civs = madWrapper.getSortedCIVs()
    var wasUserEvent = true

    var fault = 1

    for (var i = 0; i < civs.size(); ++i) {
        var civ = civs.get(i)
        var name = civ.getName()
        var value = civ.getValue()
        var timeString = g.dateFormat.format(new Date(civ.getTime()))
        var nearFault2Start = Math.abs(civ.getTime() - fault2Start) < 100
        var nearFault3Start = Math.abs(civ.getTime() - fault3Start) < 100
        var isUserEvent =  (nearFault2Start || nearFault3Start) ? false : true
        var isSwitchEvent = name == "A" || name == "B" || name == "C"
        
        if (name.equals("step")) {
            fault = parseInt(value) + 1
        }
        
        if (isSwitchEvent) {
            if (name == "A") { a = value }
            else if (name == "B") { b = value }
            else if (name == "C") { c = value }
        }
        
        if (name == "output") {
            y = parseInt(value);
        }

        evident = isEvident(a, b, c, y)

        if (isUserEvent) {
            if (wasUserEvent == false) {
                g.activityLog += "Fault " + fault + ": initial switch setting: A=" + savedA + " B=" + savedB + " C=" + savedC + " Y=" + y + "\n"                
            }
            if (isSwitchEvent) {
                g.activityLog += timeString + " - Input " + name + " flipped to " + value + " (A=" + a + " B=" + b + " C=" + c + " Y=" + y + ")\n"
                ++ answers.numChanges
            }
            else if (name == "probeLocation") {
                var ev = evident ? "(evident)" : "(hidden)"
                g.activityLog += timeString + " - Probed [" +
                    g.helper.getProbeSpotLabel(parseInt(value)) + 
                    "] " + ev + " \n"
                ++ answers.numChanges
                if (evident) {
                    ++ answers.numEvidentProbes
                }
                else {
                    ++ answers.numHiddenProbes
                }
            }
        }
        else {
            savedA = a
            savedB = b
            savedC = c
        }
        wasUserEvent = isUserEvent
    }
}

function isEvident(a, b, c, y) {
    var x = -1
    
    if (a == 0) {
        if (b == 0) {
            if (c == 0) { x = 1 } //000
            else { x = 0 } //001
        }
        else {
            if (c == 0) { x = 1 } // 010
            else { x = 0 } // 011
        }
    }
    else {
        if (b == 0) {
            if (c == 0) { x = 0 } // 100
            else { x = 1 } // 101
        }
        else {
            if (c == 0) { x = 0 } // 110
            else { x = 0 } // 111
        }
    }
    return x != y
}

function getTimeIndicator(timeTotal, ttInd, faultInd1, faultInd2, faultInd3) {
    if (ttInd == 0 && faultInd1 == 0 && faultInd2 == 0 && faultInd3 == 0) {
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

function getSubmittedTruthValuesString(madWrapper) {
    var s = ""
    
    for (var i = 0; i < 8; ++i) {
        var label = "TT" + i
        s += madWrapper.getLastCIValue(label)
    }    
    return s
}
