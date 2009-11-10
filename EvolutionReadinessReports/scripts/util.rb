require 'jruby'

include_class 'java.text.SimpleDateFormat'
include_class 'java.util.Date'
include_class 'java.util.TimeZone'

module Util
  
  DefaultDateFormat = "yyyy-MM-dd HH:mm:ss"
  DefaultTimeZone = "UTC"
  
  ## Get Java System Property
  def self.sysProp(prop, default)
    Java::JavaLang::System.getProperty(prop, default)
  end

  def self.toPlainText(xhtmlText)
    return Util.trim(xhtmlText.gsub(/<.*?>/, ''))
  end
  
  def self.trim(s)
    return s.strip.gsub(/\s/, ' ').gsub(/ {2,}/, ' ')
  end
  
  def self.truncate(string, length)
    if length < 3
      return '.' * length
    elsif string.length > length
      return string[0...(length-3)] + '...'
    else
      return string
    end
  end
  
  def self.avg(list)
    list.inject(0) { |sum, e| sum + e } / list.length.to_f
  end
  
  def self.error(message)
    System.err.println("#{self.class.name}: " + message)
  end
  
  def self.log(message)
    System.out.println("#{self.class.name}: " + message)
  end
  
  ## ms: milliseconds from epoch
  ## format: date format pattern as accepted by java SimpleDateFormat
  ## tz: time zone ID string
  def self.dateString(ms, format=DefaultDateFormat, tz=DefaultTimeZone)
    return nil if (ms == nil or ms == 0) 
    dateFormat = SimpleDateFormat.new(format)
    dateFormat.setTimeZone(TimeZone.getTimeZone(tz))
    dateFormat.format(Date.new(ms))
  end
  
  ## s: string
  ## Returns a java.util.Date
  def self.parseDate(s, format=DefaultDateFormat)
    dateFormat = SimpleDateFormat.new(format)
    dateFormat.parse(s)
  end
  
  ## Convert a camelCase string to underscored Form
  ## s.g. EternalLove -> eternal_love
  def self.underscore(s)
    s.gsub(/([A-Z]+)([A-Z][a-z])/,'\1_\2').gsub(/([a-z\d])([A-Z])/,'\1_\2').downcase
  end
  
end
