//Example script to manipulate a graphable and create a new filter

importClass(Packages.java.lang.System);

function init()
{
	System.out.println("changing color in the script --- ");
	graphable.setColor(0xFFFF00);

	return true;
}

function save()
{
	return null;
}
