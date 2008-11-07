require 'java' 
require 'rbconfig'
require 'erb'

include_class 'javax.swing.JOptionPane'

include_class 'org.concord.framework.otrunk.OTrunk'
include_class 'org.concord.otrunk.biologica.OTBreedOffspring'
include_class 'org.concord.otrunk.biologica.OTOrganism'
include_class 'org.concord.otrunk.biologica.OTWorld'
include_class 'org.concord.otrunk.biologica.OTChromosome'
include_class 'org.concord.otrunk.biologica.OTStaticOrganism'
include_class 'org.concord.otrunk.biologica.OTSex'
include_class 'org.concord.otrunk.ui.OTChoiceWithFeedback'
include_class 'org.concord.otrunk.ui.OTText'

import org.concord.otrunk.biologica
import org.concord.otrunk.biologica.ui
import org.concord.biologica.engine
import org.concord.biologica.test
import java.lang
import java.beans
import org.rosuda.JRI.REXP;
import org.rosuda.JRI.RFactor;
import org.rosuda.JRI.RVector;
import org.rosuda.JRI.Rengine;

include_class 'org.concord.otrunk.view.OTFolderObject'
include_class 'org.concord.biologica.engine.EngineProp'

def self.init
  puts "self.init called"

end

def self.clicked
  @button_response = ButtonResponse.new
  @button_response.clicked
end

class ButtonResponse
  $QTLMotherInternal= $QTLMother
  def clicked
    puts "Running QTL test script"
    puts $QTLMotherInternal.organism.name
    puts $QTLMotherInternal.organism.sex
    SimulatedMarkerTest.doSimulation()
  end
end

public class SimulatedMarkerTest {
	
	private static Logger logger = Logger.getLogger(SimulatedMarkerTest.class.toString());

	private int numberOfIndividuals = 100;
	private Vector qtlLocations;
	
	public SimulatedMarkerTest(int numberOfIndividuals, Vector qtlLocations) {
		this.numberOfIndividuals = numberOfIndividuals;
		this.qtlLocations = qtlLocations;
	}
	
