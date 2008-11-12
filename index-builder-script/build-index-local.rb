#! /usr/bin/ruby -w

require 'find'
require 'yaml'
require 'time'

# run: ruby index-builder-script/build-index-local.rb 
# to rebuild the local indexs for otrunk-examples

LOCAL_DIR = File.dirname(File.expand_path(__FILE__))
LOCAL_ROOT = File.dirname(LOCAL_DIR)

Dir.chdir(LOCAL_ROOT)

begin
 local_properties = YAML.load_file("#{LOCAL_DIR}/local_properties.yaml")
 USE_LOCAL_APACHE = local_properties[:use_local_apache]
 USE_TEXTMATE_URLS = local_properties[:use_textmate_urls]
 LOCAL_SDS = local_properties[:local_sds_path]
rescue Errno::ENOENT
  puts "\n" + "-" * 64 + "\n\n"
  puts "Creating new default properties file for #{__FILE__}\n\n"
  puts "  #{LOCAL_DIR}/local_properties.yaml]\n\n"
  puts "You will need to edit the values in this properties file."
  local_properties = { 
    :properties_version => 1, 
    :use_local_apache => true, 
    :use_textmate_urls => true, 
    :local_sds_path => "http://saildataservice/4/offering/2/jnlp/2/view" 
  }
  File.open("#{LOCAL_DIR}/local_properties.yaml", "w") {|f| YAML.dump(local_properties, f)}
  USE_LOCAL_APACHE = local_properties[:use_local_apache]
  USE_TEXTMATE_URLS = local_properties[:use_textmate_urls]
  LOCAL_SDS = local_properties[:local_sds_path]
end

# local_properties:
#
# :use_local_apache
#
#   when :use_local_apache is set to true the urls constructed are http
#   urls that will work if you are serving the otrunk-examples directory 
#   from a local Apache vhost.
#
# See: http://www.telscenter.org/confluence/display/SAIL/Setup+a+Full+SAIL+Stack+on+MacOS+10.5#SetupaFullSAILStackonMacOS10.5-Generatethelocalotindex.htmlfiles
#
# :use_textmate_urls
#
#   setting :use_textmate_urls to true in local properties will support
#   opening the otml files directly in textmate when clicking on the link
# 
# See: http://blog.macromates.com/2007/the-textmate-url-scheme/
#
# :local_sds_path
#
# This should be a url that points to an offering for running the OTrunk Example in a local SDS
#
# See: http://www.telscenter.org/confluence/display/SAIL/Setup+a+Full+SAIL+Stack+on+MacOS+10.5#SetupaFullSAILStackonMacOS10.5-CreateanSDSPortalrealmandassociatedresourcesforotrunkexamples

if USE_LOCAL_APACHE
  PATH_TO_JAVASCRIPT_RESOURCES = ''
else
  PATH_TO_JAVASCRIPT_RESOURCES = LOCAL_ROOT
end

def writeHtmlPage(title, body, filename)

  html_text = <<end_of_html
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en-US" xml:lang="en-US">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <link rel="stylesheet" type="text/css" media="all" href="#{PATH_TO_JAVASCRIPT_RESOURCES}/index-builder-script/style.css" />
  <script type="text/javascript" src="#{PATH_TO_JAVASCRIPT_RESOURCES}/index-builder-script/prototype.js"></script>
  <script type="text/javascript" src="#{PATH_TO_JAVASCRIPT_RESOURCES}/index-builder-script/fastinit.js"></script>
  <script type="text/javascript" src="#{PATH_TO_JAVASCRIPT_RESOURCES}/index-builder-script/tablesort.js"></script>	
  <TITLE>#{title}</TITLE>
  <style type="text/css">
  h3 {margin-bottom: 0.5em; margin-top:2em; border-bottom: 1px solid }
  h4 {margin-bottom: 0.2em}
  </style>
</head>

