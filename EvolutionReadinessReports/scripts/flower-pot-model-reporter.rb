class FlowerPotModelReporter
  
  attr_reader :total_correct
  attr_reader :total_incorrect
  attr_reader :percent_correct
  attr_reader :correct_boxes
  attr_reader :types_planted_per_box
  attr_reader :planted_all_possibilities
  attr_reader :percent_correct
  attr_reader :correct_flowers
  
  def initialize(model)
    @total_correct = 0
    @total_incorrect = 0
    @correct_boxes = [0,0,0,0,0]
    @types_planted_per_box = [0,0,0,0,0]
    
    modelActivityData = model.modelActivityData
    if modelActivityData
      parseModelActivityData(modelActivityData)
    else
      Util.log("FlowerPotModelReporter: Model #{model} doesn't have model activity data")
    end
  end
  
  def parseModelActivityData(modelActivityData)
    modelActivityMatrix = calcModelActivityMatrix(modelActivityData)
    
    modelActivityMatrix.each do |run|
      run.each_with_index do |box, box_ix|
        next unless box
        box.each do |type|
          next unless type
          type.each do |correctness|
            if correctness == 1
              @total_correct += 1
              if @correct_boxes[box_ix] == 0
                @correct_boxes[box_ix] = 1
              end
            else
              @total_incorrect += 1
            end
          end
          @types_planted_per_box[box_ix] = box.length
        end
      end
    end
    if @total_incorrect + @total_correct != 0
      @percent_correct = @total_correct.to_f / (@total_incorrect + @total_correct) * 100
    end
    @correct_flowers = @correct_boxes.inject { |a, b| a + b }
    @planted_all_possibilities = @types_planted_per_box.inject { |a, b| a + b } == 15
  end
  
  def calcModelActivityMatrix(modelActivityData)
    modelActivityMatrix = []
    modelActivityData.modelRuns.each do |modelRun|
      modelActivityMatrix << calcModelRunMatrix(modelRun)
    end
    modelActivityMatrix
  end

  def calcModelRunMatrix(modelRun)
    modelRunMatrix = []
      
    modelRun.computationalInputValues.each do |civ|
      flowerBox, plantType, correctness = calculateArray(civ)
      modelRunMatrix[flowerBox] = [] unless modelRunMatrix[flowerBox]
      modelRunMatrix[flowerBox][plantType] = [] unless modelRunMatrix[flowerBox][plantType]
      modelRunMatrix[flowerBox][plantType] << correctness
    end
    
    modelRunMatrix
  end

  ## Returns an array with the flowerbox number, plant number, and correctness
  def calculateArray(computationalInputValue)
    values = computationalInputValue.values

    y = values.get('y')
    if y < 30
      flowerBox = 0
    elsif y < 60
      flowerBox = 1
    elsif y < 80
      flowerBox = 2
    elsif y < 110
      flowerBox = 3
    elsif y < 140
      flowerBox = 4
    else
      flowerBox = -1
      Util.error("Error calculating flower box. y = #{y}")
    end
    
    leaves = values.get('size of leaves')
    case leaves
    when 1
      plantType = 0
    when 5
      plantType = 1
    when 9
      plantType = 2
    else
      plantType = -1
      Util.error("Error calculating type of plant. Size of leaves = #{leaves}")
    end
    
    if (flowerBox == 0 && plantType == 0) ||
       (flowerBox == 2 && plantType == 1) ||
       (flowerBox == 4 && plantType == 2)
    then
      correctness = 1
    else
      correctness = 0
    end
  
    [flowerBox, plantType, correctness]
  end
end