	public void doSimulation() {
		World world = new World("org/concord/biologica/worlds/drake.xml");
		Organism mother = new Organism(world, "f0Mother", Organism.FEMALE, world.getCurrentSpecies());
		
		try {
			File tempFolder = new File(System.getProperty("java.io.tmpdir"));
			tempFolder.mkdir();
			File qtlTempFile = File.createTempFile("qtl-", ".csv", tempFolder);
			FileWriter  fw = new FileWriter(qtlTempFile);
			
			// Columns are: id, sex, pgm, pheno, marker, marker, marker...

			System.out.print("\nCSV input file to r/qtl analysis:\n\n");
			System.out.print("DragonID,sex,pgm,TraitName");
			fw.write("DragonID,sex,pgm,TraitName");
			Vector markerChromo = new Vector();
			Vector markerLocations = new Vector();
			
			// print all of the markers
			Enumeration chromos = mother.getOrganismChromosomePairs();
			while (chromos.hasMoreElements()) {
				OrganismChromosomePair chromo = (OrganismChromosomePair) chromos.nextElement();
				Enumeration oVariants = chromo.getOrganismVariantPairs();
				while (oVariants.hasMoreElements()) {
					Object o = oVariants.nextElement();
					if (o instanceof OrganismMarkerPair) {
						OrganismMarkerPair oMarker = (OrganismMarkerPair) o;
						markerChromo.add(oMarker.getFirstOrganismMarker().getMarker().getSpeciesChromosome().getNumberTypeAsString());
						markerLocations.add(Double.toString(oMarker.getFirstOrganismMarker().getLocationInCentimorgan()));
						System.out.print("," + oMarker.getFirstOrganismMarker().getMarker().getName());
						fw.write("," + oMarker.getFirstOrganismMarker().getMarker().getName());
					}
				}
			}
			System.out.println();
			fw.write("\n");
			
			// print the marker chromosome info
			System.out.print(",,,");
			fw.write(",,,");
			Enumeration chromoNums = markerChromo.elements();
			while (chromoNums.hasMoreElements()) {
				String num = (String) chromoNums.nextElement();
				System.out.print("," + num);
				fw.write("," + num);
			}
			System.out.println();
			fw.write("\n");
			
			
			// print the marker locations
			String d1 = "0,0,0,0";
			String d2 = "1,1,0,1";
			System.out.print(",,,");
			fw.write(",,,");
			Enumeration chromoLocs = markerLocations.elements();
			while (chromoLocs.hasMoreElements()) {
				String loc = (String) chromoLocs.nextElement();
				System.out.print("," + loc);
				fw.write("," + loc);
				d1 += ("," + "A");
				d2 += ("," + "B");
			}
			System.out.println();
			fw.write("\n");
			
			System.out.println(d1);
			System.out.println(d2);
			fw.write(d1 + "\n");
			fw.write(d2 + "\n");
			
			fw.flush();
			fw.close();
			
			doQTLAnalysis(qtlTempFile);
		
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	/**
	 * @param args
	 */
	public static void main(String[] args) {
		logger.info("Starting marker test.");
		
		Vector allLocations = new Vector();
		
		allLocations.add(getLocationVector("1",45.0f,0.6f,0.6f));
		allLocations.add(getLocationVector("2",21.0f,2.6f,0.2f));
		allLocations.add(getLocationVector("2",62.0f,1.3f,0.8f));
		
		SimulatedMarkerTest sim = new SimulatedMarkerTest(2000, allLocations);
		sim.doSimulation();

		System.exit(0);
	}
	
	private static Vector<String> getLocationVector(String chromo, float locationInCM, float height, float width) {
		Vector<String> v = new Vector<String>();
		v.add(chromo);
		v.add(Float.toString(locationInCM));
		v.add(Float.toString(height));
		v.add(Float.toString(width));
		return v;
	}
	
	private void doQTLAnalysis(File file) throws IOException {
		// just making sure we have the right version of everything
		if (!Rengine.versionCheck()) {
			System.err.println("** Version mismatch - Java files don't match library version.");
			System.exit(1);
		}
		System.out.println("\nCreating Rengine (with arguments):");
		// 1) we pass the arguments from the command line
		// 2) we won't use the main loop at first, we'll start it later
		// (that's the "false" as second argument)
		// 3) the callbacks are implemented by the TextConsole class above
		String[] myArgs = { "--no-save" };
		Rengine re = new Rengine(myArgs, false, new RInterface());
		System.out.println("Rengine created, waiting for R");
		// the engine creates R is a new thread, so we should wait until it's
		// ready
		if (!re.waitForR()) {
			System.out.println("Cannot load R");
			return;
		}

		REXP x;
		re.eval("library(qtl)", false);
		re.eval("setwd(\"" + file.getParent() + "\")", false);
		re.eval("importmap <- read.cross(\"csv\", file=\"" + file.getName() + "\")");
		re.eval("map1 = pull.map(importmap)");
		re.eval("cross <- sim.cross(map1, type=\"f2\", n.ind=" + this.numberOfIndividuals + ", model = " + buildQTLLocationsString() + ")", false);
		re.eval("summary(cross)", false);
		re.eval("cross <- calc.genoprob(cross, step=1, error.prob=0.01)", false);
		re.eval("out.me <- scanone(cross,pheno.col=1)", false);
		re.eval("summary(out.me)", false);
		re.eval("setwd(\"/tmp\")");

		System.out.println(x = re.eval("summary(out.me)"));
		// generic vectors are RVector to accomodate names
		RVector v = x.asVector();
		if (v.getNames() != null) {
			System.out.println("has names (" + v.getNames().size() + "):");
			for (Enumeration e = v.getNames().elements(); e.hasMoreElements();) {
				System.out.println(e.nextElement());
			}
		}
		
		System.out.println();
		
		Vector names = v.getNames();
		Enumeration e = names.elements();
		int max = 0;
		while(e.hasMoreElements()) {
			String name = (String) e.nextElement();
			System.out.println("Name: " + name);
			REXP rexp = (REXP) v.at(name);
			System.out.println("element: " + rexp);
			RFactor factor = rexp.asFactor();
			if (factor != null) {
				if (factor.size() > max) { max = factor.size(); }
				for (int j = 0; j < factor.size(); j++) {
					System.out.println("Factor at " + j + ": " + factor.at(j));
				}
			} else {
				double[] arr = rexp.asDoubleArray();
				if (arr.length > max) { max = arr.length; }
				System.out.println(arr);
			}
		}
		
		System.out.println("\nNow as a table\n[chromosone, position in chromosone (centi-morgans), lod score\n");
		System.out.println(max + " rows");
		String[] strNames = new String[names.size()];
		REXP[] rexps = new REXP[v.size()];
		v.copyInto(rexps);
		names.copyInto(strNames);
		for (int k = -1; k < max; k++) {
			for (int l = 0; l < names.size(); l++) {
				String val = "";
				if (k < 0) {
					// this is the title row. do all of the names
					val = strNames[l];
				} else {
					if (rexps[l].asFactor() != null) {
						val = rexps[l].asFactor().at(k);
					} else {
						val = "" + rexps[l].asDoubleArray()[k];
					}
				}
				System.out.print(val + " -- ");
			}
			System.out.println();
		}
		re.end();
	}

	private String buildQTLLocationsString() {
		// TODO Auto-generated method stub
		// rbind(c(1,45,0.6,0.6),c(2,20,0.5,-0.5)))
		String allLocations = "rbind(";
		for (Iterator locations = qtlLocations.iterator(); locations.hasNext();) {
			Vector v = (Vector) locations.next();
			if (v.size() != 4) {
				continue;
			}
			String locationStr = "c(";
			locationStr += (String) v.get(0) + ",";
			locationStr += (String) v.get(1) + ",";
			locationStr += (String) v.get(2) + ",";
			locationStr += (String) v.get(3) + ")";
			allLocations += locationStr + (locations.hasNext() ? "," : "");
		}
		allLocations += ")";
		System.err.println("All locations: " + allLocations);
		return allLocations;
	}

}