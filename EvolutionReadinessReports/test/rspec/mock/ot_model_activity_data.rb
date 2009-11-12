class MockOTModelActivityData
  
  require 'yaml'
  
  FixtureDir ='fixture/model-activity-data'
  
  def initialize(yamlFileName)
    open("#{FixtureDir}/#{yamlFileName}") do |f|
      @yamlHash = YAML::load(f)
    end
  end
  
  def modelRuns
    @yamlHash['modelRuns'].collect { |modelRun| MockOTModelRun.new(modelRun) }
  end
  
end

class MockOTModelRun
  
  def initialize(yamlHash)
    @yamlHash = yamlHash
  end
  
  def computationalInputValues
    @yamlHash['computationalInputValues'].collect do |civ|
      MockComputationalInputValue.new(civ)
    end
  end
  
end

class MockComputationalInputValue
  
  def initialize(yamlHash)
    @yamlHash = yamlHash
  end
  
  def values
    MockOTResourceMap.new(@yamlHash['values'])
  end
  
end

class MockOTResourceMap
  
  def initialize(yamlHash)
    @yamlHash = yamlHash
  end
  
  def get(propName)
    @yamlHash[propName]
  end
  
end
