#!/usr/local/bin/ruby

require 'find'

body_html="<ul>"

excludes = ["CVS"]
Find.find(".") do |path|
  if FileTest.directory?(path)
    if excludes.include?(File.basename(path))
        Find.prune       # Don't look any further into this directory.
    else
      next
    end
  else
    if path =~ /.*otml$/
      otml_file = path[2,path.length-2]
      jnlp_url = "http://rails.dev.concord.org/sds/2/offering/144/jnlp/540/view?sailotrunk.otmlurl=http://continuum.concord.org/otrunk/examples/#{otml_file}&sailotrunk.hidetree=false"
      body_html += "<li>#{otml_file} - <a href=\"#{jnlp_url}\">jnlp</a> - <a href=\"#{otml_file}\">otml</a></li>\n"
    end
  end
end

body_html += "</ul>"

heading_html = <<end_of_html
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2//EN">
<HTML>

<HEAD>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html;CHARSET=iso-8859-1">
<TITLE>OTrunk Examples</TITLE>
<style type="text/css">
h3 {margin-bottom: 0.5em; margin-top:2em; border-bottom: 1px solid }
h4 {margin-bottom: 0.2em}
</style>
</HEAD>

<BODY BGCOLOR="#FFFFFF">
<h2>OTrunk Examples</h2>
end_of_html

ending_html = <<end_of_html
</BODY>
</HTML>
end_of_html

current = File.open("example-index.html", "w")
current.write(heading_html)
current.write(body_html)
current.write(ending_html)
current.close
