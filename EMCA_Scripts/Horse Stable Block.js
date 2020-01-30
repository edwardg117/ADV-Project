/*
Horse Stable block v 0.03 by edwardg
Requires Run Delay by Ronan https://pastebin.com/YVqHYiAi
*/

//var belogsTo = "" // Name of job block


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
6,262,518,774,1030]
    var worker = event.block.world.getEntity(workerUUID);
    var horseQuality = worker.getStoreddata().get("horseQuality");
    var qualityRange = [horseQuality - 2, horseQuality];
    if(qualityRange[0] < 1){qualityRange[0] = 1;}
    if(qualityRange[1] > 10){qualityRange[1] = 10;}
    var chosenVariant = horseVariants[randInt(0,34)];
    //horse.getEntityNbt().	setInteger("Variant", chosenVariant);
    //event.block.world.broadcast(horse.getEntityNbt().getType("Variant"));
    /*var keys = horse.getEntityNbt().	getKeys();
    var keyList = [];
    var i = 0
    for(i = 0; i < keys.length; i += 1)
    {
        keyList.push(keys[i]);
    }
    event.block.world.broadcast(JSON.stringify(keyList));*/
    //event.block.world.broadcast(chosenVariant);
    horse.addTag("needsVariant");
    horse.setPos(event.block.getPos());
    horse.spawn();
    var randomHealth = Const_horseHealthRange[randInt(qualityRange[0],qualityRange[1])];
    var randomSpeed = Const_horseSpeedRange[randInt(qualityRange[0],qualityRange[1])];
    var randomJump = Const_horseJumpRange[randInt(qualityRange[0],qualityRange[1])];
    event.API.executeCommand(event.block.world, '/entitydata @e[type=horse,tag=needsVariant] {SaddleItem:{id:"minecraft:saddle",Count:1b},Tame:1,Variant:' + chosenVariant + ',Attributes:[{Name:generic.maxHealth,Base:' + randomHealth + '},{Name:generic.movementSpeed,Base:' + randomSpeed + '},{Name:horse.jumpStrength,Base:' + randomJump + '}]}');
    horse.removeTag("needsVariant");
    event.block.getStoreddata().put("hasHorse", 1);
    event.block.getStoreddata().put("myHorse", horse.getUUID());
    // Update Job File
    var jobFile = new File("saves/" + event.block.world.getName() + "/jobs/" + belongsTo + ".txt");
    var fileContents = JSON.parse(Files.readAllLines(jobFile.toPath(), CHARSET_UTF_8)[0]);
    var meInList = event.block.getStoreddata().get("meInHorseBlockList");
    //event.block.world.broadcast("me in list: " + meInList)
    fileContents["HorseBlocks"][meInList][1] = horse.getUUID();
    Files.write(jobFile.toPath(), JSON.stringify(fileContents).getBytes());

    //horse.getEntityNbt().	setInteger("Variant", chosenVariant); // setInteger broke ;(
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
                runDelay(fileContents["RestockTime"], function(){createHorse(event, fileContents["WorkerUUID"]);});
                event.block.getStoreddata().put("needsNewHorse", 0);
            }
            else{log("[ERROR!] Job has no associated worker! Use Job_Horse Seller to asign an npc to this job.");}
        }
    }
    if(event.block.getStoreddata().get("myHorse"))
    {
        if(!event.block.world.getEntity(event.block.getStoreddata().get("myHorse")).isAlive() && event.block.getStoreddata().get("hasHorse"))
        {
            event.block.getStoreddata().put("needsNewHorse", 1);
            event.block.getStoreddata().put("hasHorse", 0);
            event.block.getStoreddata().put("myHorse", 0);
            // Update Job File
            var jobFile = new File("saves/" + event.block.world.getName() + "/jobs/" + belongsTo + ".txt");
            var fileContents = JSON.parse(Files.readAllLines(jobFile.toPath(), CHARSET_UTF_8)[0]);
            var meInList = event.block.getStoreddata().get("meInHorseBlockList");
            fileContents["HorseBlocks"][meInList][1] = null;
            Files.write(jobFile.toPath(), JSON.stringify(fileContents).getBytes());
        }
    }
    
    runDelayTick();
}