<BODY BGCOLOR="#FFFFFF">
<h2>#{title}</h2>
#{body}
</BODY>
</HTML>
end_of_html

  File.open(filename, "w") {|f| f.write(html_text)}
end

otrunk_example_dirs = Dir.glob("#{LOCAL_ROOT}/*/*.otml").collect {|p| File.dirname(p)}.uniq

index_page_body = "<table id='index' class='sortable'><thead><tr><th class='sortfirstasc'>Category</th><th class='date'>Date of last change</th><th>Number of examples</th></thead><tbody>"

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

otrunk_example_dirs.each do |path|  
  svn_props = YAML::load(`svn info #{path}`)
  gmt_time = gmt_time_from_svn_time(svn_props["Last Changed Date"])
  examples = Dir.glob("#{path}/*.otml").length
  local_http_path = path[/.*otrunk-examples(.*)/, 1]
  index_page_body += "<tr><td><a href=""#{local_http_path}/ot-index.html"">#{File.basename(path)}</a></td>"
  index_page_body += "<td class='timestyle'>#{gmt_time}</td>"
  index_page_body += "<td>#{examples}</td></tr>\n"
end

index_page_body += "</tbody></table>"
index_page_body += "<hr/><p>Update the local otrunk-examples indexs by running this code in a shell:</p><p><code> ruby #{File.expand_path(__FILE__)}</code></p>"

writeHtmlPage("OTrunk Examples", index_page_body, "example-index.html")

otrunk_example_dirs.each do |path|
  if File.exists?("#{path}/jnlp_url.tmpl")
    if File.exists?("#{path}/local_jnlp_url.tmpl")
      jnlp_url_tmpl = File.read("#{path}/local_jnlp_url.tmpl")
    else
      jnlp_url_tmpl = File.read("#{path}/jnlp_url.tmpl")
      puts "\n" + "-" * 64 + "\n\n"
      puts "Using jnlp tempate:\n\n"
      puts "   #{path}/jnlp_url.tmpl"
      puts "\nfor #{File.basename(path)}\n"
      puts "\nThe otml examples in #{File.basename(path)} require the jnlp in the offering in this remote SDS:\n\n"
      puts "   " + jnlp_url_tmpl[/(.*)\/jnlp/, 1]
      puts "\nLocal operation will be faster if you host a copy of the remote jnlp and jar resources referenced"
      puts "in the offering in the remote SDS in your local jnlp server and provide a reference to a new offering"
      puts "in your local SDS. Replace the remote 'view' url in the existing jnlp_url.tmpl with your new 'view' url"
      puts "and save the new copy of this url to this file:\n\n"
      puts "   #{path}/local_jnlp_url.tmpl"
      puts "\n"
    end
  else
    jnlp_url_tmpl = "#{LOCAL_SDS}?sailotrunk.otmlurl=%otml_url%&sailotrunk.hidetree=false"
  end

  # Append: jnlp properties: otrunk.view.author=true and otrunk.view.mode=authoring
  jnlp_url_tmpl_author = jnlp_url_tmpl + "&jnlp_properties=otrunk.view.author%253Dtrue%2526otrunk.view.mode%253Dauthoring"

  otml_launchers = "<h4>Run Examples</h4> <table cellspacing=2 id='otml_launchers' class='sortable''><thead><tr><th><b>example</b></th><th class='nosort'><b>jnlp</b></th><th class='nosort'><b>jnlp</b></th><th><b>otml file</b></th><th class='number sortfirstdesc'><b>most recent revision</b></th></tr></thead><tbody>"

  description_of_jnlps = <<HERE
