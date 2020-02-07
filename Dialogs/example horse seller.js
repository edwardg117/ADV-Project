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
*/
var dialog  = {
    "Start":
    {
        "Text":"Hello @p!", 
        "Sound":"",
        "diagOptions":
        [
            ["Who are you?", "I'm the guy that sells horses.", "gold", "", function(){/*Availability options*/return true;}, function(){/*Run if option is selected*/return false;}, ""],
            ["What do you have in stock?", "Bred these horses myself, you won't find any better around here.", "gold", "", function(){/*Availability options*/return true;}, function(){/*Run if option is selected*/return false;}, ""],
            ["Can you train my horse?", "Sure can, what'd you have in mind?", "gold", "", function(){/*Availability options*/return true;}, function(){/*Run if option is selected*/return false;}, ""],
            ["Goodbye", "Bye.", "gold", "", function(){/*Availability options*/return true;}, function(){/*Run if option is selected*/return false;}, "End"]
        ]
    },
    "CurrentStock":
    {
        "diagOptions":
        [
            ["Take me back", "Moving back to start list.", "gold", "", function(){/*Availability options*/return true;}, function(){/*Run if option is selected*/return false;}, "Start"],
            ["Broadcast: Hello!", "Doing it!", "gold", "", function(){/*Availability options*/return true;}, function(event, npc){/*Run if option is selected*/broadcastMessage(npc, "Hello!");}, ""],
            ["Goodbye", "Bye!", "gold", "", function(){/*Availability options*/return true;}, function(){/*Run if option is selected*/return false;}, "End"]
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
            ["Tell me about your horses", "Sure, here's what I got:", "gold", "", function(){/*Availability options*/ return true;}, function(){/*Run if option is selected*/ return false;}, ""],
            ["I would like to buy one of your horses", "Alright, which one are you interested in?", "gold", "", function(){/*Availability options*/ return true;}, function(){/*Run if option is selected*/ return false;}, ""]
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