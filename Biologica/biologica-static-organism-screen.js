importPackage(Packages.org.concord.biologica);
importPackage(Packages.org.concord.biologica.ui);
importPackage(Packages.org.concord.biologica.engine);
importPackage(Packages.java.lang);
importPackage(Packages.java.beans);

var maleChromosomeView = context.getViewForObject("maleChromosome").getChromosomeView();
var maleOrganismView = context.getComponentForObject("maleStaticOrganism");
var femaleChromosomeView = context.getViewForObject("femaleChromosome").getChromosomeView();
var femaleOrganismView = context.getComponentForObject("femaleStaticOrganism");

// System.err.println("mcv is a " + maleChromosomeView.getClass().getName());
// System.err.println("fcv is a " + femaleChromosomeView.getClass().getName());

var maleOrg = maleOrganismView.getOrganism();
var femaleOrg = femaleOrganismView.getOrganism();

var oldMaleAlleles = maleOrg.getAlleleString();
var oldFemaleAlleles = femaleOrg.getAlleleString();

var species = maleOrg.getWorld().getCurrentSpecies();
var genes = species.getGeneList();

var propertyChangeHandler =
{
	propertyChange: function(evt)
	{
		if ((evt.getPropertyName() == EngineProp.ORGANISM_GENOTYPE_AND_NOT_PHENOTYPE) || 
			(evt.getPropertyName() == EngineProp.ORGANISM_GENOTYPE_AND_PHENOTYPE))
		{
			var theOrg = evt.getSource();
			var theAlleles = theOrg.getAlleleString();
			theName = theOrg.getName();
			if (theName == "male")
			{
				var comparisonAlleles = oldMaleAlleles;
				oldMaleAlleles = theAlleles;
			}
			else
			{
				var comparisonAlleles = oldFemaleAlleles;
				oldFemaleAlleles = theAlleles;
			}
			var comparisonChromoAlleleArray = comparisonAlleles.split(",",0);
			var theChromoAlleleArray = theAlleles.split(",",0);

			compareAlleles(theChromoAlleleArray,comparisonChromoAlleleArray);
			
		}

	}
};

var propertyChangeListener = new PropertyChangeListener(propertyChangeHandler);

function init() {
  // maleChromosomeView.setOrganism(maleOrg);
  // maleOrganismView.setOrganism(maleOrg);
  // femaleChromosomeView.setOrganism(femaleOrg);
  // femaleOrganismView.setOrganism(femaleOrg);
  
  maleOrg.addPropertyChangeListener(propertyChangeListener);
	femaleOrg.addPropertyChangeListener(propertyChangeListener);
	
  return true;
}

function save() {
	maleOrg.removePropertyChangeListener(propertyChangeListener);
	// femaleOrg.removePropertyChangeListener(propertyChangeListener);
}

function compareAlleles(newChromoAlleleArray, oldChromoAlleleArray)
{
	if (!newChromoAlleleArray.length == oldChromoAlleleArray.length)
	{
		System.out.println("Different allele array lengths!");
		return;
	} 
	for (i=0; i < newChromoAlleleArray.length; i++)
	{
		var newChromoAllele = newChromoAlleleArray[i];
		var oldChromoAllele = oldChromoAlleleArray[i];

//		System.out.println("newChromoAllele = " + newChromoAllele + ", oldChromoAllele = " + oldChromoAllele);

		var oldChromo = oldChromoAllele.split(":",2)[0];
		var oldAllele = oldChromoAllele.split(":",2)[1];
		var newChromo = newChromoAllele.split(":",2)[0];
		var newAllele = newChromoAllele.split(":",2)[1];

//		System.out.println("New allele = " + newAllele + ", old allele = " + oldAllele);

		if (!newAllele.equals(oldAllele))
		{
			var geneIndex = i/2;
			var chromoStr;
			if (geneIndex < 2) chromoStr = "1";
			else if (geneIndex < 5) chromoStr = "2";
			else if (geneIndex > 4) chromoStr = "X";

			System.out.println("You changed the " + theName + " " + species.getName() + ", " + "Chromosome: " + chromoStr + oldChromo
				+ ", " + genes.get(geneIndex) + ", new Allele: " + newAllele + ", old Allele: " + oldAllele);

			return;
		}
//		System.out.println("No mismatch found at position " + i);
	}
}
