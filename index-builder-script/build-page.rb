#! /usr/local/bin/ruby -w

require 'yaml'
require 'uri'

# assume we are already in the directory we are working on
# and if it is for a web server we are inside of the web_root_directory
# build the list dirs and files
# this also requires
# $web_root_directory -  the web_directory so it can be stripped and replaced
# $web_root_url - the root url corresponding to the url above
# $svn_root_directory - the file system directory root cooresponding to the svn_root_path
# $svn_root_path - the root path which replaces the directory above
# an $erb variable should be passed in created something like this:

dirs = []

$tree_node.children.each do |child_node|
  next unless child_node.has_otmls
  path = child_node.name
  dir = OtmlDir.new    
  svn_props = YAML::load(`svn info "#{path}"`)
  dir.update_time = gmt_time_from_svn_time(svn_props["Last Changed Date"])
  dir.num_otmls = Dir.glob("#{path}/*.otml").length
  dir.name = path;
  dir.path = path + "/" + INDEX_SUFFIX;
  dirs << dir
end

path = Dir.pwd
html_title = File.basename(path)

parent_url = "../#{INDEX_SUFFIX}"

if File.exists?("#{path}/jnlp_url.tmpl")
  jnlp_url_tmpl = File.read("#{path}/jnlp_url.tmpl")
else      
  jnlp_url_tmpl = "http://saildataservice.concord.org/2/offering/144/jnlp/540/view?sailotrunk.otmlurl=%otml_url%&sailotrunk.hidetree=false"
end

# Append: jnlp properties: otrunk.view.author=true and otrunk.view.mode=authoring
jnlp_url_tmpl_author = jnlp_url_tmpl + "&jnlp_properties=otrunk.view.author%253Dtrue%2526otrunk.view.mode%253Dauthoring"

all_files = []
otmls = []

start_otmls_time = Time.now

start_svn_info_time = Time.now
dir_svn_info = `svn info * 2>/dev/null`
svn_info_time = Time.now - start_svn_info_time

start_svn_yaml_time = Time.now
svn_info_hash = {}
dir_svn_info.split("\n\n").each{ |svn_info|
  svn_props = YAML::load(svn_info)
  svn_info_path = svn_props['Path']
  next if svn_info_path.nil?
  svn_info_hash[svn_info_path] = svn_props
}
svn_yaml_time = Time.now - start_svn_yaml_time

Dir.glob("*").sort.each do |filename|
  filename += "/" if File.directory?(filename)
  all_files << filename
  next unless filename =~ /.*otml$/
  
  abs_path = File.expand_path(filename)
  
  file = OtmlFile.new
  file.path = filename;
  file.name = filename[/(.*)\.otml/, 1]
    
  if svn_props = svn_info_hash[filename]
    file.update_time = gmt_time_from_svn_time(svn_props["Last Changed Date"])
    svn_path = abs_path.sub(/#{$svn_root_directory}/, $svn_root_path)  
    trac_otml_url = "http://trac.cosmos.concord.org/projects/browser/#{svn_path}"
    file.svn_rev_link = "<a href='#{trac_otml_url}'>#{svn_props['Last Changed Rev']}</a>"
  else
    file.update_time = (File.stat(filename).mtime).gmtime
    file.svn_rev_link = "not in svn"
  end
  
  # need to figure out the relative subpath, relative to the web directory 
  if NO_SERVER
    absolute_url = "file://#{abs_path}";
  else
    absolute_url = abs_path.sub(/#{$web_root_directory}/, $web_root_url)
  end
  
  absolute_url_escaped = URI.escape(absolute_url, /[#{URI::REGEXP::PATTERN::RESERVED}\s]/)
    
  trac_otml_url = "http://trac.cosmos.concord.org/projects/browser/#{svn_path}"
  file.jnlp_url = jnlp_url_tmpl.sub(/%otml_url%/, absolute_url_escaped)
  file.jnlp_author_url = jnlp_url_tmpl_author.sub(/%otml_url%/, absolute_url_escaped)
  
  otmls << file
end

otmls_time = Time.now - start_otmls_time

# load in the erb template setup the binding and run it and then
# embed the result in the standard text (which might be another template)

start_erb_time = Time.now
File.open("index.html", "w") do |f|
  f << $erb.result(binding)
end
erb_time = Time.now - start_erb_time

puts "dir: " + path + "(#{svn_info_time}, #{svn_yaml_time}, #{otmls_time}, #{erb_time})"
STDOUT.flush
