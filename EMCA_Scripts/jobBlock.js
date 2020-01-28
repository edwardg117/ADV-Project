/*
Job / workplace registry so info can be passed between the NPC and any part of the job that needs it
by edwardg V0.01

Put the following into the scripted block:

var name = "Specific job place name" // Name of the workplace
var city = "" // City it's in

*/

var File = Java.type("java.io.File");
var Files = Java.type("java.nio.file.Files");
var CHARSET_UTF_8 = Java.type("java.nio.charset.StandardCharsets").UTF_8;
/*
var jobsFolder = new File("saves/" + event.block.world.getName() + "/jobs");
var jobFile = new File("saves/" + event.block.world.getName() + "/jobs/" + name + ".txt");
*/

function init(event)
{
     // Has this job block already been initialised?
    if(event.block.getStoreddata().get("init"))
    {
        // Block has been initialised before
        if(event.block.getStoreddata().get("Name") != name || event.block.getStoreddata().get("City") != city)
        {
            log("Updating Details.");
            if(event.block.getStoreddata().get("Name") != name){removeJobDetails(event);}
            addJobDetails(event);
        }
    }
    else
    {
        // Block hasn't been initialised yet
        var jobsFolder = new File("saves/" + event.block.world.getName() + "/jobs");
        var jobFile = new File("saves/" + event.block.world.getName() + "/jobs/" + name + ".txt");
        if(!jobFile.exists())
        {
            jobsFolder.mkdirs();
            jobFile.createNewFile();
            addJobDetails(event);
            event.block.getStoreddata().put("Name", name);
            event.block.getStoreddata().put("City", city);
            event.block.getStoreddata().put("init", 1);
        }
        else
        {
            var aboutOther = JSON.parse(Files.readAllLines(jobFile.toPath(), CHARSET_UTF_8)[0]);
            event.block.world.broadcast("A job with this name already exists! Please choose a different name!\nName: " + name + "\nCity: " + aboutOther["City"] + "\nPos: " + aboutOther["Pos"]);
        }
    }
}

function getJobDetails(event)
{
    // Returns the job info
    var jobFile = new File("saves/" + event.block.world.getName() + "/jobs/" + name + ".txt");
    var fileContents = Files.readAllLines(jobFile.toPath(), CHARSET_UTF_8);
    var jobInfo = JSON.parse(fileContents);
    return jobInfo;
}

function addJobDetails(event)
{
    // Adds job details to file
    var aboutMe = {};
        
    // Block Position
    var pos = event.block.getPos();
    aboutMe["Pos"] = [pos.getX(),pos.getY(),pos.getZ()];

    // Job Name
    event.block.getStoreddata().put("Name", name);
    aboutMe["Name"] = name;

    // City Name
    event.block.getStoreddata().put("City", city);
    aboutMe["City"] = city;

    // save file
    var jobFile = new File("saves/" + event.block.world.getName() + "/jobs/" + name + ".txt");
    Files.write(jobFile.toPath(), JSON.stringify(aboutMe).getBytes());
}

function removeJobDetails(event)
{
    // Removes job file
    var jobFile = new File("saves/" + event.block.world.getName() + "/jobs/" + event.block.getStoreddata().get("Name") + ".txt");
return jobFile.delete();
}