/* 
Load into NPC with dialogs script

Useful things to know
How to get the player for use inside a function:
var player = npc.world.getEntity(npc.getStoreddata().get("inDialogWith"));

for functions:
- They are only passed an NPC (npc)
- structure is function(npc){// Your code here here}
- For readability you should make your own function below the dialog variable so inside the option looks neater
    i.e for an availability option: function(npc){scoreboardGreaterThanOrEqual(npc, "objectiveName", 5);}

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
            ["Who are you?", "I'm a villager here. I have lived in this village my whole life.", "gold", "", function(){/*Availability options*/return true;}, function(){/*Run if option is selected*/return false;}, ""],
            ["Tell me something about this village", "This village has been around for ages. Enjoy your stay here.", "gold", "", function(){/*Availability options*/return true;}, function(){/*Run if option is selected*/return false;}, ""],
            ["Go to response list 'Advanced'", "Sure thing!", "red", "", function(){/*Availability options*/return true;}, function(){/*Run if option is selected*/return false;}, "Advanced"],
            ["Goodbye", "Bye!", "gold", "", function(){/*Availability options*/return true;}, function(){/*Run if option is selected*/return false;}, "End"]
        ]
    },
    "Advanced":
    {
        "Text":"Text is not needed and will only be said if dialog is initiated with this list.",
        "Sound":"",
        "diagOptions":
        [
            ["Take me back", "Moving back to start list.", "gold", "", function(){/*Availability options*/return true;}, function(){/*Run if option is selected*/return false;}, "Start"],
            ["Broadcast: Hello!", "Doing it!", "gold", "", function(){/*Availability options*/return true;}, function(npc){/*Run if option is selected*/broadcastMessage(npc, "Hello!");}, ""],
            ["Goodbye", "Bye!", "gold", "", function(){/*Availability options*/return true;}, function(){/*Run if option is selected*/return false;}, "End"]
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