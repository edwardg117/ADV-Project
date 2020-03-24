/*
Dead Body script v0.01 by edwardg
## Uses Run Delay by Ronan https://pastebin.com/YVqHYiAi ##
Main Features:
- NPC drops a lootable body upon death
- Body despawns after set time
- Random death pose from file
- Inventory from NPC is retained in the corpse
- Model and size retained
- Body has parts such as beards and fins
- Configrable decay time (time until the body despawns)
- Body holds currently equipped items
- Body wears currently equipped armor

Planned:
- Randomly populate inventory using a loot table


// #### Lootable Body Configuration ####
var keepAliveInv = true // Keep the same inventory as the NPC when it was alive
var poseFileName = "Default.json" // The pose file containing death poses
//[Not Implemented]var lootTable = "" // If keepAliveInv is false, what sort of loot should the npc be populated with, if any
var decayTime = 60 // Time in seconds that the body will despawn after (inventory file is deleted as well)

*/

var File = Java.type("java.io.File");
var Files = Java.type("java.nio.file.Files");
var CHARSET_UTF_8 = Java.type("java.nio.charset.StandardCharsets").UTF_8;

function died(event)
{
    // DiedEvent(ICustomNpc npc, net.minecraft.util.DamageSource damagesource, net.minecraft.entity.Entity entity)
    // Gather all the info we need about the NPC to duplicate it
    var nbt = event.npc.getEntityNbt().toJsonString(); //executeCommand("/entitydata @e[r=1,type=!player] {}");
    var npc = event.npc;
    var skin = npc.getDisplay().getSkinTexture();
    var name = npc.getDisplay().getName();
    var pos = npc.getPos();
    var rotation = npc.getRotation();
    var npcModel = npc.getDisplay().getModel();
    var npcSize = npc.getDisplay().getSize();
    var mainHand = npc.getMainhandItem();
    var offHand = npc.getOffhandItem();
    var armorBoots = npc.getArmor(0);
    var armorLegs = npc.getArmor(1);
    var armorChest = npc.getArmor(2);
    var armorHead = npc.getArmor(3);
    // Get extra parts like hair, beard, fins etc
    // Parts:[{
    ///var nbt = event.npc.executeCommand("/entitydata @e[r=1,type=!player] {}");
    //npc.world.broadcast(nbt);
    var indexOfParts = nbt.indexOf("\"Parts\":");
    //npc.world.broadcast("Parts index: " + indexOfParts);
    if(indexOfParts > 0) // indexOf returns -1 if false and NPCnbt will not
    {
        var i = 0;
        while(nbt[indexOfParts + i] != "]")
        {
            i ++;
        }
        //npc.world.broadcast("Last char: " + nbt[indexOfParts + i]);
        var NPCparts = ((nbt.substring(indexOfParts, indexOfParts + i + 1).replace(/"/g, "" )).replace(/ /g, "")).replace(/\n/g, "");
        //npc.world.broadcast("Full String:\n" + NPCparts);
    }

    // Get the poses that the body should use
    var deathPoseFolder = new File("saves/" + npc.world.getName() + "/Death Poses");
    var deathPoseFile = new File("saves/" + npc.world.getName() + "/Death Poses/" + poseFileName);
    if(deathPoseFile.exists())
    {
        var poses = JSON.parse(Files.readAllLines(deathPoseFile.toPath(), CHARSET_UTF_8)[0]);
        log("Death poses successfully loaded.");
    }
    else
    {
        log("Could not find Death Poses file '" + poseFileName + "' Creating it and populating with a blank pose...");
        var poses = ["PuppetHead:{RotationY:0.0f,RotationX:0.0f,RotationZ:0.0f,Disabled:0b},PuppetBody:{RotationY:0.0f,RotationX:0.0f,RotationZ:0.0f,Disabled:0b},PuppetLArm:{RotationY:0.0f,RotationX:0.0f,RotationZ:0.0f,Disabled:0b},PuppetRArm:{RotationY:0.0f,RotationX:0.0f,RotationZ:0.0f,Disabled:0b},PuppetLLeg:{RotationY:0.0f,RotationX:0.0f,RotationZ:0.0f,Disabled:0b},PuppetRLeg:{RotationY:0.0f,RotationX:0.0f,RotationZ:0.0f,Disabled:0b}"];
        deathPoseFolder.mkdirs();
        deathPoseFile.createNewFile();
        Files.write(deathPoseFile.toPath(), JSON.stringify(poses).getBytes());
        log("Done! You can add poses to saves/" + npc.world.getName() + "/Death Poses/" + poseFileName);
    }
    
    //npc.world.broadcast("NPC" + name + " has died at " + pos.getX() + " " + pos.getY() + " " + pos.getZ() + " Skin = " + skin)

    var deadBody = event.API.createNPC(event.npc.world.getMCWorld());
    
    deadBody.getDisplay().setSkinTexture(skin); // Get same skin as NPC
    deadBody.getDisplay().setName(name); // It should probably have the same name as the 
    deadBody.getDisplay().setShowName(1); // Invisible
    deadBody.getDisplay().setHasLivingAnimation(false); // No arm wiggle
    deadBody.getDisplay().setModel(npcModel); // Inherrit model from NPC
    deadBody.getDisplay().setSize(npcSize); // Inherrit size too
    
    deadBody.setHome(pos.getX(), pos.getY(), pos.getZ()); // Home is where this NPC died
    deadBody.getAi().setAnimation(2); // Sleeping / lying
    deadBody.getAi().setReturnsHome(false);
    
    deadBody.getStats().setImmune(0, true); // Potion immune
    deadBody.getStats().setImmune(1, true); // Fall immune
    deadBody.getStats().setImmune(2, false); // Burns in sun
    deadBody.getStats().setImmune(3, true); // Fire immune
    deadBody.getStats().setImmune(4, true); // Drowning immune
    deadBody.getAdvanced().setLine(0, 0, "", ""); // Remove interact "Hello @p!", dead bodies shouldn't talk
    deadBody.setPos(pos); // Set the actual position of the corpse
    deadBody.spawn(); // Spawn it in
    
    deadBody.addTag("removeEyes");
    deadBody.executeCommand("/entitydata @e[tag=removeEyes] {NpcModelData:{Eyes:{Type:-1b}," + NPCparts + "}}"); // No blinking eyes and model bits
    // Chose a death pose
    var deathPose = poses[randInt(0, poses.length - 1)];
    deadBody.executeCommand("/entitydata @e[tag=removeEyes] {NpcJob:9,PuppetMoving:1b,PuppetAttacking:1b,PuppetStanding:1b,PuppetAnimate:0b, " + deathPose + "}"); // Give a death pose
    var corpseDespawnScript = 'ScriptLanguage:"ECMAScript",ScriptEnabled:1b,Scripts:[{Script:"function init(event){runDelay(' + decayTime + ', function(){delBody(event);});}function interact(event){showInventory(event, event.player);}function tick(e){runDelayTick();}function delBody(event){var inventoryFile = new File(\\"saves/\\" + event.npc.world.getName() + \\"/inventories/\\" + event.npc.getName() + \\" \\" + event.npc.getUUID() + \\".txt\\");Files.delete(inventoryFile.toPath());event.npc.despawn();}",Console:[],ScriptList:[{Line:"inventory.js"},{Line:"rundelay.js"}]}]';
    deadBody.executeCommand("/entitydata @e[tag=removeEyes] {" + corpseDespawnScript + "}");
    //deadBody.executeCommand("/entitydata @e[tag=removeEyes] {BodyConfig:{" + NPCparts + "}}");
    deadBody.updateClient(); // Push the change so it takes effect
    deadBody.removeTag("removeEyes");
    deadBody.setRotation(rotation);
    // Armour and Held Items
    deadBody.setMainhandItem(mainHand);
    deadBody.setOffhandItem(offHand);
    deadBody.setArmor(0, armorBoots);
    deadBody.setArmor(1, armorLegs);
    deadBody.setArmor(2, armorChest);
    deadBody.setArmor(3, armorHead);

    // Body's inventory
    keepAliveInv = true; // TODO make a way to disable inv or random loot table
    if(keepAliveInv)
    {
        // The body should keep the same inventory as the NPC
        var inventoriesFolder = new File("saves/" + npc.world.getName() + "/inventories");
        var inventoryFile = new File("saves/" + npc.world.getName() + "/inventories/" + npc.getName() + " " + npc.getUUID() + ".txt");
        if(inventoryFile.exists())
        {
            var bodyInventoryFile = new File("saves/" + npc.world.getName() + "/inventories/" + npc.getName() + " " + deadBody.getUUID() + ".txt");
            Files.copy(inventoryFile.toPath(), bodyInventoryFile.toPath());
            deadBody.getStoreddata().put("hasInventory", 1)
            deadBody.getStoreddata().put("inventorySize", npc.getStoreddata().get("inventorySize"));
            log("Inventory file successfully cloned for body!");
        }
        else
        {
            log("[WARN!] keepAliveInv is set to true but this NPC has no inventory!\n        Body will spawn with an empty inventory.");
        }
    }
    else
    {
        npc.world.broadcast("MAJOR ERROR IN DeadBody.js, SHOULD NOT BE ABLE TO REACH THIS LINE! keepAliveInv returned false!");
    }
}

function randInt(min, max) 
{   // Returns a random number
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}