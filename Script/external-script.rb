require 'java'

include_class 'javax.swing.JOptionPane'

def clicked
  JOptionPane.showMessageDialog(nil, "Hello World")
end
