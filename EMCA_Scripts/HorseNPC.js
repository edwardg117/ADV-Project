/* 
NPC that sells horses V 0.04 by edwardg

Roads Stuff
var home = ""
var city = ""

// Job Horse Seller/ Trainer
var jobNode = "Barn Front Desk" // Job location
var jobName = "Horse Seller" // Name of job
var maxHorses = 0 // Maximum number of horses for sale at one time
var restockTime = 1200 // How long until vendor should restock horses in seconds, 1200 seconds in 20 minutes
var basePrice = 50 // Baseline price for a horse with 5/5/5 stats
var priceGain = 1.2 // Stretches the price line
var horseQuality = 10 // Out of 10, how good are the horses sold? This value is the maximum, min is this value -2 (which bottoms out at 1)

var trainsHorses = 1 // Can the NPC train the player's horse
var jobSkillLevel = 10 // Out of 10 (1-10), how good at training are they? Affects price
*/

var File = Java.type("java.io.File");
var Files = Java.type("java.nio.file.Files");
var CHARSET_UTF_8 = Java.type("java.nio.charset.StandardCharsets").UTF_8;

// Constant values, DO NOT CHANGE >:(
var Const_horseHealthRange = [2, 10, 12, 14, 16, 18, 20, 22, 26, 28, 30];
var Const_horseSpeedRange = [0.1, 0.1125, 0.1375, 0.1525, 0.1925, 0.2325, 0.2875, 0.3, 0.3375, 0.35, 0.4];
var Const_horseJumpRange = [0.39, 0.4, 0.45, 0.48, 0.58, 0.645, 0.73, 0.785, 0.848, 0.915, 0.97];

function init(event)
{
    event.npc.getStoreddata().put("horseQuality", horseQuality);
    var jobFile = new File("saves/" + event.npc.world.getName() + "/jobs/" + jobName + ".txt");
    if(jobFile.exists())
    {
        var jobDetails = JSON.parse(Files.readAllLines(jobFile.toPath(), CHARSET_UTF_8)[0]);
        jobDetails["WorkerUUID"] = event.npc.getUUID();
        jobDetails["RestockTime"] = restockTime;
        Files.write(jobFile.toPath(), JSON.stringify(jobDetails).getBytes());
        log("Added NPC UUID to job file as the worker");
    }
    else
    {
        log("Did not add job to file because it doesn't exist yet.");
    }
}
/*
function interact(event) FORGOT TO COPY WHAT WAS IN THE NPC ACROSS :S
{
    //var horseUUID = event.player.getMount().getUUID(); //.getStoreddata().get("playerHorse");
    //event.npc.world.broadcast("Horse Value: " + horseValue(event.npc, horseUUID));

    // Let's make him talk about his stock
    var jobFile = new File("saves/" + event.npc.world.getName() + "/jobs/" + jobName + ".txt");
    var jobDetails = JSON.parse(Files.readAllLines(jobFile.toPath(), CHARSET_UTF_8)[0]);
    var stock = jobDetails["HorseBlocks"];
    for(var i = 0; i > stock.length; i += 1)
    {
        event.npc.world.broadcast("Horse " + (i + 1) + ":\nPrice: " + horseValue(event.npc, stock[i][1]));
    }
}*/
function horseValue(npc, horseUUID)
{
    var horse = npc.world.getEntity(horseUUID);
    var horseMaxHealth = horse.getMaxHealth();
    var attributes = horse.getEntityNbt().getList("Attributes",10);
    var i = 0;
    var attValue = 0;
    while(i < attributes.length)
    {
        if(attributes[i].getString("Name") == "generic.movementSpeed")
        {
            attValue = attributes[i].getDouble("Base");
            i = attributes.length; // Break? nah :P
        }
        i += 1;
    }
    var horseSpeed =  attValue;
    i = 0;
    attValue = 0;
    while(i < attributes.length)
    {
        if(attributes[i].getString("Name") == "horse.jumpStrength")
        {
            attValue = attributes[i].getDouble("Base");
            i = attributes.length; // Break? nah :P
        }
        i += 1;
    }
    var horseJump = attValue;
    //npc.world.broadcast(horseMaxHealth + " " + horseSpeed + " " + horseJump);
    
    var healthLevel = Const_horseHealthRange.indexOf(horseMaxHealth);
    var speedLevel = Const_horseSpeedRange.indexOf(horseSpeed);
    var jumpLevel = Const_horseJumpRange.indexOf(horseJump);
    //npc.world.broadcast("HealthLevel: " + healthLevel + "\nSpeedLevel: " + speedLevel + "\nJumpLevel: " + jumpLevel);
    var horseValue = 0;
    // Add health value
    if(healthLevel != 5)
    {
        if(healthLevel > 5)
        {
            horseValue += (basePrice / 3) * ((healthLevel - 5) * priceGain);
        }
        else
        {
            //                           16.666                                                    2.5
            horseValue += (basePrice / 3) * (1/((5 - healthLevel) * priceGain));
        }
    }
    else{horseValue += (basePrice / 3)}
    
    if(speedLevel != 5)
    {
        if(speedLevel > 5)
        {
            horseValue += (basePrice / 3) * ((speedLevel - 5) * priceGain);
        }
        else
        {
            //                           16.666                                                    2.5
            horseValue += (basePrice / 3) * (1/((5 - speedLevel) * priceGain));
        }
    }
    else{horseValue += (basePrice / 3)}
    
    if(jumpLevel != 5)
    {
        if(jumpLevel > 5)
        {
            horseValue += (basePrice / 3) * ((jumpLevel - 5) * priceGain);
        }
        else
        {
            //                           16.666                                                    2.5
            horseValue += (basePrice / 3) * (1/((5 - jumpLevel) * priceGain));
        }
    }
    else{horseValue += (basePrice / 3)}
    
    //npc.world.broadcast("Horse Value: " + horseValue);
    return Math.ceil(horseValue);
}

function aboutHorse(npc, horseUUID)
{
    var horse = npc.world.getEntity(horseUUID);
    var horseMaxHealth = horse.getMaxHealth();
    var attributes = horse.getEntityNbt().getList("Attributes",10);
    var i = 0;
    var attValue = 0;
    while(i < attributes.length)
    {
        if(attributes[i].getString("Name") == "generic.movementSpeed")
        {
            attValue = attributes[i].getDouble("Base");
            i = attributes.length; // Break? nah :P
        }
        i += 1;
    }
    var horseSpeed =  attValue;
    i = 0;
    attValue = 0;
    while(i < attributes.length)
    {
        if(attributes[i].getString("Name") == "horse.jumpStrength")
        {
            attValue = attributes[i].getDouble("Base");
            i = attributes.length; // Break? nah :P
        }
        i += 1;
    }
    var horseJump = attValue;
    //npc.world.broadcast(horseMaxHealth + " " + horseSpeed + " " + horseJump);
    
    var healthLevel = Const_horseHealthRange.indexOf(horseMaxHealth);
    var speedLevel = Const_horseSpeedRange.indexOf(horseSpeed);
    var jumpLevel = Const_horseJumpRange.indexOf(horseJump);
    return [healthLevel, speedLevel, jumpLevel, horse.getEntityNbt().getInteger("Variant")]
}