<h4>Description of the difference between running an activity in learner mode and author mode</h4>
<p>Running an OTrunk example in learner mode uses the default view mode which assumes a learner. In addition if you use the File menu to save the otml only the differences between the activity otml and the changes will be saved. The otml saved is the learner difference otml and is often much smaller than activty otml.</p>
<p>Running an OTrunk example in author mode sets the following jnlp properties:</p>
<ul>
<li>otrunk.view.author=true</li>
<li>otrunk.view.mode=authoring</li>
</ul>
<p>Setting otrunk.view.author to true causes the entire OTrunk state to be saved as otml when a File save is performed. Setting otrunk.view.mode to authoring is used in the view system to enable authoring affordances in the views. Many examples do not have special authoring views. The Basic Example: document-edit.otml does have both authoring and student view modes.</p>
<hr/>
HERE

  java_web_start_warning = <<HERE
<h4>MacOS X Java Web Start Problem</h4>
<p>If you are using Java 1.5 on MacOS 10.4 or 10.5 you will almost certainly need to run some version of the fixes described on
our <a href="http://confluence.concord.org/display/CCTR/How+to+fix+Mac+OS+X+WebStart+bugs">How to fix Mac OS X WebStart bugs</a>,
once on each computer you run the Concord SAIL-OTrunk activities on. If you update Java on your Macintosh you will
need to fix this problem again. The problem appears on Mac OS X computers when starting a Java Web Start program
you have run before -- if a jar file needs to be updated the download process will freeze without completing.</p>
<hr/>
HERE
  all_files = "<h4>All Files</h4><table>"

  Dir.glob("#{path}/*").sort.each do |subpath|
    filename = File.basename(subpath)
    if subpath =~ /.*otml$/
      svn_status = `svn status -v #{subpath}`
      re = / *(\d*) *(\d*)/
      match = re.match(svn_status)
      svn_rev1 = match[1]
      svn_rev2 = match[2]
      local_http_path = subpath[/.*otrunk-examples(.*)/, 1]
      example_name = filename[/(.*)\.otml/, 1]
      otml_url = "http://otrunk-examples#{local_http_path}"
      trac_otml_url = "http://trac.cosmos.concord.org/projects/browser/trunk/common/java/otrunk/otrunk-examples#{local_http_path}"
      jnlp_url = jnlp_url_tmpl.sub(/%otml_url%/, otml_url)
      jnlp_author_url = jnlp_url_tmpl_author.sub(/%otml_url%/, otml_url)
      if USE_TEXTMATE_URLS
        otml_display_url = "txmt://open?url=file://#{File.expand_path(subpath)}"
      else
        otml_display_url = "#{filename}"
      end
      otml_launchers += "<tr><td width=280>#{example_name}</td><td width=100><a href=""#{jnlp_url}"">learner</a></td><td width=120><a href=#{jnlp_author_url}>author</a></td><td width=280><a href=#{otml_display_url}>#{filename}</a></td>\n"
      if svn_rev2.empty? 
        otml_launchers += "<td width=180>not in svn</td></tr>"
      else
        otml_launchers += "<td width=180><a href=#{trac_otml_url}>#{svn_rev2}</a></td></tr>"
      end
    end   
    all_files += "<tr><td><a href=""#{filename}"">#{filename}</a></td></tr>\n"
  end
  
  otml_launchers += "</tbody></table><hr/>"
  all_files += "</table>"

  index_page_body = "<a href=""../example-index.html"">Examples Index ...</a><br/>\n"  +  
    "<a href=""http://confluence.concord.org/display/CSP/#{path}"">Confluence Notes</a><br/>\n" +
    otml_launchers + java_web_start_warning + description_of_jnlps + all_files

  index_page_body += "<hr/><p>The jnlp urls for #{File.basename(path)} were constructed using the following template:<p/>\n"
  index_page_body += "<p><code>#{jnlp_url_tmpl}</code></p>\n"
  index_page_body += "<p>You can change this string by putting it in a file named: <b>jnlp_url.tmpl</b> in the directory #{File.dirname(path)}</p>"
  
  writeHtmlPage("#{File.basename(path)} Examples", index_page_body, "#{path}/ot-index.html");
end
