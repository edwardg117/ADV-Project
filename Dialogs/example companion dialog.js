/* 
Load into NPC with dialogs script

Useful things to know
This was made for a wolf, change options, sounds etc to your liking
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
    "NotCompanion":
    {
        "Text":"Woof", 
        "Sound":"minecraft:entity.wolf.ambient",
        "diagOptions":
        [
            ["I think we should travel together", "Woof!", "green", "minecraft:entity.wolf.ambient", function(){/*Availability options*/return true;}, function(npc){/*Run if option is selected*/recruitCompanion(npc);}, "IsCompanion"], 
            ["Goodbye", "Woof.", "gold", "minecraft:entity.wolf.ambient", function(){/*Availability options*/return true;}, function(){/*Run if option is selected*/return false;}, "End"]
        ]
    },
    "IsCompanion":
    {
        "Text":"Woof!", 
        "Sound":"minecraft:entity.wolf.ambient",
        "diagOptions":
        [
            ["It's time for us to part ways", "Whine", "red", "minecraft:entity.wolf.whine", function(){/*Availability options*/return true;}, function(npc){/*Run if option is selected*/fireCompanion(npc);}, "NotCompanion"],
            ["Wait here", "Woof.", "gold", "minecraft:entity.wolf.ambient", function(npc){/*Availability options*/return !(npc.getStoreddata().get("isWaiting"));}, function(npc){/*Run if option is selected*/startWaiting(npc);}, ""],
            ["Follow me", "Woof!", "gold", "minecraft:entity.wolf.ambient", function(npc){/*Availability options*/return npc.getStoreddata().get("isWaiting");}, function(npc){/*Run if option is selected*/stopWaiting(npc);}, ""],
            ["Can I ask you some questions?", "Woof?", "gold", "minecraft:entity.wolf.ambient", function(){/*Availability options*/return true;}, function(){/*Run if option is selected*/return false;}, "AboutSelf"],
            ["Back up a bit", "Woof.", "gold", "minecraft:entity.wolf.ambient", function(){/*Availability options*/return true;}, function(npc){/*Run if option is selected*/backUp(npc);}, ""],
            ["Let's go!", "Woof!.", "gold", "minecraft:entity.wolf.ambient", function(){/*Availability options*/return true;}, function(){/*Run if option is selected*/return false;}, "End"]
        ]
    },
    "AboutSelf":
    {
        "diagOptions":
        [
            ["Who named you?", "Woof!", "gold", "minecraft:entity.wolf.ambient", function(){/*Availability options*/return true;}, function(){/*Run if option is selected*/return false;}, ""],
            ["Where'd you get your collar?", "Woof.", "gold", "minecraft:entity.wolf.ambient", function(){/*Availability options*/return true;}, function(){/*Run if option is selected*/return false;}, ""],
            ["Where are you from?", "Woof?", "gold", "minecraft:entity.wolf.ambient", function(){/*Availability options*/return true;}, function(){/*Run if option is selected*/return false;}, ""],
            ["I don't have any more questions", "Woof!", "gold", "minecraft:entity.wolf.ambient", function(){/*Availability options*/return true;}, function(){/*Run if option is selected*/return false;}, "IsCompanion"]
        ]
    }
}

function recruitCompanion(npc)
{
    // Makes the NPC a companion
    var player = npc.world.getEntity(npc.getStoreddata().get("inDialogWith"));
    npc.world.broadcast(npc.getDisplay().getName() + " is now your companion");
    npc.getRole().setInfinite(1);
    npc.getRole().setFollowing(player);
    npc.getStoreddata().put("followedPlayer", player.getDisplayName());
}

function fireCompanion(npc)
{
    // Makes the NPC no longer a companion
    npc.world.broadcast(npc.getDisplay().getName() + " is no longer your companion");
    npc.getRole().reset();
    npc.getRole().setInfinite(0);
    npc.getStoreddata().put("followedPlayer", "");
}

function startWaiting(npc)
{
    // Makes the NPC wait in place
    var pos = npc.getPos();
    npc.setHome(pos.getX(), pos.getY(), pos.getZ());
    npc.getAi().setReturnsHome(true);
    npc.getAi().setWanderingRange(1);
    npc.getRole().reset();
    npc.getStoreddata().put("isWaiting", 1);
    npc.world.broadcast(npc.getDisplay().getName() + " is waiting patiently for your return");
}

function stopWaiting(npc)
{
    // Makes the NPC follow the player again
    var player = npc.world.getEntity(npc.getStoreddata().get("inDialogWith"));
    npc.getAi().setReturnsHome(false);
    npc.getAi().setWanderingRange(10);
    npc.getRole().setInfinite(1);
    npc.getRole().setFollowing(player);
    npc.getStoreddata().put("isWaiting", 0);
    npc.world.broadcast(npc.getDisplay().getName() + " will follow you again");
}

function backUp(npc)
{
    // Make the NPC walk in the direction the player is facing
    var pos = npc.getPos();
    var player = npc.world.getEntity(npc.getStoreddata().get("inDialogWith"));
    
    // Don't walk back home again if moved
    npc.getAi().setReturnsHome(false);

    var facing = player.getRotation();
    if(facing > 45 && facing <=135)
    {
        // East, Positive X
        pos = pos.subtract(3,0,0);
        npc.navigateTo(pos.getX(), pos.getY(), pos.getZ(), 1);
    }
    else if(facing > 135 && facing <=225)
    {
        // North, Negative Z
        pos = pos.subtract(0,0,3);
        npc.navigateTo(pos.getX(), pos.getY(), pos.getZ(), 1);
    }
    else if(facing > 225 && facing <=315)
    {
        // West, Negative X
        pos = pos.add(3,0,0);
        npc.navigateTo(pos.getX(), pos.getY(), pos.getZ(), 1);
    }
    else if((facing > 315 && facing <=360) || (facing >= 0 && facing <=45))
    {
        // South, Positive Z
        pos = pos.add(0,0,3);
        npc.navigateTo(pos.getX(), pos.getY(), pos.getZ(), 1);
    }
    else
    {
        // Something went wrong
        npc.world.broadcast("[Error!] Couldn't determine where player was looking, navigation not started!");
        npc.world.broadcast("Facing was: " + facing);
    }
}

function scoreboardGreaterThanOrEqual(npc, objective, score)
{
    // Uses the NPC to get the player and check their score
    // Useful for availability
    var player = npc.world.getEntity(npc.getStoreddata().get("inDialogWith"));
    var playerScore = player.world.getScoreboard().getPlayerScore(player.getName(), objective, "");//getObjective​​("dummyScore").getScore(player.getDisplay().getName());
    var value = false;
    if(playerScore >= score){value = true;}
    return value;
}

function scoreboardLessThanOrEqual(npc, objective, score)
{
    // Uses the NPC to get the player and check their score
    var player = npc.world.getEntity(npc.getStoreddata().get("inDialogWith"));
    var playerScore = player.world.getScoreboard().getPlayerScore(player.getName(), objective, "");//getObjective​​("dummyScore").getScore(player.getDisplay().getName());
    var value = false;
    if(playerScore <= score){value = true;}
    return value;
}

function getPlayerStoreddata(npc, key)
{
    // This is just an example and would make more sense being part of another function
    // You could use something similar to this to store and check if a player has read dialogs already
    var player = npc.world.getEntity(npc.getStoreddata().get("inDialogWith"));
    return player.getStoreddata().get(key);
}