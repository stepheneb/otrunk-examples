describe "FlowerPotModelReporter" do
  require '../../scripts/flower-pot-model-reporter'
  require 'mock/ot_model_activity_data'
  
  def mockModelFromYml(ymlFileName)
    mad = MockOTModelActivityData.new(ymlFileName)
    model = double('Flower Pot Model') #Mock OTEnvironmentHolder
    model.stub(:modelActivityData).and_return(mad)
    model
  end
  
  it "should report correct numbers from the model data" do
    model = mockModelFromYml('model-activity-data-1.yml')
    reporter = FlowerPotModelReporter.new(model)
    reporter.total_correct.should == 2
    reporter.total_incorrect.should == 1
    reporter.percent_correct.should == 2 /3.0 * 100
    reporter.correct_boxes.should == [1, 0, 0, 0, 1]
    reporter.correct_flowers.should == 2
    reporter.types_planted_per_box.should == [2, 0, 0, 0, 1]
  end
  
  it "should deal with empty model data gracefully" do
    model = mockModelFromYml('empty-1.yml')
    lambda { FlowerPotModelReporter.new(model) }.should_not raise_error
    reporter = FlowerPotModelReporter.new(model)
    reporter.total_correct.should == 0
    reporter.total_incorrect.should == 0
    reporter.percent_correct.should == nil
    reporter.correct_boxes.should == [0, 0, 0, 0, 0]
    reporter.correct_flowers.should == 0
    reporter.types_planted_per_box.should == [0, 0, 0, 0, 0]
  end
  
end
