/*
Locked Doors Script v2.3 by edwardg
This is a modification of a vanilla pickable doors I made that uses the two skills (lockpick and luck) to determine a successfull attempt.
New in this version:
- Cleaned up a little bit
- fixed a variable not being declared

Copy the lines below into the Door's script and configure to your liking, this script allows doors to be lockpicked.
It can be made so that the door can never be picked or can never get jammed.
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var isLocked = 1 // Is the door locked (1 = true, 0 = false)
var pickable = 1 // Can the door be lockpicked (1 = true, 0 = false)
var jammed = 0 // Is the lock jammed (1 = true, 0 = false, -1 for un-jammable)
var diff = "Normal" // Dificulty (1 = VeryEasy, 3 = Easy, 5 = Normal, 7 = Hard, 10 = VeryHard)
var doorType = "wooden_door" // The type of door (wooden_door, iron_door, spruce_door, birch_door, jungle_door, acacia_door, dark_oak_door)

// Only edit the following if you want a key
// You should use scoreboard if you want to simulate a "keychain" that doesn't take up space in a players inventory.
var keyID = 0 // (0 for no key, 1 for item NBT tag and 2 for a scoreboard objective)
var keyName = "" // Item NBT tag or scoreboard objective, must be a string. ("isSpecificDoorKey" or "scoreboard_obj")

// Only edit this if you want custom lockpicks
var lockpickID = 1 // (1 for item with NBT and 2 for a scoreboard objective)
var lockpickName = "isLockpick" // Item NBT tag or scoreboard objective, must be a string. (same as keyName)

var scoreboardLockpick = "skillLockpick" // The name of the scoreboard objective that holds the player's lockpick skill
var scoreboardLuck = "skillLuck" // The name of the scoreboard objective that holds the player's luck skill/stat
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
*/
// Dificulty level integer values (assuption is that 0 is not needed, because the door wouldn't be locked)
/*VeryEasy= 1
Easy = 3
Normal = 5
Hard = 7
VeryHard = 10*/

// Needed to keep track of player after event finishes
var lastInteract;
var maxPickTime = 20;
var pickTime = -10;

function init(event)
{
    event.block.setBlockModel(doorType);
    event.block.getStoreddata().put("isLocked", isLocked);
    event.block.getStoreddata().put("pickable", pickable);
    event.block.getStoreddata().put("jammed", jammed);

    if(diff == "VeryEasy"){event.block.getStoreddata().put("diff", 1);}
    if(diff == "Easy"){event.block.getStoreddata().put("diff", 3);}
    if(diff == "Normal"){event.block.getStoreddata().put("diff", 5);}
    if(diff == "Hard"){event.block.getStoreddata().put("diff", 7);}
    if(diff == "VeryHard"){event.block.getStoreddata().put("diff", 10);}
    
    
    
    event.block.getStoreddata().put("keyType", keyID);
    event.block.getStoreddata().put("keyName", keyName);
        
    event.block.world.broadcast("Key type: " + event.block.getStoreddata().get("keyType"));



    event.block.getStoreddata().put("pickType", lockpickID);
    event.block.getStoreddata().put("lockpickName", lockpickName);



    event.block.getStoreddata().put("skillLockpick", scoreboardLockpick);
    event.block.getStoreddata().put("skillLuck", scoreboardLuck);
    event.block.getStoreddata().put("posX", event.block.getPos().getX());
    event.block.getStoreddata().put("posY", event.block.getPos().getY());
    event.block.getStoreddata().put("posZ", event.block.getPos().getZ());
}

