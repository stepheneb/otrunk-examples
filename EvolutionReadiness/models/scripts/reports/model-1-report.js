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

function init(){
	var model_activity_matrix = calculateMatrix1(model.getModelActivityData())
	
	var total_correct = 0
	var total_incorrect = 0
	var correct_boxes = [0,0,0,0,0]
	var types_planted_per_box = [0,0,0,0,0]
	for (run in model_activity_matrix)
		for (box in model_activity_matrix[run]){
			for (type in model_activity_matrix[run][box])
				for (c in model_activity_matrix[run][box][type]){
					if (model_activity_matrix[run][box][type][c] == 1){
						total_correct++
						if (correct_boxes[box] == 0)
							correct_boxes[box] = 1
					} else
						total_incorrect++
				}
			types_planted_per_box[box] = model_activity_matrix[run][box].length
		}
						
	System.out.println("total correct = "+total_correct)
	System.out.println("total incorrect = "+total_incorrect)
	System.out.println("percent correct = "+((total_correct / total_incorrect)*100)+"%")
	System.out.println("correct_boxes = "+correct_boxes)
	var total_boxes = 0
	for (c in correct_boxes)
		total_boxes += correct_boxes[c]
	System.out.println("total correct flowers = "+total_boxes+"/3")
	System.out.println("types planted per box = "+types_planted_per_box)
	var total_types_per_box = 0
	for (t in types_planted_per_box)
		total_types_per_box += types_planted_per_box[t]
	var filled_matrix = total_types_per_box == 15 ? true : false
	System.out.println("planted all possibilities? "+filled_matrix)
	
}