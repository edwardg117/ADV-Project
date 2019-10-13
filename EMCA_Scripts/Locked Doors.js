/*
Locked Doors Script v1.1 by edwardg
Copy the lines below into the Door's script and configure to your liking, this script allows doors to be lockpicked.
It can be made so that the door can never be picked or can never get jammed.
This is a modification of a vanilla pickable doors I made that uses the two skills (lockpick and luck) to determine a successfull attempt.

var isLocked = 1 // Is the door locked (1 = true, 0 = false)
var pickable = 1 // Can the door be lockpicked (1 = true, 0 = false)
var jammed = 0 // Is the lock jammed (1 = true, 0 = false, -1 for un-jammable)
var diff = "Normal" // Dificulty (1 = VeryEasy, 3 = Easy, 5 = Normal, 7 = Hard, 10 = VeryHard)
var doorType = "wooden_door" // The type of door (wooden_door, iron_door, spruce_door, birch_door, jungle_door, acacia_door, dark_oak_door)
// Only edit the following if you want a key
// You should use scoreboard if you want to simulate a "keychain" that doesn't take up space in a players inventory.
var keyID = "" // ("" for no key, "minecraft:tripwire_hook" or any other item and 1 for a scoreboard objective)
var keyName = "" // Name of key or scoreboard objective, must be a string. ("Item Key" or "scoreboard_obj)
var keyLore = [""] // Only use if the key item has lore ["Lore line 1", "Lore line 2", "Lore Line 3"]
// Note that when checking the lore lines can be in any order and will be accepted as long as the desired lines are present
// Only edit this if you want custom lockpicks
var lockpickID = "minecraft:tripwire_hook" // ("minecraft:tripwire_hook" or any other item and 1 for a scoreboard objective)
var lockpickName = "Lockpick" // Name of item or scoreboard objective, must be a string. (same as keyName)
var lockpickLore = ["Used for opening locked doors."] // Only use if the lockpick item has lore ["Lore line 1", "Lore line 2", "Lore Line 3"]
var scoreboardLockpick = "skillLockpick" // The name of the scoreboard objective that holds the player's lockpick skill
var scoreboardLuck = "skillLuck" // The name of the scoreboard objective that holds the player's luck skill/stat
*/

/*VeryEasy= 1
Easy = 3
Normal = 5
Hard = 7
VeryHard = 10*/

/* #################################################################!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
Look into these when updating this script
IWorld.playSound
IBlock.interact

IPlayer.getOpenContainer
IPlayer.canQuestBeAccepted
IItemStack.compare

3 new events:
scriptCommand - use with the command /noppes script run
customChestClosed - triggered when IPlayer.showChestGui guis closes
customChestClicked - triggered when clicked inside of
IPlayer.showChestGui
*/

// Needed to keep track of player after event finishes
var lastInteract
var maxPickTime = 20
var pickTime = -10

function init(event)
{
    event.block.setBlockModel(doorType)
    event.block.getStoreddata().put("isLocked", isLocked)
    event.block.getStoreddata().put("pickable", pickable)
    event.block.getStoreddata().put("jammed", jammed)
    if(diff == "VeryEasy"){event.block.getStoreddata().put("diff", 1)}
    if(diff == "Easy"){event.block.getStoreddata().put("diff", 3)}
    if(diff == "Normal"){event.block.getStoreddata().put("diff", 5)}
    if(diff == "Hard"){event.block.getStoreddata().put("diff", 7)}
    if(diff == "VeryHard"){event.block.getStoreddata().put("diff", 10)}
    if(keyID != "")
    {
        if(typeof(keyID) == typeof("String"))
        {
            event.block.getStoreddata().put("keyType", 1)
        }
        else if(keyID == 1)
        {
            event.block.getStoreddata().put("keyType", 2)
            event.block.getStoreddata().put("scoreboardObjective", keyName)
        }   
    }
    else
    {
        event.block.getStoreddata().put("keyType", 0)
    }
    event.block.world.broadcast("Key type: " + event.block.getStoreddata().get("keyType"))
    if(typeof(lockpickID) == typeof("string"))
    {
        event.block.getStoreddata().put("pickType", 1)
    }
    else
    {
        event.block.getStoreddata().put("pickType", 2)
        event.block.getStoreddata().put("pickObjective", lockpickName)
    }
    event.block.getStoreddata().put("skillLockpick", scoreboardLockpick)
    event.block.getStoreddata().put("skillLuck", scoreboardLuck)
    event.block.getStoreddata().put("posX", event.block.getPos().getX())
    event.block.getStoreddata().put("posY", event.block.getPos().getY())
    event.block.getStoreddata().put("posZ", event.block.getPos().getZ())
}

