
require 'java' 
require 'rbconfig'

import org.concord.modeler.event.PageListener
import org.concord.modeler.event.PageEvent
import org.concord.mw2d.event.UpdateListener
import org.concord.modeler.ModelCanvas

import java.awt.event.ActionListener
import java.awt.Font

$model = nil;
$page = $objView.getPage();
$showTimer = true;
$blnDoStop = false;
$integerTimeToStop = -1;
$playButtonEnabled = true
$maxTime = $scriptState.get("maxTime")

class MyPageListener
  include org.concord.modeler.event.PageListener
  
  def pageUpdate(event)
    if (event.getType() == PageEvent::PAGE_READ_END)
      postMWInit()
    end
  end
end
$pageListener = MyPageListener.new

class MyUpdateListener
  include org.concord.mw2d.event.UpdateListener
  
  def viewUpdated(evt)
    seconds = $model.getModelTime()/1000

    if ($showTimer)
      $lblTimer.setText(seconds.floor.to_s);
      if ((seconds + 1) > $maxTime)
        $blnDoStop = true;
        $playButtonEnabled = false
      end
    end
    if ($blnDoStop)
      if ($integerTimeToStop == -1)
        $integerTimeToStop = seconds.ceil
      end
      blnSecondInteger = (($integerTimeToStop - seconds) <= 0.01)
      if (blnSecondInteger)

        $lblTimer.setText($integerTimeToStop.to_s);    

        $model.runScript("stop immediately")
        setupPlayButton("start", $playButtonEnabled)

        $integerTimeToStop = -1

        $blnDoStop = false
      end
    end
  end
end
$updateListener = MyUpdateListener.new;

class MyActionListener
  include java.awt.event.ActionListener
  
  def actionPerformed(evt)
    if (evt.getSource().equals( $runpause_button ))
      
      if($model.isRunning())
          # $stderr.puts "pause clicked"
          $blnDoStop = true
      else
        $integerTimeToStop = -1
        # $stderr.puts "starting model"
        $blnDoStop = false
        $model.runScript("run")

        setupPlayButton("stop", $playButtonEnabled)      
      end
    elsif (evt.getSource().equals( $reset_button ))
      $blnDoStop = false
      
      $playButtonEnabled = true
      setupPlayButton("start", $playButtonEnabled)
      $model.runScript("stop; reset")

      $lblTimer.setText("0")
    end
  end
end
$actionListener = MyActionListener.new

def init()
  $lblTimer.setText("0")
  $lblTimer.setFont(Font.new($lblTimer.getFont().getName(), $lblTimer.getFont().getStyle(),60))
  
  $page.addPageListener($pageListener)
  
  $runpause_button.addActionListener($actionListener)
  $reset_button.addActionListener($actionListener)

  return true
end

def save()
  $page.removePageListener($pageListener)
  $model.removeUpdateListener($updateListener);
  return true
end

def setupPlayButton(strL, enabled)
  # puts "got #{strL} for playButton"
  if (strL == "start")
    # puts "Start"
    $ot_runpause_button.setText("Start")
  elsif (strL == "stop")
    # puts "Stop"
    $ot_runpause_button.setText("Stop")
  end
  $runpause_button.setEnabled(enabled)
end

def postMWInit() 
  # $stderr.puts "MW initialized"
  models = $page.getEmbeddedComponent(java.lang.Class.forName("org.concord.modeler.ModelCanvas")).values().toArray();
  if (models != nil) 
    for i in 0..models.length-1
      # $stderr.puts "Model initialized"
      $model = models[i].getContainer().getModel();
      $model.addUpdateListener($updateListener);
    end
  end
end
