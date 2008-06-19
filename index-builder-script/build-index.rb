#! /usr/bin/ruby -w

require 'find'

puts "Content-type: text/plain\n\n"

# print error messages on stdout so we can see them in the browser
STDERR.reopen(STDOUT)

puts "Hello I am running as "
system("whoami")
puts ""

Dir.chdir("../otrunk/examples")
puts "In directory "
puts Dir.pwd

puts ""
system("svn up")

def writeHtmlPage(title, body, filename)

html_text = <<end_of_html
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2//EN">
<HTML>

<HEAD>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html;CHARSET=iso-8859-1">
<TITLE>#{title}</TITLE>
<style type="text/css">
h3 {margin-bottom: 0.5em; margin-top:2em; border-bottom: 1px solid }
h4 {margin-bottom: 0.2em}
</style>
</HEAD>

<BODY BGCOLOR="#FFFFFF">
<h2>#{title}</h2>
#{body}
</BODY>
</HTML>
end_of_html

current = File.open(filename, "w")
current.write(html_text)
current.close

end

index_page_body = "<table>"

excludes = ["CVS",".svn",".",".."]

dir = Dir.new(".")
dir.sort.each do |path|
  if FileTest.directory?(path)
    if excludes.include?(File.basename(path))
    else
      index_page_body += "<tr><td><a href=""#{path}/ot-index.html"">#{path}</a></td></tr>"
    end    
  end
end

index_page_body += "</table>"
index_page_body += "<hr/><br/><br/><a href=""http://continuum.concord.org/cgi-script/hello.rb"">Update Index</a>"

writeHtmlPage("OTrunk Examples", index_page_body, "example-index.html")


dir.each do |path|
  if FileTest.directory?(path)
    if excludes.include?(File.basename(path))
    else      
      jnlp_url_tmpl = "http://rails.dev.concord.org/sds/2/offering/144/jnlp/540/view?sailotrunk.otmlurl=%otml_url%&sailotrunk.hidetree=false"

      jnlp_url_tmpl_file_name = "#{path}/jnlp_url.tmpl"
      if FileTest.exists?(jnlp_url_tmpl_file_name)
        tmp_io = File.open(jnlp_url_tmpl_file_name, "r")
        jnlp_url_tmpl = tmp_io.read()
        tmp_io.close()
      end

      # Append: jnlp properties: otrunk.view.author=true and otrunk.view.mode=authoring
      jnlp_url_tmpl_author = jnlp_url_tmpl + "&jnlp_properties=otrunk.view.author%253Dtrue%2526otrunk.view.mode%253Dauthoring"

      subdir = Dir.new(path)
      otml_launchers = "<h4>Run Examples</h4> <table cellspacing=2><tr><td><b>example</b></td><td colspan=2><b>java web start jnlps</b></td><td><b>otml file</b></td><td><b>most recent revision</b></td></tr>"

      description_of_jnlps = <<HERE
<h4>Description of the difference between the learner and author mode jnlps</h4>
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
<p>If you are using Java 1.5 on MacOS 10.4 or 10.5 you will almost certainly need to run some version of 
our <a href="http://confluence.concord.org/display/CCTR/WebStart+OSX+Java+1.5+Fix">Fix Java MacOS Web Start Scripts</a>,
once on each computer you run the Concord SAIL-OTrunk activities on. If you update Java on your Macintosh you will
need to fix this problem again. The problem appears on Mac OS X computers when starting a Java Web Start program
you have run before -- if a jar file needs to be updated the download process will freeze without completing.</p>
<hr/>
HERE
      all_files = "<h4>All Files</h4><table>"

      subdir.each do |subpath|
          if subpath =~ /.*otml$/
            # look up the file in the .svn/entries file to gets its svn commit number 

            svn_status = `svn status -v #{path}/#{subpath}`
            # trim off the first 8 chars as they are status info we dont' care about
            svn_status = svn_status[8,svn_status.length-8]
            svn_status_arr = svn_status.split(' ')
            
            example_name = subpath[/(.*)\.otml/, 1]
            otml_url = "http://continuum.concord.org/otrunk/examples/#{path}/#{subpath}"
            trac_otml_url = "http://trac.cosmos.concord.org/projects/browser/trunk/common/java/otrunk/otrunk-examples/#{path}/#{subpath}"
            jnlp_url = jnlp_url_tmpl.sub(/%otml_url%/, otml_url)
            jnlp_author_url = jnlp_url_tmpl_author.sub(/%otml_url%/, otml_url)
            otml_launchers += "<tr><td width=240>#{example_name}</td><td width=100><a href=""#{jnlp_url}"">learner mode</a></td><td width=140><a href=#{jnlp_author_url}>author mode</a></td><td width=280><a href=#{subpath}>#{subpath}</a></td><td width=180><a href=#{trac_otml_url}>rev #{svn_status_arr[1]} #{svn_status_arr[2]}</a></td></tr>"
          end
          
          all_files += "<tr><td><a href=""#{subpath}"">#{subpath}</a></td></tr>"
      end
      otml_launchers += "</table><hr/>"
      all_files += "</table>"

      index_page_body = "<a href=""../example-index.html"">Examples Index</a><br/>\n"  +  
        "<a href=""http://confluence.concord.org/display/CSP/#{path}"">Confluence Notes</a><br/>\n" +
        otml_launchers + java_web_start_warning + description_of_jnlps + all_files

      index_page_body += "<hr/>The jnlp urls were constructed using the following template:<br/>\n"
      index_page_body += jnlp_url_tmpl + "<br/>\n"
      index_page_body += "You can change this string by putting it in a file named: <b>jnlp_url.tmpl</b> in this directory"
      writeHtmlPage("#{path} Examples", index_page_body, "#{path}/ot-index.html");
    end    
  end
end