function interact(event)
{
    lastInteract = event.player // Save this player for other functions
    // First ensure it's actually locked
    var isLocked = event.block.getStoreddata().get("isLocked")
    if(isLocked) // Can be lockpicked
    {
        // The door is locked, can it be picked?
        var isSneaking = event.player.isSneaking()
        if(isSneaking)
        {
            // Check if player has the key for this door
            var keyType = event.block.getStoreddata().get("keyType")
            if(keyType)
            {
                // Figure out what key we are looking for
                if(keyType == 1)
                {   // This type is a Key Item (physical item in inventory)
                    // #### build a reference key ####
                    keyItem = event.block.world.createItem(keyID, 0, 1)
                    keyItem.setCustomName(keyName)
                    if(keyLore != "")
                    {
                        keyItem.setLore(keyLore)
                    }

                    hasKey = hasItem(event, event.player, keyItem) // Check for specific item
                    if(hasKey)
                    {
                        event.block.getStoreddata().put("isLocked", 0)
                        event.API.executeCommand(event.block.world, "title " + event.player.getDisplayName() + ' actionbar ["",{"text":"Unlocked with Key","color":"black"}]')
                        isLocked = 0 // Need to update the variable too :P
                    }
                    else
                    {   // Else the player doesn't have the key so find out if they can pick it
                        pickable = event.block.getStoreddata().get("pickable")
                    }
                }
                else if(keyType == 2)
                {   // This type is Scoreboard Objective
                    scoreboardObjective = event.block.getStoreddata().get("scoreboardObjective")
                    var player = event.player.name
                    scoreBoard = event.player.world.scoreboard.getObjective(scoreboardObjective).getScore(player).getValue()
                    if(scoreBoard)
                    {   // Has the key
                        event.block.getStoreddata().put("isLocked", 0)
                        event.API.executeCommand(event.block.world, "title " + event.player.getDisplayName() + ' actionbar ["",{"text":"Unlocked with Key","color":"black"}]')
                        isLocked = 0
                    }
                    else
                    {   // Doesn't have the key
                        pickable = event.block.getStoreddata().get("pickable")
                    }
                }
                
            }
            else
            {   // There is no key for this door, can it be picked
                pickable = event.block.getStoreddata().get("pickable")
            }
            if(pickable && isLocked)
            {
                // Door is locked, can be picked
                var jammed = event.block.getStoreddata().get("jammed")
                var player = event.player.name
                skillLockpick = event.player.world.scoreboard.getObjective(event.block.getStoreddata().get("skillLockpick")).getScore(player).getValue()
                skillLuck = event.player.world.scoreboard.getObjective(event.block.getStoreddata().get("skillLuck")).getScore(player).getValue()
            
                if((!jammed) || (jammed == -1)) // Door is locked, can be picked and is not jammed
                {
                    if(skillLockpick > 0) // You have to know how to pick locks first
                    {
                        // Now we need to find out if the player has lockpicks, MC command: testfor @p {Inventory:[{tag:{display:{Name:"Lockpick",Lore:["Used for opening locked doors."]}}}]}
                        pickType = event.block.getStoreddata().get("pickType")
                        if(pickType == 1)
                        {
                            lockpick = event.player.world.createItem(lockpickID, 0, 1) // Crearte an item to test against the players inventory
                            lockpick.setCustomName(lockpickName)
                            lockpick.setLore(lockpickLore)
                            hasLockpicks = hasItem(event, event.player, lockpick) // Check for lockpicks in players inventory
                        }
                        else if(pickType == 2)
                        {
                            hasLockpicks = event.player.world.scoreboard.getObjective(event.block.getStoreddata().get("pickObjective")).getScore(player).getValue()
                            if(hasLockpicks < 0)
                            {
                                hasLockpicks = 0
                            }
                        }

                        // Player has lockpicks
                        if(hasLockpicks)
                        {
                            pickTime = maxPickTime
                            runPickTimeOnce = 1
                            event.block.timers.forceStart(2, 1, false) // begin picking the lock
                            event.setCanceled(true)

                        }
                        //Player has no lockpicks
                        else
                        {
                            event.API.executeCommand(event.block.world, "title " + event.player.getDisplayName() + ' actionbar ["",{"text":"You do not have any Lockpicks","color":"black"}]')
                            event.setCanceled(true)
                        }

                    }
                    // Lockpick has not been learned
                    else
                    {
                        event.API.executeCommand(event.block.world, "title " + event.player.getDisplayName() + ' actionbar ["",{"text":"You have not learned the Lockpick Skill","color":"black"}]')
                        event.setCanceled(true)
                    }
                }
                // Door is jammed
                else
                {
                    pickTime = maxPickTime
                    event.block.timers.forceStart(3, 1, false) // Begin un-jamming the door (Thought about costing lockpicks like with the vanilla but decided against it)
                    event.setCanceled(true)
                }       
            }
            // Door cannot be picked
            else if(isLocked)
            {
                event.API.executeCommand(event.block.world, "title " + event.player.getDisplayName() + ' actionbar ["",{"text":"This door cannot be picked","color":"black"}]')
                posX = event.block.getPos().getX()
                posY = event.block.getPos().getY()
                posZ = event.block.getPos().getZ()
                event.API.executeCommand(event.block.world, "playsound doors.locked block @a " + posX + " " + posY + " " + posZ)
                event.setCanceled(true)
            }
        }
        // Display that door is jammed rather than locked
        else if(event.block.getStoreddata().get("jammed") == 1)
        {
            event.API.executeCommand(event.block.world, "title " + event.player.getDisplayName() + ' actionbar ["",{"text":"This door is jammed!","color":"black"}]')
            event.setCanceled(true)
        }
        // Door is locked and not jammed
        else
        {
            event.API.executeCommand(event.block.world, "title " + event.player.getDisplayName() + ' actionbar ["",{"text":"This door is locked","color":"black"}]')
            if(event.block.getStoreddata().get("pickable") && (event.player.world.scoreboard.getObjective(event.block.getStoreddata().get("skillLockpick")).getScore(event.player.name).getValue() > 0)) // Only display lockpick chance if it can actually be picked
            {   // Wait a bit before presenting the lockpick chance
                event.block.timers.forceStart(1, 30, false)
            }
            event.setCanceled(true)
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
        skillLockpick = lastInteract.world.scoreboard.getObjective(event.block.getStoreddata().get("skillLockpick")).getScore(lastInteract.name).getValue()
        diff = event.block.getStoreddata().get("diff")

        if(skillLockpick - diff >= 0)
        {
            // 100% chance
            event.API.executeCommand(event.block.world, "title " + lastInteract.getDisplayName() + ' actionbar ["",{"text":"Sneak to use Lockpick(","color":"black"},{"text":"100%","color":"green"},{"text":")","color":"black"}]')
        }
        else if(skillLockpick - diff == -1)
        {
            //70% chance
            event.API.executeCommand(event.block.world, "title " + lastInteract.getDisplayName() + ' actionbar ["",{"text":"Sneak to use Lockpick(","color":"black"},{"text":"70%","color":"dark_green"},{"text":")","color":"black"}]')
        }
        else if(skillLockpick - diff == -2)
        {
            //30% chance
            event.API.executeCommand(event.block.world, "title " + lastInteract.getDisplayName() + ' actionbar ["",{"text":"Sneak to use Lockpick(","color":"black"},{"text":"30%","color":"gold"},{"text":")","color":"black"}]')
        }
        else
        {
            //10% chance
            event.API.executeCommand(event.block.world, "title " + lastInteract.getDisplayName() + ' actionbar ["",{"text":"Sneak to use Lockpick(","color":"black"},{"text":"10%","color":"dark_red"},{"text":")","color":"black"}]')
        }
    }

    if(event.id == 2) // Used for making lockpicking take time
    {
        if(pickTime > 0)
        {
            result = 0
            playerName = lastInteract.getDisplayName()
            skillLockpick = lastInteract.world.scoreboard.getObjective(event.block.getStoreddata().get("skillLockpick")).getScore(lastInteract.name).getValue()
            skillLuck = lastInteract.world.scoreboard.getObjective(event.block.getStoreddata().get("skillLuck")).getScore(lastInteract.name).getValue()
            posX = event.block.getStoreddata().get("posX")
            posY = event.block.getStoreddata().get("posY")
            posZ = event.block.getStoreddata().get("posZ")
            // Ensure player is still standing next to the door
            output = event.API.executeCommand(lastInteract.world, 'testfor @p[name='+ playerName + ',x=' + posX +',y=' + posY + ',z=' + posZ + ',r=3]')
            if(output.indexOf("Found " + playerName) > -1){result = 1}

            if(lastInteract.isSneaking() && result) // If standing next to door sneaking
            {
                pickPercentage = Math.floor(((20 - pickTime) / 20) * 100) // Display how far along in picking it is
                if(pickPercentage > 100){pickPercentage = 100} // If for some reason it's above 100%, fix it
                event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"Picking Lock...(","color":"black"},{"text":"' + pickPercentage + '%' + '","color":"yellow"},{"text":")","color":"black"}]')
                pickTime = pickTime - skillLockpick // Decrease lockpick time by skill
            }
            else
            {   // They have either moved too far away or aren't sneaking anymore
                pickTime = -10 // Sentinal Value
            }
            event.block.timers.forceStart(2, 9, false) // Repeat
        }
        else if(pickTime <= 0 && pickTime > -10) // This will only run once 
        {
            // Pick a random value between the difficulty level and 2 values below
            randDiff = randInt(diff-2,diff)
            if(skillLockpick >= randDiff) // The player has met of exceeded the difficulty requirement
            {
                event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"Success!","color":"green"}]')
                event.block.getStoreddata().put("isLocked", 0)
            }
            else // Player has failed the difficulty check
            {
                randLuck = randInt(0, 10) // Pick a number between 0 and 10 to compare against player's luck
                if(skillLuck > randLuck)
                {   // Player has high enough luck for a regular failure
                    event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"Failure!","color":"dark_red"}]')
                }
                else if(skillLuck == randLuck) // 1 in 10 chance of randomly succeeding
                {
                    // Critical Success
                    event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"Critical Success!","color":"green"}]')
                    var critWin = randInt(-1,10)
                    if(critWin == -1)
                    {
                        // title @a actionbar {"text":"You knock on the door. A Poltergeist opens the door and says \"Wait, this isn't my door.\" Then leaves.","color":"gold"}
                        event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"You knock on the door. A Poltergeist opens the door and says \"Wait, this isn\'t my door.\" Then leaves.","color":"gold"}]')
                    }
                    else if(critWin == 0)
                    {
                        // title @a actionbar {"text":"[God] **** this door in particular!","color":"gold"} (lightning bolt)
                        event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"[God] **** this door in particular!","color":"gold"}]')
                        event.API.executeCommand(event.block.world, "summon lightning_bolt " + event.block.getStoreddata().get("posX") + " " + event.block.getStoreddata().get("posY") + " " + event.block.getStoreddata().get("posZ"))
                    }
                    else if(critWin == 1)
                    {
                        // title @a actionbar {"text":"The door falls off it's hinges, how did that happen?","color":"gold"}
                        event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"The door falls off it\'s hinges, how did that happen?","color":"gold"}]')
                    }
                    else if(critWin == 2)
                    {
                        // title @a actionbar {"text":"By sheer luck you get the door open.","color":"gold"}
                        event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"By sheer luck you get the door open.","color":"gold"}]')
                    }
                    else if(critWin == 3)
                    {
                        // title @a actionbar {"text":"The lock falls out of the door.","color":"gold"}
                        event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"The lock falls out of the door.","color":"gold"}]')
                    }
                    else if(critWin == 4)
                    {
                        // title @a actionbar {"text":"The door feels violated, though it opens anyway.","color":"gold"}
                        event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"The door feels violated, though it opens anyway.","color":"gold"}]')
                    }
                    else if(critWin == 5)
                    {
                        // title @a actionbar {"text":"The door probably wasnt supposed to fall off, but it's open now.","color":"gold"}
                        event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"The door probably wasnt supposed to fall off, but it\'s open now.","color":"gold"}]')
                    }
                    else if(critWin == 6)
                    {
                        // title @a actionbar {"text":"Was that a lockpick or a sledgehammer? Well its open now regardless.","color":"gold"}
                        event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"Was that a lockpick or a sledgehammer? Well its open now regardless.","color":"gold"}]')
                    }
                    else if(critWin == 7)
                    {
                        // title @a actionbar {"text":"It turns out that the door wasn't locked in the first place.","color":"gold"}
                        event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"It turns out that the door wasn\'t locked in the first place.","color":"gold"}]')
                    }
                    else if(critWin == 8)
                    {
                        // title @a actionbar {"text":"With all the finesse of a drunkard, you somehow open it.","color":"gold"}
                        event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"With all the finesse of a drunkard, you somehow open it.","color":"gold"}]')
                    }
                    else if(critWin == 9)
                    {
                        // title @a actionbar {"text":"Instructions unclear, lockpick caught in door.","color":"gold"}
                        event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"Instructions unclear, lockpick caught in door.","color":"gold"}]')
                    }
                    else // critWin == 10
                    {
                        // title @a actionbar {"text":"You angrily headbutt the door. It swings open. You have a headache.","color":"gold"}
                        event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"You angrily headbutt the door. It swings open. You have a headache.","color":"gold"}]')
                    }
                    event.block.getStoreddata().put("isLocked", 0)
                    
                }
                else
                {
                    // Critical fail
                    pickType = event.block.getStoreddata().get("pickType")
                    if(pickType == 1)
                    {
                        event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"Critical Failure!","color":"dark_red"}]')
                        lockpick = lastInteract.world.createItem(lockpickID, 0, 1) // Crearte an item to test against the players inventory
                        lockpick.setCustomName(lockpickName)
                        lockpick.setLore(lockpickLore)
                        tags = itemMetaToString(lockpick)
                    }
                    var critFail = randInt(-1,10)
                    if(critFail < 5)
                    {
                        // Lose Lockpick
                        // title @a actionbar {"text":"Your lockpick breaks!","color":"dark_red"}
                        event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"Your lockpick breaks!","color":"dark_red"}]')
                        if(pickType == 1){event.API.executeCommand(event.block.world, 'clear ' + playerName + ' ' + lockpickID + ' 0 1 ' + tags)}
                        else if(pickType == 2){event.API.executeCommand(event.block.world, 'scoreboard players remove ' + playerName + ' ' + event.block.getStoreddata().get("pickObjective") + ' 1')}
                    }
                    else if(critFail == 5)
                    {
                        // Lock Jams
                        // title @a actionbar {"text":"The lock jams!","color":"dark_red"}
                        if(event.block.getStoreddata().get("jammed") != -1)
                        {
                            event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"The lock jams!","color":"dark_red"}]')
                            if(pickType == 1){event.API.executeCommand(event.block.world, 'clear ' + playerName + ' ' + lockpickID + ' 0 1 ' + tags)}
                            else if(pickType == 2){event.API.executeCommand(event.block.world, 'scoreboard players remove ' + playerName + ' ' + event.block.getStoreddata().get("pickObjective") + ' 1')}
                            event.block.getStoreddata().put("jammed", 1)
                        }
                        else
                        {
                            event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"Your lockpick breaks!","color":"dark_red"}]')
                            if(pickType == 1){event.API.executeCommand(event.block.world, 'clear ' + playerName + ' ' + lockpickID + ' 0 1 ' + tags)}
                            else if(pickType == 2){event.API.executeCommand(event.block.world, 'scoreboard players remove ' + playerName + ' ' + event.block.getStoreddata().get("pickObjective") + ' 1')}
                        }
                    }
                    else // critFail < 5
                    {
                        // You break your toe
                        // title @a actionbar {"text":"You kick the door in fustration and break your toe.","color":"dark_red"}
                        event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"You kick the door in fustration and break your toe.","color":"dark_red"}]')
                        event.API.executeCommand(event.block.world, "effect " + playerName + ' minecraft:poison 1 1')
                        event.API.executeCommand(event.block.world, "effect " + playerName + ' minecraft:slowness 60 0')
                    }
                }
            }  
        }
    }
    
    if(event.id == 3) // Used for making un-jamming take time
    {
        if(pickTime > 0)
        {
            playerName = lastInteract.getDisplayName()
            result = 0
            posX = event.block.getStoreddata().get("posX")
            posY = event.block.getStoreddata().get("posY")
            posZ = event.block.getStoreddata().get("posZ")
            // Ensure player is still standing next to the door
            output = event.API.executeCommand(lastInteract.world, 'testfor @p[name='+ playerName + ',x=' + posX +',y=' + posY + ',z=' + posZ + ',r=3]')
            if(output.indexOf("Found " + playerName) > -1){result = 1}
            
            if(lastInteract.isSneaking() && result)
            {
                event.API.executeCommand(event.block.world, "title " + playerName + ' actionbar ["",{"text":"Un-jamming lock...","color":"black"}]')
                pickTime--
                event.block.timers.forceStart(3, 9, false)
            }
            else
            {
                pickTime = -10
            }
        }
        else if(pickTime <= 0 && pickTime > -10)
        {
            event.block.getStoreddata().put("jammed", 0)
        }
    }
}

