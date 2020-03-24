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
            ["Broadcast: Hello!", "Doing it!", "gold", "", function(){/*Availability options*/return true;}, function(event, npc){/*Run if option is selected*/broadcastMessage(npc, "Hello!");}, ""],
            ["[Ask Me About]", "What do you want to know?", "gold", "", function(){/*Availability options*/return true;}, function(){/*Run if option is selected*/return false;}, "AskMeAbout"],
            ["Goodbye", "Bye!", "gold", "", function(){/*Availability options*/return true;}, function(){/*Run if option is selected*/return false;}, "End"]
        ]
    },
    "AskMeAbout": // See https://fallout.fandom.com/wiki/Tell_me_about for an example of how this is used
    {
        "UnknownTopic":[["Sorry, I don't know anything about that.", ""], ["Can't say I've heard of that.", ""], ["That doesn't ring a bell.", ""]], // Chosen at random
        "LeaveReply":["Alright.", ""], // TODO support more than 1 later
        "Topics":
        [
            [
                ["Trigger Word/phrase", "Another trigger"], // These are the keywords/phases that will trigger the response, they are NOT case sensitive
                [
                    ["Response1", "sound"], ["Response 2", ""] // One or more response lines are allowed, they will be chosen at random
                ]
            ],
            [
                ["How high are you?", "How high are you", "High"], 
                [
                    ["No officer, it's 'Hi, how are you?'", ""]
                ]
            ],
            [
                ["Minecraft", "Game"], 
                [
                    ["I'm in Minecraft, yes.", ""], ["Yes, I know I'm in a game.", ""], ["Next you'll ask me what 1/0 is.", ""]
                ]
            ],
            [
                ["1/0"], 
                [
                    ["You must be fun at parties.", ""],["Do you treat everyone like this?", ""], ["You could at least pretend to care about me.", ""]
                ]
            ]
        ]
    }
}
//[[["","",""],[["",""],["",""],["",""]]],[["","",""],[["",""],["",""],["",""]]]]
// Topic is split into a list of topics
// A topic is split into a list of triggers and a list of reponses
// A response is split into a list of the text and sound
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