function interact(event)
{
    lastInteract = event.player; // Save this player for other functions
    // First ensure it's actually locked
    var isLocked = event.block.getStoreddata().get("isLocked");
    if(isLocked) // Can be lockpicked
    {
        // The door is locked, can it be picked?
        var isSneaking = event.player.isSneaking();
        var keyType = event.block.getStoreddata().get("keyType");
        if(isSneaking)
        {
            // Check if player has the key for this door
            if(keyType)
            {
                // Figure out what key we are looking for
                if(keyType == 1)
                {   // This type is a Key Item (physical item in inventory)
                    var hasKey = hasItem(event.player, event.block.getStoreddata().get("keyName")); // Check if player has key
                    if(hasKey)
                    {
                        event.block.getStoreddata().put("isLocked", 0);
                        event.API.executeCommand(event.block.world, "title " + event.player.getDisplayName() + ' actionbar ["",{"text":"Unlocked with Key","color":"black"}]');
                        isLocked = 0; // Need to update the variable too :P
                    }
                    else
                    {   // Else the player doesn't have the key so find out if they can pick it
                        pickable = event.block.getStoreddata().get("pickable");
                    }
                }
                else if(keyType == 2)
                {   // This type is Scoreboard Objective
                    var keyName = event.block.getStoreddata().get("keyName");
                    var player = event.player.name;
                    var scoreBoard = event.player.world.scoreboard.getObjective(keyName).getScore(player).getValue();
                    if(scoreBoard)
                    {   // Has the key
                        event.block.getStoreddata().put("isLocked", 0);
                        event.API.executeCommand(event.block.world, "title " + event.player.getDisplayName() + ' actionbar ["",{"text":"Unlocked with Key","color":"black"}]');
                        isLocked = 0;
                    }
                    else
                    {   // Doesn't have the key
                        pickable = event.block.getStoreddata().get("pickable");
                    }
                }
                
            }
            else
            {   // There is no key for this door, can it be picked
                var pickable = event.block.getStoreddata().get("pickable");
            }


            if(pickable && isLocked)
            {
                // Door is locked, can be picked
                var jammed = event.block.getStoreddata().get("jammed");
                var player = event.player.name;
                var skillLockpick = event.player.world.scoreboard.getObjective(event.block.getStoreddata().get("skillLockpick")).getScore(player).getValue();
                var skillLuck = event.player.world.scoreboard.getObjective(event.block.getStoreddata().get("skillLuck")).getScore(player).getValue(); // Declared but never read???
            
                if((!jammed) || (jammed == -1)) // Door is locked, can be picked and is not jammed
                {
                    if(skillLockpick > 0) // You have to know how to pick locks first
                    {
                        // Now we need to find out if the player has lockpicks, scoreboard or item?
                        var pickType = event.block.getStoreddata().get("pickType");
                        if(pickType == 1)
                        {
                            var hasLockpicks = hasItem(event.player, event.block.getStoreddata().get("lockpickName")); // Check for lockpicks in players inventory
                        }
                        else if(pickType == 2)
                        {
                            var hasLockpicks = event.player.world.scoreboard.getObjective(event.block.getStoreddata().get("lockpickName")).getScore(player).getValue();
                            if(hasLockpicks < 0) // Scoreboard values can be negative, negative values are considered true
                            {
                                hasLockpicks = 0;
                            }
                        }

                        // Player has lockpicks
                        if(hasLockpicks)
                        {
                            pickTime = maxPickTime; // These must be global, rip 20mins of my life
                            //runPickTimeOnce = 1
                            event.block.timers.forceStart(2, 1, false); // begin picking the lock
                            event.setCanceled(true);

                        }
                        //Player has no lockpicks
                        else
                        {
                            event.API.executeCommand(event.block.world, "title " + event.player.getDisplayName() + ' actionbar ["",{"text":"You do not have any Lockpicks","color":"black"}]');
                            event.setCanceled(true);
                        }

                    }
                    // Lockpick has not been learned
                    else
                    {
                        event.API.executeCommand(event.block.world, "title " + event.player.getDisplayName() + ' actionbar ["",{"text":"You have not learned the Lockpick Skill","color":"black"}]');
                        event.setCanceled(true);
                    }
                }
                // Door is jammed
                else
                {
                    pickTime = maxPickTime;
                    event.block.timers.forceStart(3, 1, false); // Begin un-jamming the door (Thought about costing lockpicks like with the vanilla but decided against it)
                    event.setCanceled(true);
                }       
            }
            // Door cannot be picked
            else if(isLocked)
            {
                event.API.executeCommand(event.block.world, "title " + event.player.getDisplayName() + ' actionbar ["",{"text":"This door cannot be picked","color":"black"}]');
                var pos = event.block.getPos();
                event.block.world.playSoundAt(pos, "doors.locked", 1, 1);
                event.setCanceled(true);
            }
        }
        // Display that door is jammed rather than locked
        else if(event.block.getStoreddata().get("jammed") == 1)
        {
            event.API.executeCommand(event.block.world, "title " + event.player.getDisplayName() + ' actionbar ["",{"text":"This door is jammed!","color":"black"}]');
            event.setCanceled(true);
        }
        // Door is locked and not jammed
        else
        {
            event.API.executeCommand(event.block.world, "title " + event.player.getDisplayName() + ' actionbar ["",{"text":"This door is locked","color":"black"}]');
            var hasKey = 0;
            if(keyType)
            {
                if(keyType == 1)
                {
                    hasKey = hasItem(event.player, event.block.getStoreddata().get("keyName")); // Check if player has key
                    if(hasKey){event.API.executeCommand(event.block.world, "title " + event.player.getDisplayName() + ' actionbar ["",{"text":"You have the key to this door","color":"black"}]');}
                }
                else if(keyType == 2)
                {
                    keyName = event.block.getStoreddata().get("keyName");
                    var player = event.player.name;
                    var scoreBoard = event.player.world.scoreboard.getObjective(keyName).getScore(player).getValue();
                    if(scoreBoard)
                    {
                        event.API.executeCommand(event.block.world, "title " + event.player.getDisplayName() + ' actionbar ["",{"text":"You have the key to this door","color":"black"}]');
                        hasKey = 1;
                    }
                }
                else
                {
                    event.block.world.broadcast("This door has an invalid keyID, should be in range 0-2 but is " + keyType);
                }
            }
            if(event.block.getStoreddata().get("pickable") && (event.player.world.scoreboard.getObjective(event.block.getStoreddata().get("skillLockpick")).getScore(event.player.name).getValue() > 0) && !hasKey) // Only display lockpick chance if it can actually be picked
            {   // Wait a bit before presenting the lockpick chance
                event.block.timers.forceStart(1, 30, false);
            }
            event.setCanceled(true);
        }
    }
    //This door isn't locked
}

