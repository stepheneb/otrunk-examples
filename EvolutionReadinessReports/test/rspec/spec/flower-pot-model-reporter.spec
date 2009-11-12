describe "FlowerPotModelReporter" do
  require '../../scripts/flower-pot-model-reporter'
  require 'mock/ot_model_activity_data'
  
  it "should report correct numbers from the model data" do
    mad = MockOTModelActivityData.new("model-activity-data-1.yml")
    model = double('Flower Pot Model') #Mock OTEnvironmentHolder
    model.stub(:modelActivityData).and_return(mad)
    reporter = FlowerPotModelReporter.new(model)
    reporter.total_correct.should == 2
    reporter.total_incorrect.should == 1
  end
  
end
