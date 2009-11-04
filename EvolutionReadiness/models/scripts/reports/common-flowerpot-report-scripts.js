/**
* Returns a 5 x 3 matrix, with 1's and 0's representing correct and incorrect plantings:
*
* [[1111][0][000]]    -- four correctly planted type 1's, four incorrect type 2 and 3's
* [[0][0][000]]
* [[000][11][]]       -- 2 correct, 2 incorrect, and type 3 never planted
* [[0][0][0]]
* [[0][0][1]]
*
* Total number of 1's in this matrix are total planted correctly, total 0's are total
* planted incorrectly.
*/

importPackage(Packages.java.lang);

function calculateMatrix1(model_activity_data){
	var model_activity_matrix = []
	for (var i = 0; i < model_activity_data.getModelRuns().size(); i++){
		var model_run_matrix = calculateMatrix2(model_activity_data.getModelRuns().get(i))
		model_activity_matrix.push(model_run_matrix)
	}
	
	return model_activity_matrix
}

function calculateMatrix2(model_run){
	var model_run_matrix = []
	
	
    for (var i = 0; i < model_run.getComputationalInputValues().size(); i++){
		var result = calculateArray(model_run.getComputationalInputValues().get(i))
		var flower_box = result[0]
		var type_of_plant = result[1]
		var correctness = result[2]
		if (model_run_matrix[flower_box] == null)
			model_run_matrix[flower_box] = []
		if (model_run_matrix[flower_box][type_of_plant] == null)
			model_run_matrix[flower_box][type_of_plant] = []
		model_run_matrix[flower_box][type_of_plant].push(correctness)
	}
				
	return model_run_matrix
	
}

/**
* Returns an array with the flowerbox number, plant number, and correctness
*/
function calculateArray(computational_input_value){
	var values = computational_input_value.getValues()
	
	var y = values.get("y")
	var flower_box
	if (y < 30)
		flower_box = 0
	else if (y < 60)
		flower_box = 1
	else if (y < 80)
		flower_box = 2
	else if (y < 110)
		flower_box = 3
	else if (y < 140)
		flower_box = 4
	else
		System.out.println("error calculating flower box. y = "+y)
		
	var leaves = values.get("size of leaves")
	var type_of_plant
	if (leaves == 1)
		type_of_plant = 0
	else if (leaves == 5)
		type_of_plant = 1
	else if (leaves == 9)
		type_of_plant = 2
	else
		System.out.println("error calculating type of plant. Size of leaves = "+leaves)
	
		
	var correctness
	if ((flower_box == 0 && type_of_plant == 0) ||
			(flower_box == 2 && type_of_plant == 1) ||
			(flower_box == 4 && type_of_plant == 2))
		correctness = 1
	else
		correctness = 0
	
	return [flower_box, type_of_plant, correctness]
}