function hasItem(event, player, item)
{
    // This function is intended to replace the inventoryItemCount method in searching for a specific named item (Note: unlike inventoryItemCount it only returns true or false)
    itemString = item.getItemNbt().toJsonString()
    playerName = player.getDisplayName()
    var result = 0

    if(itemString.indexOf('Name:') > -1){itemName = 'Name:"' + item.getDisplayName() + '"'}
    else{itemName = ""}

    // Find the lore section in the JSON string
    index = itemString.indexOf('"Lore":')
    var str = ""
    if(index > -1)
    {
        for(i = index + 8; i < itemString.length - 1; i++) // Starting just after Lore, grab every character for processing
        {
            if(itemString[i] != "\n" && itemString[i] != " ") // New lines and a binch of spaces are included that break the search and need to be filtered out
            {
                if(itemString[i] == '"') // If a quotation is found stop ignoring spaces
                {
                    do
                    {
                        str = str + itemString[i]
                        i++
                    }
                    while(itemString[i] != '"') // After we reach the end of the string for the line of lore go back to normal
                    str = str + itemString[i] // If we don't grab this now it will be lost and screw up the formatting
                }
                else // Commas are rather important to grab too
                {
                    str = str + itemString[i]
                }
            }
            if(itemString[i] == "]"){i = itemString.length} // People seem to get upset when I use a break, so I'm going out of my way to upset everyone here
        }
        if(itemName == "") // Check if the item name is different
        {
            str = 'Lore:' + str
        }
        else
        {
            str = ',Lore:' + str
        }
    }
    // Command block output will be "Found playerX" or "playerX did not match the required data structure"
    if(itemName != "" || str != "")
    {
    output = event.API.executeCommand(event.player.world, 'testfor '+ playerName + ' {Inventory:[{id:"' + item.getName() + '",tag:{display:{' + itemName + str + '}}}]}')
    }
    else
    {
        output = event.API.executeCommand(event.player.world, 'testfor '+ playerName + ' {Inventory:[{id:"' + item.getName() + '"}]}')
    }
    if(output.indexOf("Found " + playerName) > -1){result = 1}
    return result
}

