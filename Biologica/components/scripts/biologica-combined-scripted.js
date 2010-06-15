importClass(Packages.org.concord.framework.otrunk.OTChangeListener);
importClass(Packages.java.lang.System);

var normal_choice;
var static_organism;
var male_dragon;
var female_dragon;
// var ot_console;
var chromosome;
var male = "Male";
var female = "Female";
var male_alleles;
var female_alleles;

function updateChosen() {
   if (normal_choice.getCurrentChoices().size() > 0) {
      chosen = normal_choice.getCurrentChoices().get(0);
      var label = chosen.name;
      if (label == male) {
        static_organism.setOrganism(male_dragon);
        chromosome.setOrganism(male_dragon);
        // ot_console.setText("male");
      }
      if (label == female) {
        static_organism.setOrganism(female_dragon);
        chromosome.setOrganism(female_dragon);
        // ot_console.setText("female");
      }
    }
}

var changeHandler = {
	stateChanged: function(evt) {
      if (evt.source == normal_choice) {
          updateChosen();
      }
	}
};

var changeListener = new OTChangeListener(changeHandler);



function init(args) {
    normal_choice.addOTChangeListener(changeListener);
	return true;
}



function updateView() {
}

function updateModel() {
}

function initView(model, prototypeCopy) {
}

function save() {
  return true;
}
function close() {
	// Do nothing right now.
}

