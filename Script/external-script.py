from java.lang import System
from java.awt.event import ActionListener
from javax.swing import JOptionPane

from java.io import File
f = File(".")
print f.getCanonicalPath()

# Variables from Java:
#   otText
#   incButton

class MyNum:
    def __init__(self, value):
        self.value = value
    
    def getValue(self):
        return self.value
    
    def setValue(self, value):
        self.value = value
    
    def increment(self):
        self.value += 1
        
    def __str__(self):
        return str(self.value)
        
class IncButtonListener(ActionListener):
    def actionPerformed(self, event):
        if _num.getValue() > 8:
            JOptionPane.showMessageDialog(None, "Max value reached. Resetting to zero.")
            _num.setValue(0)
        else:
            _num.increment()
        otText.setText(str(_num))
        
def init():
    System.out.println("ENTER: init()")
    otText.setText(str(_num))
    incButton.addActionListener(_incButtonListener)    
    return True
    
def save():
    System.out.println("ENTER: save()")
    incButton.removeActionListener(_incButtonListener)        
    return True

_num = MyNum(0)
_incButtonListener = IncButtonListener()