function itemMetaToString(item)
{
    itemString = item.getItemNbt().toJsonString()
    index = itemString.indexOf('"Lore":')
    var str = ""
    if(itemString.indexOf('Name:') > -1){itemName = 'Name:"' + item.getDisplayName() + '"'}
    else{itemName = ""}

    if(index > -1)
    {
        for(i = index + 8; i < itemString.length - 1; i++) // Starting just after Lore, grab every character for processing
        {
            if(itemString[i] != "\n" && itemString[i] != " ") // New lines and a binch of spaces are included that break the search and need to be filtered out
            {
                if(itemString[i] == '"') // If a quotation is found stop ignoring spaces
                {
                    do
                    {
                        str = str + itemString[i]
                        i++
                    }
                    while(itemString[i] != '"') // After we reach the end of the string for the line of lore go back to normal
                    str = str + itemString[i] // If we don't grab this now it will be lost and screw up the formatting
                }
                else // Commas are rather important to grab too
                {
                    str = str + itemString[i]
                }
            }
            if(itemString[i] == "]"){i = itemString.length} // People seem to get upset when I use a break, so I'm going out of my way to upset everyone here
        }
        if(itemName == "") // Check if the item name is different
        {
            str = 'Lore:' + str
        }
        else
        {
            str = ',Lore:' + str
        }
    }
    //{display:{Name:"Lockpick",Lore:["Used for opening locked doors."]}}
    if(itemName != "" || str != "")
    {
        result = '{display:{' + itemName + str + '}}'
    }
    else
    {
        result = ""
    }
    
    return result
}