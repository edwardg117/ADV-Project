/*
NPC Inventories V0.01 by edwardg
Borrowed some stuff from Ronan, another example of this at https://github.com/Runonstof/CustomNPCs-Scripting-Software/blob/master/core/CustomMenuHandler.js
Main features:
- Minecraft like inventories for NPCs
- Saves between open/close of world/minecraft
- Automatically makes the folders/files and names the container the same as the NPC's name

Planned:
- Make it so that the NPC can have more inventory space
- Have the inventory follow the NPC across names
- Remove init and interact and add functions to call instead
- Error checking if I can be bothered

*/

// Need to work with files
var File = Java.type("java.io.File");
var Files = Java.type("java.nio.file.Files");
var CHARSET_UTF_8 = Java.type("java.nio.charset.StandardCharsets").UTF_8;

// Dirty Globals
var GInventory;
var Gme;

function init(event)
{
    Gme = event.npc;
    var inventoriesFolder = new File("saves/" + event.npc.world.getName() + "/inventories");
    var inventoryFile = new File("saves/" + event.npc.world.getName() + "/inventories/" + event.npc.getName() + ".txt");
    if(!inventoryFile.exists()) 
    {
        event.npc.world.broadcast("Inventory file does not exist. Creating...");
        inventoriesFolder.mkdirs();
        inventoryFile.createNewFile();
        // The following is for a size 3 chest gui only
        var defaultFile = '[["minecraft:air","",0,0,[],""],["minecraft:air","",0,0,[],""],["minecraft:air","",0,0,[],""],["minecraft:air","",0,0,[],""],["minecraft:air","",0,0,[],""],["minecraft:air","",0,0,[],""],["minecraft:air","",0,0,[],""],["minecraft:air","",0,0,[],""],["minecraft:air","",0,0,[],""],["minecraft:air","",0,0,[],""],["minecraft:air","",0,0,[],""],["minecraft:air","",0,0,[],""],["minecraft:air","",0,0,[],""],["minecraft:air","",0,0,[],""],["minecraft:air","",0,0,[],""],["minecraft:air","",0,0,[],""],["minecraft:air","",0,0,[],""],["minecraft:air","",0,0,[],""],["minecraft:air","",0,0,[],""],["minecraft:air","",0,0,[],""],["minecraft:air","",0,0,[],""],["minecraft:air","",0,0,[],""],["minecraft:air","",0,0,[],""],["minecraft:air","",0,0,[],""],["minecraft:air","",0,0,[],""],["minecraft:air","",0,0,[],""],["minecraft:air","",0,0,[],""]]';
        Files.write(inventoryFile.toPath(), defaultFile.getBytes());
        event.npc.world.broadcast("File created in initialized");
    }   
}

function interact(event)
{
    // Remove at some point
    var inventory = event.player.showChestGui(3);
    inventory.	setName(event.npc.getName());
    //event.npc.world.broadcast("[" + inventory.getSlot(36).	getItemName() + "]");
    // If global value has something in it, no need to get the inventory from file
    if(GInventory)
    {
        var invStart = 36; // Custom container slots start at 36
        var invCurrent = 0;
        var invSize = inventory.getSize() - invStart;
        // Loop through entire custom container to populate the NPC inventory 
        for(var i = 0; i < invSize; i += 1)
        {
            invCurrent = invStart + i;
            inventory.setSlot(invCurrent, GInventory[i]);
        }
    }
    else // First time since the NPC initilaized, have to grab inventory from file
    {
        var itemList = retreiveInvFromFile(event);
        var invStart = 36; // Custom container starts at 36
        var invCurrent = 0;
        var invSize = inventory.getSize() - invStart;
        // This loop populates the NPC inventory 
        for(var i = 0; i < invSize; i += 1)
        {
            invCurrent = invStart + i;
            inventory.setSlot(invCurrent, itemList[i]);
        }
    }
}

