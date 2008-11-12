#! /usr/bin/ruby -w

require 'find'
require 'yaml'
require 'time'

puts "Content-type: text/plain\n\n"

# print error messages on stdout so we can see them in the browser
STDERR.reopen(STDOUT)

puts "Hello I am running as "
system("whoami")
puts ""

Dir.chdir("../otrunk/examples")
puts "In directory "
puts Dir.pwd

# update the content directories
puts `svn up`

def writeHtmlPage(title, body, filename)

  html_text = <<end_of_html
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en-US" xml:lang="en-US">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <link rel="stylesheet" type="text/css" media="all" href="/otrunk/examples/index-builder-script/style.css" />
  <script type="text/javascript" src="/otrunk/examples/index-builder-script/prototype.js"></script>
  <script type="text/javascript" src="/otrunk/examples/index-builder-script/fastinit.js"></script>
  <script type="text/javascript" src="/otrunk/examples/index-builder-script/tablesort.js"></script>	
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

otrunk_example_dirs = Dir.glob('*/*.otml').collect {|p| File.dirname(p)}.uniq

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
  index_page_body += "<tr><td><a href=""#{path}/ot-index.html"">#{path}</a></td>"
  index_page_body += "<td class='timestyle'>#{gmt_time}</td>"
  index_page_body += "<td>#{examples}</td></tr>\n"
end

index_page_body += "</tbody></table>"
index_page_body += "<hr/><br/><br/><a href=\"http://continuum.concord.org/cgi-script/build-index.rb
\">Update Index</a>"

writeHtmlPage("OTrunk Examples", index_page_body, "example-index.html")


otrunk_example_dirs.each do |path|
  if File.exists?("#{path}/jnlp_url.tmpl")
    jnlp_url_tmpl = File.read("#{path}/jnlp_url.tmpl")
  else      
    jnlp_url_tmpl = "http://rails.dev.concord.org/sds/2/offering/144/jnlp/540/view?sailotrunk.otmlurl=%otml_url%&sailotrunk.hidetree=false"
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
      # look up the file in the .svn/entries file to gets its svn commit number 
      svn_status = `svn status -v #{subpath}`
      re = / *(\d*) *(\d*)/
      match = re.match(svn_status)
      svn_rev1 = match[1]
      svn_rev2 = match[2]
      example_name = filename[/(.*)\.otml/, 1]
      otml_url = "http://continuum.concord.org/otrunk/examples/#{subpath}"
      trac_otml_url = "http://trac.cosmos.concord.org/projects/browser/trunk/common/java/otrunk/otrunk-examples/#{subpath}"
      jnlp_url = jnlp_url_tmpl.sub(/%otml_url%/, otml_url)
      jnlp_author_url = jnlp_url_tmpl_author.sub(/%otml_url%/, otml_url)
      otml_launchers += "<tr><td width=280>#{example_name}</td><td width=100><a href=""#{jnlp_url}"">learner</a></td><td width=120><a href=#{jnlp_author_url}>author</a></td><td width=280><a href=#{filename}>#{filename}</a></td><td width=180><a href=#{trac_otml_url}>#{svn_rev2}</a></td></tr>\n"
    end
    
    all_files += "<tr><td><a href=""#{filename}"">#{filename}</a></td></tr>\n"
  end
  otml_launchers += "</tbody></table><hr/>"
  all_files += "</table>"

  index_page_body = "<a href=""../example-index.html"">Examples Index ...</a><br/>\n"  +  
    "<a href=""http://confluence.concord.org/display/CSP/#{path}"">Confluence Notes</a><br/>\n" +
    otml_launchers + java_web_start_warning + description_of_jnlps + all_files

  index_page_body += "<hr/>The jnlp urls were constructed using the following template:<br/>\n"
  index_page_body += jnlp_url_tmpl + "<br/>\n"
  index_page_body += "You can change this string by putting it in a file named: <b>jnlp_url.tmpl</b> in this directory"
  writeHtmlPage("#{path} Examples", index_page_body, "#{path}/ot-index.html");
end
