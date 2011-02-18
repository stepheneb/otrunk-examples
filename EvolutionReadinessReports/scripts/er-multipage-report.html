require 'jruby'
require 'erb'

include_class 'java.lang.System'

include_class 'org.concord.framework.otrunk.wrapper.OTString'
include_class 'org.concord.datagraph.state.OTDataGraph'
include_class 'org.concord.datagraph.state.OTDataGraphable'
include_class 'org.concord.otrunk.OTrunkUtil'

ROWCOLOR1 = "#FFFEE9"
ROWCOLOR2 = "#FFFFFF"

# Called when the script view is loaded
def getText
  initReport
  if $action
    actionStr = $action.string
  else
    actionStr = "default_template"
  end
  eval(actionStr)
end

def initReport
  @debug = true
  
  otImport($util_script)
  otImport($otrunk_helper_script)
  otImport($erb_helper_script)
  otImport($question_helper_script)
  otImport($activity_helper_script)
  otImport($flower_pot_model_reporter_script)

  @otrunkHelper = OTrunkHelper.new($otObjectService, $viewContext)
  @erbHelper = ErbHelper.new(@otrunkHelper)
  @activity = ERActivityHelper.new(activityRoot, @otrunkHelper)
  @questionHelper = QuestionHelper.new(@otrunkHelper)
end

def otImport(script)
  if script
      srcProp = script.otClass().getProperty('src')
      srcValue = script.otGet(srcProp)
      eval(Java::JavaLang::String.new(script.src).to_s, nil, srcValue.getBlobURL().toExternalForm())
  else
    System.err.println("Cannot import #{script.inspect}")
  end
end

def default_template
  @erbHelper.render($template, binding)
end

## Root object of the (included) activity for which the report
## is to be generated
def activityRoot
  @otrunkHelper.rootObject.reportTemplate.reference
end

def modelReporterClass(model)
  stringObj = OTrunkUtil.getObjectFromMapWithIdKeys($model_reports_map.map, model)
  stringObj ? Object.const_get(stringObj.string) : nil
end

def createModelReporter(model)
  modelReporterClass(model).new(model)
end
