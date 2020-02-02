/* 
NPC that sells horses V 0.05 by edwardg

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
function interact(event)
{
    //var horseUUID = event.player.getMount().getUUID(); //.getStoreddata().get("playerHorse");
    //event.npc.world.broadcast("Horse Value: " + horseValue(event.npc, horseUUID));

    // Let's make him talk about his stock
    var jobFile = new File("saves/" + event.npc.world.getName() + "/jobs/" + jobName + ".txt");
    var jobDetails = JSON.parse(Files.readAllLines(jobFile.toPath(), CHARSET_UTF_8)[0]);
    var stock = jobDetails["HorseBlocks"];
    event.npc.world.broadcast("============\n||Stock Details||\n============");
    var i = 0;
    for(i = 0; i < stock.length; i += 1)
    {
        var test = (" " + stock[i][1]).slice(1);
        if(stock[i][1])
        {
            var horseDeets = aboutHorse(event.npc, test);
            event.npc.world.broadcast("Horse " + (i + 1) + ":\nPrice:" + horseValue(event.npc, test) + "\nVariant: "+ horseDeets[3] + "\nHealth Level: " + horseDeets[0] + "\nSpeed Level: " + horseDeets[1] + "\nJump Level: " + horseDeets[2] +  "\n========");
        }
        else{event.npc.world.broadcast("Horse " + (i + 1) + ": SOLD");}
    }
}*/
function horseValue(npc, horseUUID)
{
    // Takes the worker and the uuid of the horse
    // Uses basePrice and Price gain to determine how much a given horse is worth based on it's levels
    // Returns an integer 
    var horseLevels = aboutHorse(npc, horseUUID);
    var healthLevel = horseLevels[0];
    var speedLevel = horseLevels[1];
    var jumpLevel = horseLevels[2];
    //npc.world.broadcast("HealthLevel: " + healthLevel + "\nSpeedLevel: " + speedLevel + "\nJumpLevel: " + jumpLevel + JSON.stringify(horseLevels));
    var horseValue = 0;
    // Add health value
    if(healthLevel != 5)
    {
        if(healthLevel > 5)
        {
            // Makes the value exponentially greater than 1/3 of the base price
            horseValue += (basePrice / 3) * ((healthLevel - 5) * priceGain);
        }
        else
        {
            // Makes the value less than 1/3 of the base price
            horseValue += (basePrice / 3) * (1/((5 - healthLevel) * priceGain));
        }
    }
    else{horseValue += (basePrice / 3)} // Makes the value exactly 1/3 of the base price
    
    if(speedLevel != 5)
    {
        if(speedLevel > 5)
        {
            horseValue += (basePrice / 3) * ((speedLevel - 5) * priceGain);
        }
        else
        {
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
            horseValue += (basePrice / 3) * (1/((5 - jumpLevel) * priceGain));
        }
    }
    else{horseValue += (basePrice / 3)}
    
    //npc.world.broadcast("Horse Value: " + horseValue);
    return Math.ceil(horseValue); // Make the price a whole number, because we can't have decimals
}

function aboutHorse(npc, horseUUID)
{
    // Takes the worker and the horseUUID
    // Determines all the levels and variant of the horse
    // Returns an array of integers in the following order: [healthLevel, speedLevel, jumpLevel, Variant]
    var horse = npc.world.getEntity(horseUUID);
    var horseMaxHealth = horse.getMaxHealth(); // Don't needs to find this one manually
    var attributes = horse.getEntityNbt().getList("Attributes",10);

    // Movement speed and jump strength are stored in a horse's attributes and must be found manually
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

function sellHorse(npc, playerUUID, horseUUID, blockNumber)
{
    // Attempts to sell Horse, returns sucess or failure 
    // Blocknumber is where the horse stable block is in the list of "HorseBlocks"
    
    var returnValue = false; // Should probably assume the worst and hope for the best
    var player = npc.world.getEntity(playerUUID);
    // Does the player have a UUID stored for a horse?
    if(player.getStoreddata().get("playerHorse"))
    {
        // Does the UUID belong to something?
        if(npc.world.getEntity(player.getStoreddata().get("playerHorse")))
        {
            // Is the horse alive?
            if(npc.world.getEntity(player.getStoreddata().get("playerHorse")).isAlive()){var canBuy = false;} // It is, refuse sale
            else{var canBuy = true;} // It's dead, sale can proceed
        }
        else{var canBuy = true;} // Invalid uuid, sale can proceed
    }
    else{var canBuy = true;} // No UUID stored, sale can proceed

    if(!canBuy)
    {
        log("Player already owns a horse, horse must be sold or killed.") // Log why the sale did not proceed
    }
    else
    {
        var horse = npc.world.getEntity(horseUUID);
        var calculatedValue = horseValue(npc, horseUUID);
        var playerMoney = getPlayerMoney(player); // Stand in function because I'm only using scoreboard values for testing atm
        if(playerMoney >= calculatedValue)
        {
            // Player has adequte funds, sell horse
            log("Player has money")
            var jobFile = new File("saves/" + npc.world.getName() + "/jobs/" + jobName + ".txt");
            // Transfer ownership to player
            player.getStoreddata().put("playerHorse", horse.getUUID()); // Save horse UUID on player
            playerMoney -= calculatedValue; // Calculate remaining money
            player.world.getScoreboard().setPlayerScore(player.getName(), "money", playerMoney, ""); // Set player money, still a stand in

            // Tell the block the horse was sold so it will start the restock timer and update the file
            var jobDetails = JSON.parse(Files.readAllLines(jobFile.toPath(), CHARSET_UTF_8)[0]);
            var horseBlocks = jobDetails["HorseBlocks"];
            var pos = horseBlocks[blockNumber][0]; // Acquire the positon of the block in IPos
            var horseBlock = npc.world.getBlock(pos[0], pos[1], pos[2]); // Get the IBlock
            horseBlock.getStoreddata().put("myHorse", 0); // let the block sort it out
            horseBlock.getStoreddata().put("needsNewHorse", 1);
            horseBlock.getStoreddata().put("hasHorse", 0);

            // Update horse
            horse.addTag("justSoldBy" + npc.getDisplay().getName()); // Tag the horse so /entitydata can find it specifically
            npc.executeCommand('/entitydata @e[type=horse,tag=justSoldBy' + npc.getDisplay().getName() + '] {SaddleItem:{id:"minecraft:saddle",Count:1b},Tame:1}');
            horse.removeTag("justSoldBy" + npc.getDisplay().getName()); // Done with this tag
            horse.addTag("playerHorse"); // So that the sumonable horse script can find it
            returnValue = true;
        }

    }

    return returnValue;
}

function getPlayerMoney(player)
{
    // Gets the player's money, this is a stand in function untill I decide
    // how to handle it better / what currency should be

    var playerScore = player.world.getScoreboard().getPlayerScore(player.getName(), "money", "");
    return playerScore;
}