function randInt(min, max) 
{   // Returns a random number
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function timer(event)
{
    if(event.id == 1 && event.block.getStoreddata().get("isLocked") && pickTime == -10) // Present chance of success
    {
        var skillLockpick = lastInteract.world.scoreboard.getObjective(event.block.getStoreddata().get("skillLockpick")).getScore(lastInteract.name).getValue();
        var diff = event.block.getStoreddata().get("diff");

        if(skillLockpick - diff >= 0)
        {
            // 100% chance
            event.API.executeCommand(event.block.world, "title " + lastInteract.getDisplayName() + ' actionbar ["",{"text":"Sneak to use Lockpick(","color":"black"},{"text":"100%","color":"green"},{"text":")","color":"black"}]');
        }
        else if(skillLockpick - diff == -1)
        {
            //70% chance
            event.API.executeCommand(event.block.world, "title " + lastInteract.getDisplayName() + ' actionbar ["",{"text":"Sneak to use Lockpick(","color":"black"},{"text":"70%","color":"dark_green"},{"text":")","color":"black"}]');
        }
        else if(skillLockpick - diff == -2)
        {
            //30% chance
            event.API.executeCommand(event.block.world, "title " + lastInteract.getDisplayName() + ' actionbar ["",{"text":"Sneak to use Lockpick(","color":"black"},{"text":"30%","color":"gold"},{"text":")","color":"black"}]');
        }
        else
        {
            //10% chance
            event.API.executeCommand(event.block.world, "title " + lastInteract.getDisplayName() + ' actionbar ["",{"text":"Sneak to use Lockpick(","color":"black"},{"text":"10%","color":"dark_red"},{"text":")","color":"black"}]');
        }
    }

    if(event.id == 2) // Used for making lockpicking take time
    {
        var playerName = lastInteract.getDisplayName();
        var skillLockpick = lastInteract.world.scoreboard.getObjective(event.block.getStoreddata().get("skillLockpick")).getScore(lastInteract.name).getValue();
        var skillLuck = lastInteract.world.scoreboard.getObjective(event.block.getStoreddata().get("skillLuck")).getScore(lastInteract.name).getValue();
        var diff = event.block.getStoreddata().get("diff");
        if(pickTime > 0)
        {
            var result = 0;
            var posX = event.block.getStoreddata().get("posX");
            var posY = event.block.getStoreddata().get("posY");
            var posZ = event.block.getStoreddata().get("posZ");
            // Ensure player is still standing next to the door
            var output = event.API.executeCommand(lastInteract.world, 'testfor @p[name='+ playerName + ',x=' + posX +',y=' + posY + ',z=' + posZ + ',r=3]');
            if(output.indexOf("Found " + playerName) > -1){result = 1;}

            if(lastInteract.isSneaking() && result) // If standing next to door sneaking
            {
                var pickPercentage = Math.floor(((20 - pickTime) / 20) * 100); // Display how far along in picking it is
                if(pickPercentage > 100){pickPercentage = 100} // If for some reason it's above 100%, fix it
                event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"Picking Lock...(","color":"black"},{"text":"' + pickPercentage + '%' + '","color":"yellow"},{"text":")","color":"black"}]');
                pickTime = pickTime - skillLockpick; // Decrease lockpick time by skill
            }
            else
            {   // They have either moved too far away or aren't sneaking anymore
                pickTime = -10; // Sentinal Value
            }
            event.block.timers.forceStart(2, 9, false); // Repeat
        }
        else if(pickTime <= 0 && pickTime > -10) // This will only run once 
        {
            // Pick a random value between the difficulty level and 2 values below
            var randDiff = randInt(diff-2,diff);
            if(skillLockpick >= randDiff) // The player has met or exceeded the difficulty requirement
            {
                event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"Success!","color":"green"}]');
                event.block.getStoreddata().put("isLocked", 0);
            }
            else // Player has failed the difficulty check
            {
                var randLuck = randInt(0, 10); // Pick a number between 0 and 10 to compare against player's luck
                if(skillLuck > randLuck)
                {   // Player has high enough luck for a regular failure
                    event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"Failure!","color":"dark_red"}]');
                }
                else if(skillLuck == randLuck) // 1 in 10 chance of randomly succeeding
                {
                    // Critical Success
                    event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"Critical Success!","color":"green"}]');
                    var critWin = randInt(-1,10);
                    if(critWin == -1)
                    {
                        // title @a actionbar {"text":"You knock on the door. A Poltergeist opens the door and says \"Wait, this isn't my door.\" Then leaves.","color":"gold"}
                        event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"You knock on the door. A Poltergeist opens the door and says \"Wait, this isn\'t my door.\" Then leaves.","color":"gold"}]');
                    }
                    else if(critWin == 0)
                    {
                        // title @a actionbar {"text":"[God] **** this door in particular!","color":"gold"} (lightning bolt)
                        event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"[God] **** this door in particular!","color":"gold"}]');
                        event.API.executeCommand(event.block.world, "summon lightning_bolt " + event.block.getStoreddata().get("posX") + " " + event.block.getStoreddata().get("posY") + " " + event.block.getStoreddata().get("posZ"));
                    }
                    else if(critWin == 1)
                    {
                        // title @a actionbar {"text":"The door falls off it's hinges, how did that happen?","color":"gold"}
                        event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"The door falls off it\'s hinges, how did that happen?","color":"gold"}]');
                    }
                    else if(critWin == 2)
                    {
                        // title @a actionbar {"text":"By sheer luck you get the door open.","color":"gold"}
                        event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"By sheer luck you get the door open.","color":"gold"}]');
                    }
                    else if(critWin == 3)
                    {
                        // title @a actionbar {"text":"The lock falls out of the door.","color":"gold"}
                        event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"The lock falls out of the door.","color":"gold"}]');
                    }
                    else if(critWin == 4)
                    {
                        // title @a actionbar {"text":"The door feels violated, though it opens anyway.","color":"gold"}
                        event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"The door feels violated, though it opens anyway.","color":"gold"}]');
                    }
                    else if(critWin == 5)
                    {
                        // title @a actionbar {"text":"The door probably wasnt supposed to fall off, but it's open now.","color":"gold"}
                        event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"The door probably wasnt supposed to fall off, but it\'s open now.","color":"gold"}]');
                    }
                    else if(critWin == 6)
                    {
                        // title @a actionbar {"text":"Was that a lockpick or a sledgehammer? Well its open now regardless.","color":"gold"}
                        event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"Was that a lockpick or a sledgehammer? Well its open now regardless.","color":"gold"}]');
                    }
                    else if(critWin == 7)
                    {
                        // title @a actionbar {"text":"It turns out that the door wasn't locked in the first place.","color":"gold"}
                        event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"It turns out that the door wasn\'t locked in the first place.","color":"gold"}]');
                    }
                    else if(critWin == 8)
                    {
                        // title @a actionbar {"text":"With all the finesse of a drunkard, you somehow open it.","color":"gold"}
                        event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"With all the finesse of a drunkard, you somehow open it.","color":"gold"}]');
                    }
                    else if(critWin == 9)
                    {
                        // title @a actionbar {"text":"Instructions unclear, lockpick caught in door.","color":"gold"}
                        event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"Instructions unclear, lockpick caught in door.","color":"gold"}]');
                    }
                    else // critWin == 10
                    {
                        // title @a actionbar {"text":"You angrily headbutt the door. It swings open. You have a headache.","color":"gold"}
                        event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"You angrily headbutt the door. It swings open. You have a headache.","color":"gold"}]');
                    }
                    event.block.getStoreddata().put("isLocked", 0);
                    
                }
                else
                {
                    // Critical fail
                    var pickType = event.block.getStoreddata().get("pickType");
                    var lockpickName = event.block.getStoreddata().get("lockpickName");
                    var playerName = lastInteract.getDisplayName();
                    if(pickType == 1)
                    {
                        event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"Critical Failure!","color":"dark_red"}]');
                        var lockpick = getItemMatchingNbtTag(lastInteract, lockpickName);
                    }
                    var critFail = randInt(-1,10);
                    if(critFail < 5)
                    {
                        // Lose Lockpick
                        // title @a actionbar {"text":"Your lockpick breaks!","color":"dark_red"}
                        event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"Your lockpick breaks!","color":"dark_red"}]');
                        if(pickType == 1){lastInteract.removeItem(lockpick, 1);}
                        else if(pickType == 2)
                        {
                            score = lastInteract.world.scoreboard.getObjective(lockpickName).getScore(playerName).getValue();
                            lastInteract.world.scoreboard.getObjective(lockpickName).getScore(playerName).setValue(score - 1);
                        }
                    }
                    else if(critFail == 5)
                    {
                        // Lock Jams
                        // title @a actionbar {"text":"The lock jams!","color":"dark_red"}
                        if(event.block.getStoreddata().get("jammed") != -1)
                        {
                            event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"The lock jams!","color":"dark_red"}]');
                            if(pickType == 1){lastInteract.removeItem(lockpick, 1);}
                            else if(pickType == 2)
                            {
                                score = lastInteract.world.scoreboard.getObjective(lockpickName).getScore(playerName).getValue();
                                lastInteract.world.scoreboard.getObjective(lockpickName).getScore(playerName).setValue(score - 1);
                            }
                            event.block.getStoreddata().put("jammed", 1);
                        }
                        else
                        {
                            event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"Your lockpick breaks!","color":"dark_red"}]');
                            if(pickType == 1){lastInteract.removeItem(lockpick, 1);}
                            else if(pickType == 2)
                            {
                                score = lastInteract.world.scoreboard.getObjective(lockPickName).getScore(playerName).getValue();
                                lastInteract.world.scoreboard.getObjective(lockPickName).getScore(playerName).setValue(score - 1);
                            }
                        }
                    }
                    else // critFail < 5
                    {
                        // You break your toe
                        // title @a actionbar {"text":"You kick the door in fustration and break your toe.","color":"dark_red"}
                        event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"You kick the door in fustration and break your toe.","color":"dark_red"}]');
                        event.API.executeCommand(event.block.world, "effect " + playerName + ' minecraft:poison 1 1');
                        event.API.executeCommand(event.block.world, "effect " + playerName + ' minecraft:slowness 60 0');
                    }
                }
            }  
        }
    }
    
    if(event.id == 3) // Used for making un-jamming take time
    {
        if(pickTime > 0)
        {
            playerName = lastInteract.getDisplayName();
            var result = 0; // This could also be changed to true or false
            posX = event.block.getStoreddata().get("posX");
            posY = event.block.getStoreddata().get("posY");
            posZ = event.block.getStoreddata().get("posZ");
            // Ensure player is still standing next to the door
            var output = event.API.executeCommand(lastInteract.world, 'testfor @p[name='+ playerName + ',x=' + posX +',y=' + posY + ',z=' + posZ + ',r=3]');
            if(output.indexOf("Found " + playerName) > -1){result = 1;}
            
            if(lastInteract.isSneaking() && result)
            {
                event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"Un-jamming lock...","color":"black"}]');
                pickTime--;
                event.block.timers.forceStart(3, 9, false);
            }
            else
            {
                pickTime = -10;
            }
        }
        else if(pickTime <= 0 && pickTime > -10)
        {
            event.block.getStoreddata().put("jammed", 0);
        }
    }
}

function hasItem(player, key)
{
    // Checks if the player has an item with the NBT key, returns 1 or 0 (true or false, should look into changing to this later)
    var check = 0; // Value for seeing if they have the item in the end
    var i = 0;
    var inventory = player.getInventory().getItems(); // Returns a list of items in player inventory

    while(i < inventory.length) // For each item, check for the NBT key (a string value held in key variable)
    {
        if(inventory[i].getNbt().has(key))
        {
            check = 1;
            break; // Only intersted in seeing that they have it, could count but meh
        }
        i++;
    }
    return check;
}

function getItemMatchingNbtTag(player, key)
{
    // Finds the specified item with the NBT key and returns it
    var i = 0;
    var inventory = player.getInventory().getItems(); // Returns a list of items in player inventory

    while(i < inventory.length) // For each item, check for the NBT key (a string value held in key variable)
    {
        if(inventory[i].getNbt().has(key))
        {
            break;
        }
        i++;
    }
    return inventory[i];
}