require 'time'

# == gmt_time_from_svn_time ==
#
# convert svn format times like this:
#
#   "2008-07-02 10:40:26 -0400 (Wed, 02 Jul 2008)"
#
# to a GMT format like this:
#
#   "Wed, 02 Jul 2008 14:40:26 GMT"
#
def gmt_time_from_svn_time(svn_time)
  iso8601_time = "#{svn_time[/(.*) -/, 1].gsub(/ /, 'T')}"
  Time.xmlschema(iso8601_time).gmtime.strftime("%a, %d %b %Y %H:%M:%S GMT")
end

class OtmlDir
  attr_accessor :update_time, :num_otmls, :name, :path  
end

class OtmlFile 
  attr_accessor :path, :name, :update_time, :jnlp_url, :jnlp_author_url, :svn_rev_link
end

class FileTree
  attr_accessor :parent, :name, :abs_path, :has_otmls 
  
  def initialize(name, parent)
    @children = []
    self.name = name
    parent.add_child self unless parent.nil?
    Dir.chdir(name){
      self.abs_path = Dir.pwd
      Dir.glob("*").each{|p|
        if File.directory?(p)
          FileTree.new(p, self)
        elsif (not self.has_otmls) and p =~ /.otml$/
          self.has_otmls = true
          parents.each {|par| par.has_otmls = true}
        end
      }
    }
  end
  
  def parents()
    return [] if parent.nil?
    parent.parents << parent 
  end
  
  def add_child(child)
    @children << child
    child.parent = self
  end
  
  def children()
    @children
  end
  
  def print_tree(indent="")
    puts indent + self.name + "(#{self.has_otmls})"
    @children.each{|child|
      child.print_tree(indent + "  ")
    }
  end
  
  # go through each folder including the root one and build the index.html pages
  def recurse_otml_dirs(&block)
    return unless self.has_otmls
    yield(self)
    self.children.each do |child|
      child.recurse_otml_dirs(&block)
    end
end
  
end
  
