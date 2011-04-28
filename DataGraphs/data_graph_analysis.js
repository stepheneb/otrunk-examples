importClass(Packages.java.awt.event.ActionListener);
importClass(Packages.javax.swing.JOptionPane);
importClass(Packages.org.concord.otrunk.graph.analysis.Graph);
importClass(Packages.org.concord.otrunk.graph.analysis.GraphSegment);
importClass(Packages.org.concord.otrunk.graph.analysis.EvaluationResult);
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
  for ( var i = 0; i < graph.size(); i++) {
    var seg = graph.get(i);
    values.push(seg.getX1());
    values.push(seg.getY1());

    values.push(seg.getX2());
    values.push(seg.getY2());
  }
  realstore.setValues(2, values);
}

function highlight_incorrect(results, graph) {
  var reasons = results.getReasons();
  for ( var i = 0; i < reasons.size(); i++) {
    var res = reasons.get(i);
    var seg = null;
    
    if (res.getReason().equals(EvaluationResult.Reason.SEGMENT_MISSING)) {
      seg = res.getExpected();
    } else {
      seg = res.getReceived();
    }

    if (res.getReason().equals(EvaluationResult.Reason.MATCH)) {
      continue;
    }
    var highlight = drawn_graphable.getOTObjectService().createObject(Class.forName("org.concord.datagraph.state.OTDataRegionLabel"));
    highlight.setDataGraphable(drawn_graphable);

    highlight.setX(seg.getX1());
    highlight.setY(4);

    highlight.setX1(seg.getX1());
    highlight.setX2(seg.getX2());

    if (res.getReason().equals(EvaluationResult.Reason.MISMATCHED_BEGINNING_POINT)) {
      highlight.setText("Wrong starting point.");
    } else if (res.getReason().equals(EvaluationResult.Reason.MISMATCHED_END_POINT)) {
      highlight.setText("Wrong ending point.");
    } else if (res.getReason().equals(EvaluationResult.Reason.MISMATCHED_SLOPE)) {
      highlight.setText("Wrong slope.");
    } else if (res.getReason().equals(EvaluationResult.Reason.SEGMENT_MISSING)) {
      highlight.setText("Missing segment.");
    } else if (res.getReason().equals(EvaluationResult.Reason.SEGMENT_EXTRA)) {
      highlight.setText("Extra segment.");
    } else {
      highlight.setText("Unknown problem.");
    }

    System.out.println("Adding label.");
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

    var score = graph_analysis_service.score(results);

    JOptionPane.showMessageDialog(null, "You scored " + score + " out of " + expected_graph.size() + "!");
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
  graph_analysis_service = obj_service.getOTrunkService(Class.forName("org.concord.otrunk.graph.analysis.OTGraphAnalysisService"));
  controller_service = obj_service.createControllerService();

  analyze_button.addActionListener(analyzeListener);
  expected_button.addActionListener(expectedListener);
  interpreted_button.addActionListener(interpretedListener);
  drawn_button.addActionListener(drawnListener);

  // for whatever reason, the graph x axis is always in seconds
  expected_graph = graph_analysis_service.buildRubric(drawn_graphable.getRubric());

  draw_graph(expected_graph, expected_ds);

  return true;
}

function save() {
  System.out.println("save called");
  return null;
}
