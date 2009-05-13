#! /usr/local/bin/ruby -w

start_time = Time.now

puts "Content-type: text/plain\n\n"
puts "Starting"

require 'erb'
require 'yaml'

load 'util.rb'

# print error messages on stdout so we can see them in the browser
STDERR.reopen(STDOUT)

puts "Hello I am running as " + `whoami`
puts "svn location: " + `which svn`
puts "svn version: " + `svn --version --quiet` 

$erb = ERB.new File.read("index.erb")
$erb.filename = "index.erb"

$build_page_script = File.expand_path("build-page.rb")

config = YAML::load_file("config.yml")
config.default= "";

HOST = config['host']
SUB_DIR = config['subdir']
FILES_ROOT = config.fetch('files_root', '..')
NO_SERVER = config['no_server']

FOLDERS = YAML::load_file("folders.yml")

puts "host: #{HOST}"
puts "subdir: #{SUB_DIR}"
puts "files_root: #{FILES_ROOT}"
puts "no_server: #{NO_SERVER}"

Dir.chdir(FILES_ROOT)

if NO_SERVER
  $html_resource_root = "file:///#{Dir.pwd}"
  INDEX_SUFFIX = "index.html"
else
  $html_resource_root = "#{SUB_DIR}/examples/index-builder-script" 
  $web_root_url = "#{HOST}#{SUB_DIR}"
  $web_root_directory = Dir.pwd
  INDEX_SUFFIX = ""
end
 
FOLDERS.each do |folder, svn_path|
  if ! File.directory?(folder)
    puts `svn co http://svn.concord.org/svn/projects/#{svn_path}  #{folder}`
    STDOUT.flush
  end

  tree = FileTree.new(folder, nil)
  #tree.print_tree
  #STDOUT.flush

  Dir.chdir(folder) do 
    # don't need the web_* because we aren't using the server (I don't think)
    # web_root_directory -  the web_directory so it can be stripped and replaced
    # web_root_url - the root url corresponding to the url above

    $svn_root_directory = Dir.pwd
    $svn_root_path = svn_path

    tree.recurse_otml_dirs do |node|
      Dir.chdir(node.abs_path) do
        $tree_node = node
        load $build_page_script
      end
    end
  end

end

puts "Total Time: #{Time.now - start_time}s"