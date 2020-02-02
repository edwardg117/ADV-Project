/*
Horse Stable block v 0.03 by edwardg
Requires Run Delay by Ronan https://pastebin.com/YVqHYiAi
*/

//var belongsTo = "" // Name of job block


var File = Java.type("java.io.File");
var Files = Java.type("java.nio.file.Files");
var CHARSET_UTF_8 = Java.type("java.nio.charset.StandardCharsets").UTF_8;

function init(event)
{
    event.block.setIsPassible(true); // Player can walk through the block
    event.block.setModel("minecraft:barrier");

    if(!event.block.getStoreddata().get("init"))
    {
        var jobFile = new File("saves/" + event.block.world.getName() + "/jobs/" + belongsTo + ".txt");
        if(jobFile.exists())
        {
            var jobDetails = JSON.parse(Files.readAllLines(jobFile.toPath(), CHARSET_UTF_8)[0]);
            if(Object.keys(jobDetails).indexOf("HorseBlocks") >= 0)
            {
                // Already registred blocks, add this one to that
                var size = jobDetails["HorseBlocks"].length;
                
                var pos = event.block.getPos();
                // [[Location], horseUUID]
                jobDetails["HorseBlocks"].push([[pos.getX(),pos.getY(),pos.getZ()], null])
                event.block.getStoreddata().put("meInHorseBlockList", (size));
                Files.write(jobFile.toPath(), JSON.stringify(jobDetails).getBytes());
            }
            else
            {
                // First block to be registered
                var pos = event.block.getPos();
                // [[Location], horseUUID]
                jobDetails["HorseBlocks"] = [[[pos.getX(),pos.getY(),pos.getZ()], null]];
                event.block.getStoreddata().put("meInHorseBlockList", 0);
                Files.write(jobFile.toPath(), JSON.stringify(jobDetails).getBytes());
            }
            event.block.getStoreddata().put("init", 1)
            event.block.getStoreddata().put("needsNewHorse", 1);
            log("init Done")
        }

    }
}

/*function interact(event)
{
    var jobFile = new File("saves/" + event.block.world.getName() + "/jobs/" + belongsTo + ".txt");
    if(jobFile.exists())
    {
        //var fileLines = Files.readAllLines(jobFile.toPath(), CHARSET_UTF_8);
        //var fileContents = {"test":"ahh"};
        var fileContents = JSON.parse(Files.readAllLines(jobFile.toPath(), CHARSET_UTF_8)[0]);
        /*log("Contents Read");
        log(JSON.stringify(fileContents))
        log(fileContents["Name"])
        log(JSON.stringify(Object.keys(fileContents)))    Spent ages going fileContents.keys() wondering why it was sad
        log("Can I be seen?")
        if(Object.keys(fileContents).indexOf("WorkerUUID") >= 0)
        {
            createHorse(event, fileContents["WorkerUUID"]);
        }
        else{log("[ERROR!] Job has no associated worker! Use Job_Horse Seller to asign an npc to this job.");}
    }
    else{log("[ERROR!] Job file does not exist, check spelling for 'belongsTo' or create a job with this name.");}
}*/

