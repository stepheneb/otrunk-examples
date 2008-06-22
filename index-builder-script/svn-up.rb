#! /usr/bin/ruby
puts "Content-type: text/plain\n\n"
puts "Hello I am running as: #{`whoami`}\n"
puts "In directory: #{ Dir.pwd}\n"
puts "program running: #{File.expand_path(__FILE__)}\n"
puts "program running in dir: #{File.dirname(File.expand_path(__FILE__))}\n"
puts "svn up #{File.dirname(File.expand_path(__FILE__))}\n"
# print error messages on stdout so we can see them in the browser
STDERR.reopen(STDOUT)
puts `svn up #{File.dirname(File.expand_path(__FILE__))}`
