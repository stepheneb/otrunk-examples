require 'java' 
require 'rbconfig'

import org.concord.modeler.event.PageListener
import org.concord.modeler.event.PageEvent
import org.concord.modeler.event.ModelListener
import org.concord.modeler.event.ModelEvent

# import java.lang.Class
import java.lang.System

$page = $objView.getPage();

class MyPageListener
  include org.concord.modeler.event.PageListener
  
  def pageUpdate(event)
    if (event.getType() == PageEvent::PAGE_READ_END)
      postMWInit
    end
  end
 end
 
$pageListener = MyPageListener.new

class MyModelListener
  org.concord.modeler.event.ModelListener
  
  def modelUpdate(event)
    if (event.getID() == ModelEvent::MODEL_RESET || event.getID() == ModelEvent::MODEL_INPUT)
      end_run()
    elsif (event.getID() == ModelEvent::MODEL_RUN)
      start_run()
      log_location()
    elsif (event.getID() == ModelEvent::MODEL_STOP)
      end_run()
    end
  end
end

$modelListener = MyModelListener.new
  

def init()
  $page.addPageListener($pageListener)
  init_logging()
  return true
end

def save() 
  $page.removePageListener($pageListener)
  $model.removeModelListener($modelListener)
  finalize_logging()
  return true
end


def postMWInit() 
  models = $page.getEmbeddedComponent(java.lang.Class.forName("org.concord.modeler.ModelCanvas")).values().toArray()
  if (models != nil)
    for i in 0..models.length-1
      $model = models[i].getContainer().getModel()
      $model.addModelListener($modelListener)
    end
  end
end

def log_location()
   x = $model.getModelTime()/1000;
   cmX = x.round
   # $stderr.puts "X is: " + x.to_s + ", " + cmX.to_s
   log_ci("Location", cmX.to_s)
end

# for logging
$mad;
$modelruns;
$current_run;
$ci_array = {};
$ra_array = {};

def init_logging()
  # set up MAD
  $mad = $context.getOTObject("org.concord.otrunk.modelactivitydata.OTModelActivityData");
  $otContents.add($mad);
  
    $mad.setName("Hanging With Friends - Vector Motion Model");
    $modelruns = $mad.getModelRuns();
    
    $mad.setStartTime(now());
  # set up CI's
    # Location of the object
    add_computational_input("Location");

    # reset event
    # add_representational_attribute("Reset Event", new Array("Reset"));
end

def add_computational_input(ci_name)
  comp_inputs = $mad.getComputationalInputs();
    # new comp_input
    ci = $context.getOTObject("org.concord.otrunk.modelactivitydata.OTComputationalInput");
    ci.setName(ci_name);
    
    # add to comp_inputs
    comp_inputs.add(ci);
    
    # add to ci_array
    $ci_array[ci_name] = ci;
end

def add_representational_attribute(ra_name, values)
  ras = $mad.getRepresentationalAttributes();
  ra = $context.getOTObject("org.concord.otrunk.modelactivitydata.OTRepresentationalAttribute");
  ra.setName(ra_name);
  # if (values != nil)
  #  vals = ra.getValueList();
    # for i in 0..values.length-1
      # FIXME: skip for now
      # vals.add(values[i]);
    # end
  # end
  ras.add(ra);
  $ra_array[ra_name] = ra;
end

def start_run()
  if ($current_run == nil)
    $current_run = $context.getOTObject("org.concord.otrunk.modelactivitydata.OTModelRun");
    $modelruns.add($current_run);
    $current_run.setStartTime(now());
  end
end

def end_run()
  if ($current_run != nil)
    $current_run.setEndTime(now());
    $current_run = nil;
  end
end

def log_ci(ci_idx, value)
  if ($current_run == nil)
    start_run();
  end
  
  ci = $ci_array[ci_idx];
  civ = $context.getOTObject("org.concord.otrunk.modelactivitydata.OTComputationalInputValue");
  civ.setTime(now());
  civ.setValue(value);
  civ.setReference(ci);
  $current_run.getComputationalInputValues().add(civ);
end

def log_ra(ra_idx, value)
  if (current_run == nil)
    start_run();
  end
  
  ra = $ra_array[ra_idx];
  rav = $context.getOTObject("org.concord.otrunk.modelactivitydata.OTRepresentationalAttributeValue");
  rav.setTime(now());
  rav.setValue(value);
  rav.setReference(ra);
  $current_run.getRepresentationalAttributeValues().add(rav);
end

def finalize_logging()
  end_run();
  $mad.setEndTime(now());
end

def now()
  return System.currentTimeMillis();
end