function createHorse(event, workerUUID)
{
    // Takes event and workerUUID and spawns a horse that can be sold where the block is
    // This function should only be called inside tick. If you want to call it elsewhere for whaterver reason, be aware it may screw up the block.
    var horse = event.block.world.createEntity("minecraft:horse");
    var Const_horseHealthRange = [2, 10, 12, 14, 16, 18, 20, 22, 26, 28, 30];
    var Const_horseSpeedRange = [0.1, 0.1125, 0.1375, 0.1525, 0.1925, 0.2325, 0.2875, 0.3, 0.3375, 0.35, 0.4];
    var Const_horseJumpRange = [0.39, 0.4, 0.45, 0.48, 0.58, 0.645, 0.73, 0.785, 0.848, 0.915, 0.97];
    var horseVariants = [0,256,512,768,1024,
1,257,513,769,1025,
2,258,514,770,1026,
3,259,515,771,1027,
4,260,516,772,1028,
5,261,517,773,1029,
6,262,518,774,1030];
    // Get horse quality from the worker
    var worker = event.block.world.getEntity(workerUUID);
    var horseQuality = worker.getStoreddata().get("horseQuality");
    // Determine how far the range on levels is
    var qualityRange = [horseQuality - 2, horseQuality];
    if(qualityRange[0] < 1){qualityRange[0] = 1;}
    if(qualityRange[1] > 10){qualityRange[1] = 10;}
    var chosenVariant = horseVariants[randInt(0,34)];

    // I'm leaving this in here so I always remember that setInteger does not work with this for some reason
    //horse.getEntityNbt().setInteger("Variant", chosenVariant);
    //event.block.world.broadcast(horse.getEntityNbt().getType("Variant"));
    /*var keys = horse.getEntityNbt().getKeys(); // Sanity check plz
    var keyList = [];
    var i = 0
    for(i = 0; i < keys.length; i += 1)
    {
        keyList.push(keys[i]);
    }
    event.block.world.broadcast(JSON.stringify(keyList));*/
    //event.block.world.broadcast(chosenVariant);

    horse.addTag("needsVariant"); // So we can see this horse and modify it
    horse.setPos(event.block.getPos());
    horse.spawn(); // This is what sumons the horse into existence
    // Random level generator
    var randomHealth = Const_horseHealthRange[randInt(qualityRange[0],qualityRange[1])];
    var randomSpeed = Const_horseSpeedRange[randInt(qualityRange[0],qualityRange[1])];
    var randomJump = Const_horseJumpRange[randInt(qualityRange[0],qualityRange[1])];
    // Apply everything to the horse now
    event.API.executeCommand(event.block.world, '/entitydata @e[type=horse,tag=needsVariant] {Temper:0,Tame:0,Variant:' + chosenVariant + ',Attributes:[{Name:generic.maxHealth,Base:' + randomHealth + '},{Name:generic.movementSpeed,Base:' + randomSpeed + '},{Name:horse.jumpStrength,Base:' + randomJump + '}]}');
    horse.removeTag("needsVariant");
    // Save stuff that could be useful
    event.block.getStoreddata().put("hasHorse", 1);
    event.block.getStoreddata().put("myHorse", horse.getUUID());
    // Update Job File
    var jobFile = new File("saves/" + event.block.world.getName() + "/jobs/" + belongsTo + ".txt");
    var fileContents = JSON.parse(Files.readAllLines(jobFile.toPath(), CHARSET_UTF_8)[0]);
    // Because this is an ordered list, we need to know where this one is. Luckily, it's saved in init
    var meInList = event.block.getStoreddata().get("meInHorseBlockList");
    //event.block.world.broadcast("me in list: " + meInList)
    fileContents["HorseBlocks"][meInList][1] = horse.getUUID();
    Files.write(jobFile.toPath(), JSON.stringify(fileContents).getBytes());

    //horse.getEntityNbt().setInteger("Variant", chosenVariant); // Reminder that setInteger broke ;(
}

function randInt(min, max) 
{   // Returns a random number
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function tick(event)
{
    if(event.block.getStoreddata().get("needsNewHorse"))
    {
        var jobFile = new File("saves/" + event.block.world.getName() + "/jobs/" + belongsTo + ".txt");

        if(jobFile.exists())
        {
            // It exists, get the assigned worker
            var fileContents = JSON.parse(Files.readAllLines(jobFile.toPath(), CHARSET_UTF_8)[0]);
            if(Object.keys(fileContents).indexOf("WorkerUUID") >= 0)
            {
                // Worker to sell the horse exists, wait the amount of time specified for them to restock to spawn a horse
                runDelay(fileContents["RestockTime"], function(){createHorse(event, fileContents["WorkerUUID"]);});
                event.block.getStoreddata().put("needsNewHorse", 0); // No need to do this more than once
                var meInList = event.block.getStoreddata().get("meInHorseBlockList");
                fileContents["HorseBlocks"][meInList][1] = null; // Put that this block has no horse
                Files.write(jobFile.toPath(), JSON.stringify(fileContents).getBytes());
            }
            else{log("[ERROR!] Job has no associated worker! Use Job_Horse Seller to asign an npc to this job.");} // Oh yeah, need to rename at some point :P
        }
    }
    if(event.block.getStoreddata().get("myHorse"))
    {
        // Check to see if the horse is still alive
        if(!event.block.world.getEntity(event.block.getStoreddata().get("myHorse")).isAlive() && event.block.getStoreddata().get("hasHorse"))
        {
            // Rip horse, get a new one
            event.block.getStoreddata().put("needsNewHorse", 1);
            event.block.getStoreddata().put("hasHorse", 0);
            event.block.getStoreddata().put("myHorse", 0);
            // Update Job File
            var jobFile = new File("saves/" + event.block.world.getName() + "/jobs/" + belongsTo + ".txt");
            var fileContents = JSON.parse(Files.readAllLines(jobFile.toPath(), CHARSET_UTF_8)[0]);
        }
    }
    
    runDelayTick(); // rundelay.js is bae
}