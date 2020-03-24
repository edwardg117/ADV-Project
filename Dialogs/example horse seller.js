/* 
Load into NPC with dialogs script

Useful things to know
How to get the player for use inside a function:
var player = npc.world.getEntity(npc.getStoreddata().get("inDialogWith"));

for functions:
- They are only passed an NPC (npc)
- structure is function(event, npc){// Your code here here}
- For readability you should make your own function below the dialog variable so inside the option looks neater
    i.e for an availability option: function(event, npc){scoreboardGreaterThanOrEqual(npc, "objectiveName", 5);}

response structure:
["Player response option", "Npc response if chosen", "colour", "sound", function(){/*Availability options, default: return true;}, function(){/*Run if option is selected, default: return false;}, "List to go to or End, leave empty for same list"]

Simple copy-paste:
["option", "response", "gold", "", function(){return true;}, function(){return false;}, ""]
*/
var dialog  = {
    "Start":
    {
        "Text":"Hello @p!", 
        "Sound":"",
        "diagOptions":
        [
            ["Who are you?", "I'm the guy that sells horses.", "gold", "", function(){/*Availability options*/return true;}, function(){/*Run if option is selected*/return false;}, ""],
            ["What do you have in stock?", "Bred these horses myself, you won't find any better around here.", "gold", "", function(){/*Availability options*/return true;}, function(event, npc){/*Run if option is selected*/listStock(event, npc);}, "HorseInventory"],
            ["Can you train my horse?", "Sure can, what'd you have in mind?", "gold", "", function(){/*Availability options*/return true;}, function(){/*Run if option is selected*/return false;}, ""],
            ["Goodbye", "Bye.", "gold", "", function(){/*Availability options*/return true;}, function(){/*Run if option is selected*/return false;}, "End"]
        ]
    },
    "HorseTraining":
    {
        "diagOptions":
        [
            ["I'd like to increase my horse's vitality", "Sure.", "gold", "", function(){/*Availability options*/return true;}, function(){/*Run if option is selected*/return false;}, ""],
            ["I'd like to increase my horse's swiftness", "Sure.", "gold", "", function(){/*Availability options*/return true;}, function(){/*Run if option is selected*/return false;}, ""],
            ["I'd like to increase my horse's jumping ability", "Sure.", "gold", "", function(){/*Availability options*/return true;}, function(){/*Run if option is selected*/return false;}, ""],
            ["Actually, nevermind", "Alright.", "gold", "", function(){/*Availability options*/return true;}, function(){/*Run if option is selected*/return false;}, ""]
        ]
    },
    "HorseInventory":
    {
        "diagOptions":
        [
            ["Tell me about your horses again", "Sure, here's what I got:", "gold", "", function(){/*Availability options*/ return true;}, function(event, npc){/*Run if option is selected*/ listStock(event, npc);}, ""],
            ["I would like to buy one of your horses", "Alright, which one are you interested in?", "gold", "", function(){/*Availability options*/ return true;}, function(event, npc){return generateReplacementList(npc);}, "DynamicList"],
            ["Nevermind", "Alright.", "gold", "", function(){/*Availability options*/ return true;}, function(){/*Run if option is selected*/ return false;}, "Start"]
        ]
    },
    "BuyingChosenHorse":
    {
        "diagOptions":
        [
            ["I would like to buy this horse", "Certianly!", "gold", "", function(event, npc){doesPlayerHaveFunds(event, npc);}, function(event, npc){sellToPlayer(event, npc);}, "Start"],
            ["Actually, nevermind", "That's alright.", "gold", "", function(){return true;}, function(){return false;}, "Start"]

        ]
    }
}

function scoreboardGreaterThanOrEqual(npc, objective, score)
{
    // Uses the NPC to get the player and check their score
    // Useful for availability
    var player = npc.world.getEntity(npc.getStoreddata().get("inDialogWith"));
    var playerScore = player.world.getScoreboard().getPlayerScore(player.getName(), objective, "");//getObjective​​("dummyScore").getScore(player.getDisplay().getName());
    var value = false;
    if(playerScore >= score)
    {
        value = true;
    }
    return value;
}

function scoreboardLessThanOrEqual(npc, objective, score)
{
    // Uses the NPC to get the player and check their score
    var player = npc.world.getEntity(npc.getStoreddata().get("inDialogWith"));
    var playerScore = player.world.getScoreboard().getPlayerScore(player.getName(), objective, "");//getObjective​​("dummyScore").getScore(player.getDisplay().getName());
    var value = false;
    if(playerScore <= score)
    {
        value = true;
    }
    return value;
}

