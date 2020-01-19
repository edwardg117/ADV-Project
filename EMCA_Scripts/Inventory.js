/*
NPC Inventories V0.02 by edwardg
Special thanks to Ronan for demonstrating how to load inventories from files: https://github.com/Runonstof/CustomNPCs-Scripting-Software/blob/master/core/CustomMenuHandler.js
Main features:
- Minecraft like inventories for NPCs
- Saves between open/close of world/minecraft
- Automatically makes the folders/files and names the container the same as the NPC's name and UUID

New in this version:
- Now uses NPC's name and UUID to store inventory on file
- All globals are static now (sort of, they just don't get changed)
- Inventory size can be set in the fill range now, 1-6 rather than only 3
- init and interact functions removed, replaced with:
    - initInventory(npc, invSize, invContents)
    - showInventory(event, player)
  So now it will play nice with other scripts
- Left clicking on an item that is identical with the one that is held will now stack them

Planned:
- Have the inventory follow the NPC across names
- Function to see if an item is in the NPC's inventory, rather than returning a list of items
- Function to remove and item from an NPC
- Properly implement a way to have a default or random inventory on init, it's bare bones atm
- More error checking if I can be bothered

*/

// Need to work with files
var File = Java.type("java.io.File");
var Files = Java.type("java.nio.file.Files");
var CHARSET_UTF_8 = Java.type("java.nio.charset.StandardCharsets").UTF_8;

// super sad globals
var GnpcUUID;
var GStatic_DefaultInvSize = 3; // This is better because I've made sure nothing changes it

function initInventory(npc, invSize, invContents)
{
    // Initializes the NPC's inventory to the desired size
    // Use getInventoryContents(container) on an IContainer and see saveInventory(event) for how this should work
    invContents = invContents || null;
    var inventoriesFolder = new File("saves/" + npc.world.getName() + "/inventories");
    var inventoryFile = new File("saves/" + npc.world.getName() + "/inventories/" + npc.getName() + " " + GnpcUUID + ".txt");
    if(!inventoryFile.exists()) 
    {
        log("Inventory file does not exist. Creating...");
        inventoriesFolder.mkdirs();
        inventoryFile.createNewFile();
        var defaultFile = "";
        if(invContents)
        {
            // Initialize with a preset inventory
            defaultFile = JSON.stringify(invContents);
        }
        else
        {
            // Initialize with an empty inventory
            defaultFile = '[';
            var air = '["minecraft:air","",0,0,[],""],';
            for(var i = 1; i <= invSize; i += 1)
            {
                if(i == invSize)
                {
                    defaultFile += air + air + air + air + air + air + air + air + '["minecraft:air","",0,0,[],""]]'; // Last row, no comma on the end
                }
                else
                {
                    defaultFile += air + air + air + air + air + air + air + air + air; // Apparently you can't use String.repeat(9) . This is so sad, alexa: play calm1.ogg
                }
            }
        }
        Files.write(inventoryFile.toPath(), defaultFile.getBytes());
        log("File created and initialized");
        npc.getStoreddata().put("inventorySize", invSize);
    }
    else{log("Inventory File already exists, not initializing to prevent overwrite!")}
    npc.getStoreddata().put("hasInventory", 1);
    log("Inventory init done\nNPC UUID: " + GnpcUUID);

}

function showInventory(event, player)
{
    var npc = event.npc;
    GnpcUUID = npc.getUUID();
    if(!npc.getStoreddata().get("hasInventory"))
    {
        initInventory(npc, GStatic_DefaultInvSize);
    }
    var inventory = player.showChestGui(npc.getStoreddata().get("inventorySize"));
    inventory.setName(npc.getName());

    var itemList = retreiveItemListFromFile(event);
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

function retreiveItemListFromFile(event)
{
    // Gets the contents of the file and returns a list of items (IItemStack)
    log("Retreving inventory from file for " + event.npc.getName() + "\nUUID: " + GnpcUUID);
    var inventoryFile = new File("saves/" + event.npc.world.getName() + "/inventories/" + event.npc.getName() + " " + GnpcUUID + ".txt");
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

function customChestClosed(event)
{
    // Inventory closed, save it
    saveInventory(event); // This writes to disk
}

function customChestClicked(event)
{
    // What to do if a slot is clicked    
    if(!(event.heldItem.isEmpty() && event.slotItem.isEmpty())) // If the slot is occupied and/or the player is holding an item, swap them
    {
        var held = event.heldItem; // Can't use this to edit slot contents for whatever reason
        var slot = event.slotItem;
        if(held.compare(slot, false))
        {
            // Same item, stack them in the slot
            var air = event.player.world.createItem("minecraft:air", 0, 1);
            event.slotItem.setStackSize(slot.getStackSize() + held.getStackSize());
            event.heldItem = air.copy();
        }
        else
        {
            // Simple swap
            event.heldItem = event.slotItem.copy();
            event.slotItem = held.copy();
        }
    }
    
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

function saveInventory(event)
{
    // Converts all items to a string because you can't save an IItemStack ;(
    log("Saving Inventory to file...")
    var inventoryFile = new File("saves/" + event.player.world.getName() + "/inventories/" + event.container.getName() + " " + GnpcUUID + ".txt");
    var container = getInventoryContents(event.container);
    var savingInv = [];
    var currentItem = ""; // minecraft:tripwire_hook
    var name = ""; // Tripwire Hook
    var count = 0;
    var damage = 0;
    var lore = []; // [Spooky, Lore, Bad]
    var nbt = "";
    var loreConverted = [];

    for(var i = 0; i < container.length; i += 1)
    {
        currentItem = container[i].getName();
        name = container[i].getDisplayName();
        count = container[i].getStackSize();
        damage = 0;
        damage = container[i].getItemDamage();
        lore = [];
        // I don't know if it's needed to reset values like this. I did it while spending 5 hours trying to figure out why things where changing when they shouldn't have
        // At this point I'm scared to change it
        lore = container[i].getLore();
        loreConverted = [];
        if(lore.length > 0 && lore.length < 5 && container[i].getItemName() != "Air") // Check for Air might not be needed here
        {
            for(var j = 0; j < lore.length; j += 1)
            {
                if(lore[j] != "efe"){loreConverted.push(lore[j]);}
            }
        }
        nbt = "";
        if(container[i].getItemName() != "Air") // Air causes 100% CPU usage for several minutes when merging nbt. This stops that
        {
            nbt = container[i].getNbt().toJsonString();
            if(nbt == "{\n}\n"){nbt = "";} // I have no idea what causes the output "{\n}\n" and it messes up the merge later on, so it must die
        }

        savingInv.push([currentItem, name, count, damage, loreConverted, nbt]);  
    }
    // Must convert to string to save
    var finalInv = JSON.stringify(savingInv);
    Files.write(inventoryFile.toPath(), finalInv.getBytes()); // Save :D
    log("Inventory saved to file!")
}