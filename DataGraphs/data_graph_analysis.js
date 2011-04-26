importClass(Packages.java.awt.event.ActionListener);
importClass(Packages.javax.swing.JOptionPane);
importClass(Packages.org.concord.otrunk.graph.analysis.Graph);
importClass(Packages.org.concord.otrunk.graph.analysis.GraphSegment);
importClass(Packages.org.concord.otrunk.graph.analysis.OTGraphAnalysisService);
importClass(Packages.org.concord.datagraph.state.OTDataRegionLabel);
importClass(Packages.java.lang.System);
importClass(Packages.java.lang.Class);

var graph_analysis_service;
var controller_service;
var expected_graph;

function draw_graph(graph, datastore) {
	var realstore = controller_service.getRealObject(datastore);
	realstore.clearValues();
	var values = [];
	for (var i = 0; i < graph.size(); i++) {
		var seg = graph.get(i);
	  values.push(seg.getX1());
	  values.push(seg.getY1());
	  
	  values.push(seg.getX2());
	  values.push(seg.getY2());
	}
	realstore.setValues(2, values);
}

function highlight_incorrect(results, graph) {
	for (var i = 0; i < results.size(); i++) {
		var res = results.get(i);
		var seg = null;
		if (i < graph.size()) {
	      seg = graph.get(i);
		} else {
	      seg = expected_graph.get(i);
		}
		
	    if (res.equals(GraphSegment.EvaluationResult.MATCH)) {
	    	continue;
	    }
		var highlight = drawn_graphable.getOTObjectService().createObject(Class.forName("org.concord.datagraph.state.OTDataRegionLabel"));
		highlight.setDataGraphable(drawn_graphable);
		
		highlight.setX(seg.getX1());
		highlight.setY(4);
		
		highlight.setX1(seg.getX1());
		highlight.setX2(seg.getX2());
		
		if (res.equals(GraphSegment.EvaluationResult.MISMATCHED_BEGINNING_POINT)) {
	    	highlight.setText("Wrong starting point.");
	    } else if (res.equals(GraphSegment.EvaluationResult.MISMATCHED_BEGINNING_POINT)) {
	    	highlight.setText("Wrong ending point.");
	    } else if (res.equals(GraphSegment.EvaluationResult.MISMATCHED_END_POINT)) {
	    	highlight.setText("Wrong slope.");
	    } else if (res.equals(GraphSegment.EvaluationResult.SEGMENT_MISSING)) {
	    	highlight.setText("Missing segment.");
	    } else if (res.equals(GraphSegment.EvaluationResult.SEGMENT_EXTRA)) {
	    	highlight.setText("Extra segment.");
	    } else {
	    	highlight.setText("Unknown problem.");
	    }
		
		data_collector.getLabels().add(highlight);
	}
}

var analyzeListener = new ActionListener({
	  actionPerformed: function(evt) {
	    System.out.println("Action performed");
	    var graph = graph_analysis_service.getSegments(drawn_ds, 0, 1);
	    draw_graph(graph, interpreted_ds);
	    
	    var results = graph_analysis_service.compareGraphs(expected_graph, graph);
	    
	    highlight_incorrect(results, graph);
	    
	    var score = 0;
	    for (var i = 0; i < results.size(); i++) {
	      var res = results.get(i);
	      if (res.equals(GraphSegment.EvaluationResult.MATCH)) {
	        score += 1; 
	      }
	      if (res.equals(GraphSegment.EvaluationResult.SEGMENT_EXTRA)) {
	        score -= 0.2;
	      }
	    }
	    
	    JOptionPane.showMessageDialog(null, "You scored " + score + " out of " + expected_graph.size() + "!");
	  }
	});



var expectedListener = new ActionListener({
  actionPerformed: function(evt) {
    expected_graphable.setVisible(! expected_graphable.getVisible());
  }
});

var interpretedListener = new ActionListener({
  actionPerformed: function(evt) {
    interpreted_graphable.setVisible(! interpreted_graphable.getVisible());
  }
});

var drawnListener = new ActionListener({
	  actionPerformed: function(evt) {
	    drawn_graphable.setVisible(! drawn_graphable.getVisible());
	  }
	});
	

function init() {
  System.out.println("init called");
  var obj_service = drawn_ds.getOTObjectService();
  graph_analysis_service = obj_service.getOTrunkService(Class.forName("org.concord.otrunk.graph.analysis.OTGraphAnalysisService"));
  controller_service = obj_service.createControllerService();
  
  analyze_button.addActionListener(analyzeListener);
  expected_button.addActionListener(expectedListener);
  interpreted_button.addActionListener(interpretedListener);
  drawn_button.addActionListener(drawnListener);
  
  // for whatever reason, the graph x axis is always in seconds
  expected_graph = new Graph();
  expected_graph.add(new GraphSegment(0,1500,0,2.0/1500,0));
  expected_graph.add(new GraphSegment(1500,2400,0,0,2));
  expected_graph.add(new GraphSegment(2400,4500,0,-2.0/2100,30.0/7));
    
  draw_graph(expected_graph, expected_ds);
  
  return true;
}



function save() {
  System.out.println("save called");
  return null;
}