// uses broadcast to send a message
function broadcastMessage(npc, message)
{
    npc.world.broadcast(message);
    return true;
}

function getPlayerStoreddata(npc, key)
{
    // This is just an example and would make more sense being part of another function
    // You could use something similar to this to store and check if a player has read dialogs already
    var player = npc.world.getEntity(npc.getStoreddata().get("inDialogWith"));
    return player.getStoreddata().get(key);
}

// Prints out the current stock of horses
function listStock(event, npc)
{
    // Aquire stock list
    var jobFile = new File("saves/" + npc.world.getName() + "/jobs/" + jobName + ".txt");
    var jobDetails = JSON.parse(Files.readAllLines(jobFile.toPath(), CHARSET_UTF_8)[0]);
    var stock = jobDetails["HorseBlocks"];

    npc.world.broadcast("============\n||Stock Details||\n============");
    var i = 0;
    for(i = 0; i < stock.length; i += 1)
    {
        var horseUUID = (" " + stock[i][1]).slice(1); // Trick to force a full copy so it gets passed to the function correctly
        if(stock[i][1])
        {
            var horseDeets = aboutHorse(npc, horseUUID);
            npc.world.broadcast("Horse " + (i + 1) + ":\nPrice:" + horseValue(npc, horseUUID) + "\nVariant: "+ horseDeets[3] + "\nHealth Level: " + horseDeets[0] + "\nSpeed Level: " + horseDeets[1] + "\nJump Level: " + horseDeets[2] +  "\n========");
        }
        else{npc.world.broadcast("Horse " + (i + 1) + ": SOLD");}
    }
    npc.world.broadcast("============\n|================\n============");
}

// Check to see if player can afford the horse they want
function doesPlayerHaveFunds(event, npc)
{
    log("Determining if the player has the funds to buy that horse")
    var player = npc.world.getEntity(npc.getStoreddata().get("inDialogWith"));
    var playerMoney = getPlayerMoney(player);
    var jobFile = new File("saves/" + npc.world.getName() + "/jobs/" + jobName + ".txt");
    var jobDetails = JSON.parse(Files.readAllLines(jobFile.toPath(), CHARSET_UTF_8)[0]);
    var stock = jobDetails["HorseBlocks"];
    log(JSON.stringify(stock))
    log(JSON.stringify(npc.getStoreddata().get("horseOfIntrest")))
    var storedInfo = stock[npc.getStoreddata().get("horseOfIntrest")]
    log(JSON.stringify(storedInfo))
    var horseUUID = (" " + stock[npc.getStoreddata().get("horseOfIntrest")][1]).slice(1);
    log(horseUUID)
    var actualValue = horseValue(npc, horseUUID);

    var result = false;
    if(playerMoney >= actualValue)
    {
        result = true;
    }
    return result;
}

function sellToPlayer(event, npc)
{
    var jobFile = new File("saves/" + npc.world.getName() + "/jobs/" + jobName + ".txt");
    var jobDetails = JSON.parse(Files.readAllLines(jobFile.toPath(), CHARSET_UTF_8)[0]);
    var stock = jobDetails["HorseBlocks"];
    var horseUUID = stock[npc.world.getEntity(npc.getStoreddata().get("horseOfIntrest"))][1];

    sellHorse(npc, npc.getStoreddata().get("inDialogWith"), horseUUID, npc.getStoreddata().get("horseOfIntrest"));
}

function generateReplacementList(npc){
    var jobFile = new File("saves/" + npc.world.getName() + "/jobs/" + jobName + ".txt");
    var jobDetails = JSON.parse(Files.readAllLines(jobFile.toPath(), CHARSET_UTF_8)[0]);
    var stock = jobDetails["HorseBlocks"];
    var length = stock.length;
    var options = [];
    for(var i = 0; i < length; i += 1)
    {
        options.push(["Horse " + (i + 1), "Alright, you want to buy Horse " + (i + 1) + "?", "gold", "", function(){return true;}, function(event, npc){npc.getStoreddata().put("horseOfIntrest", i);}, "BuyingChosenHorse"]);
    }
    options.push(["I've changed my mind", "That's alright.", "gold", "", function(){return true;}, function(){return false;}, "Start"]);
    return options;
}