if $libraryScript
  # load in the library
  eval(Java::JavaLang::String.new($libraryScript.src).to_s)
end

def getText
  @otrunk = $viewContext.getViewService(OTrunk.java_class);
  render($template)
end









