importClass(Packages.java.awt.event.ActionListener);
importClass(Packages.javax.swing.JOptionPane);
importClass(Packages.org.concord.datagraph.analysis.Graph);
importClass(Packages.org.concord.datagraph.analysis.GraphSegment);
importClass(Packages.org.concord.datagraph.analysis.rubric.SegmentResult);
importClass(Packages.org.concord.datagraph.analysis.GraphAnalyzerProvider);
importClass(Packages.org.concord.datagraph.state.rubric.OTGraphSegmentCriterion);
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
  for ( var i = 0; i < graph.size(); i++) {
    var seg = graph.get(i);
    values.push(seg.getX1());
    values.push(seg.getY1());

    values.push(seg.getX2());
    values.push(seg.getY2());
  }
  realstore.setValues(2, values);
}

var annotations = null;

function highlight_incorrect(results, graph) {
  if (annotations != null && annotations.size() > 0) {
    for (var i = 0; i < annotations.size(); i++) {
      data_collector.getLabels().remove(annotations.get(i));
    }
  }
  annotations = graph_analysis_service.annotateResults(data_collector, results);
}

var analyzeListener = new ActionListener({
  actionPerformed: function(evt) {
    System.out.println("Action performed");
    
    var graph = graph_analysis_service.getSegments(drawn_ds, 0, 1);
    draw_graph(graph, interpreted_ds);

    JOptionPane.showMessageDialog(null, "Done!");
  }
});

var scoreListener = new ActionListener({
  actionPerformed: function(evt) {
    System.out.println("Action performed");

    expected_graph = graph_analysis_service.buildRubric(drawn_graphable.getRubric());
    // drawing disabled for now, since it's not clear how handle it with qualitative criteria (eg starts at 4, ends at 6 and has positive slope)
    // draw_graph(expected_graph, expected_ds);
    
    var graph = graph_analysis_service.getSegments(drawn_ds, 0, 1, drawn_graphable.getSegmentingTolerance());
    draw_graph(graph, interpreted_ds);

    var results = graph_analysis_service.compareGraphs(expected_graph, graph);

    highlight_incorrect(results, graph);

    var adjScore = results.getScore() * 10;
    adjScore = (adjScore - (adjScore % 1))/10.0;
    JOptionPane.showMessageDialog(null, "You scored " + adjScore + " out of " + results.getMaxScore() + "!");
  }
});

var expectedListener = new ActionListener({
  actionPerformed: function(evt) {
    expected_graphable.setVisible(!expected_graphable.getVisible());
  }
});

var interpretedListener = new ActionListener({
  actionPerformed: function(evt) {
    interpreted_graphable.setVisible(!interpreted_graphable.getVisible());
  }
});

var drawnListener = new ActionListener({
  actionPerformed: function(evt) {
    drawn_graphable.setVisible(!drawn_graphable.getVisible());
  }
});

function init() {
  System.out.println("init called");
  var obj_service = drawn_ds.getOTObjectService();
  graph_analysis_service = GraphAnalyzerProvider.findAnalyzer(GraphAnalyzerProvider.Type.ANY);
  controller_service = obj_service.createControllerService();

  analyze_button.addActionListener(analyzeListener);
  score_button.addActionListener(scoreListener);
  // expected_button.addActionListener(expectedListener);
  interpreted_button.addActionListener(interpretedListener);
  drawn_button.addActionListener(drawnListener);

  return true;
}

function save() {
  System.out.println("save called");
  return null;
}