function customChestClicked(event)
{
    // What to do if a slot is clicked    
    if(!(event.heldItem.isEmpty() && event.slotItem.isEmpty())) // If the slot is occupied and/or the player is holding an item, swap them
    {
        // Simple swap
        var held = event.heldItem;
        event.heldItem = event.slotItem.copy()
        event.slotItem = held.copy();
    }
    
}

function customChestClosed(event)
{
    // Inventory closed, save it
    GInventory = getInventoryContents(event.container);
    writeGlobalInv(event); // This writes to disk
}

function getInventoryContents(container)
{
    // Returns an array of items
    var invStart = 36; // Custom container starts at 36
    var invCurrent = 0;
    var invSize = container.getSize() - invStart;
    var inv = [];
    // Loop through entire custom container and copy all items
    for(var i = 0; i < invSize; i += 1)
    {
        invCurrent = invStart + i;
        inv.push(container.getSlot(invCurrent).copy());
    }
    return inv; // Returns [IItemStack, IItemStack, IItemStack,...]
}

function writeGlobalInv(event)
{
    // Converts all items to a string because you can't save an IItemStack ;(
    var inventoryFile = new File("saves/" + event.player.world.getName() + "/inventories/" + Gme.getName() + ".txt");
    
    var savingInv = [];
    var currentItem = ""; // minecraft:tripwire_hook
    var name = ""; // Tripwire Hook
    var count = 0;
    var damage = 0;
    var lore = []; // [Spooky, Lore, Bad]
    var nbt = "";
    var loreConverted = [];

    for(var i = 0; i < GInventory.length; i += 1)
    {
        currentItem = GInventory[i].getName();
        name = GInventory[i].getDisplayName();
        count = GInventory[i].getStackSize();
        damage = 0;
        damage = GInventory[i].getItemDamage();
        lore = [];
        // I don't know if it's needed to reset values like this. I did it while spending 5 hours trying to figure out why things where changing when they shouldn't have
        // At this point I'm scared to change it
        lore = GInventory[i].getLore();
        loreConverted = [];
        if(lore.length > 0 && lore.length < 5 && GInventory[i].getItemName() != "Air") // Check for Air might not be needed here
        {
            for(var j = 0; j < lore.length; j += 1)
            {
                if(lore[j] != "efe"){loreConverted.push(lore[j]);}
            }
        }
        nbt = "";
        if(GInventory[i].getItemName() != "Air") // Air causes 100% CPU usage for several minutes when merging nbt. This stops that
        {
            nbt = GInventory[i].getNbt().toJsonString();
            if(nbt == "{\n}\n"){nbt = "";} // I have no idea what causes the output "{\n}\n" and it messes up the merge later on, so it must die
        }

        savingInv.push([currentItem, name, count, damage, loreConverted, nbt]);  
    }
    // Must convert to string to save
    var finalInv = JSON.stringify(savingInv);
    Files.write(inventoryFile.toPath(), finalInv.getBytes()); // Save :D
}

function retreiveInvFromFile(event)
{
    // Gets the contents of the file and returns a list of items (IItemStack)
    var inventoryFile = new File("saves/" + event.npc.world.getName() + "/inventories/" + Gme.getName() + ".txt");
    var fileLines = Files.readAllLines(inventoryFile.toPath(), CHARSET_UTF_8);
    // Need to be able to use what was in the file, json parse it!
    var savedInv = JSON.parse(fileLines[0]);
    var itemList = []; // This is what will be returned
    for(var i =0; i < savedInv.length; i += 1)
    {
        var item = event.npc.world.createItem(savedInv[i][0], savedInv[i][3], savedInv[i][2]); // Creates a new item
        if(savedInv[i][1] != item.getItemName()){item.setCustomName(savedInv[i][1]);} // If custom name, apply it
        if(savedInv[i][4].length > 0){item.setLore(savedInv[i][4]);} // If there's lore, apply it
        if(savedInv[i][5] != ""){item.getNbt().merge(event.API.stringToNbt(savedInv[i][5]));} // If there's NBT to apply, do it
        itemList.push(item); // Append to list
    }
        return itemList; // Returns [IItemStack, IItemStack, IItemStack,...]
}