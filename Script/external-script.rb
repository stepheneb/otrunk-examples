require 'java'

include_class 'javax.swing.JOptionPane'

def self.clicked
  JOptionPane.showMessageDialog(nil, "Hello World")
end
