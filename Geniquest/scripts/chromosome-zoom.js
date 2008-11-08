importClass(Packages.java.lang.System);

var thing = 0;

function clicked() {
  /* System.err.println("zoomView is a: " + zoomView.getClass());
  var arr = zoomView.getClass().getMethods();
  System.err.println("there are " + arr.length + " methods");
  for (var i = 0; i < arr.length; i++) {
    System.err.println("Method: " + arr[i].getName());
  }
  */
  var choice = thing % 3;
  if (choice == 0) {
    zoomView.setChromosomeLocation(50.0);
  } else if (choice == 1) {
    zoomView.setChromosomeLocation(75.0, false);
  } else if (choice == 2) {
    zoomView.setZoomLevel(65);
  }
  
  thing++;
}
