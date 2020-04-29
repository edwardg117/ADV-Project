/*
Trader V0.02 by edwardg

Things I need to do:
generate a json file with all item ids and assign a value
determine a formula for determinine damaged item value, factors:
    - Barter skill
    - Item damage
    - Buying price higher than Selling
    - A modifier for perks or other factors
    - Player's standing with the faction


Planned features:
- Items in the Trader's trade inv are loaded into the menu (aplhabetically if possible)
- When clicked on, the item it transfers to the bottom
- Accept allows the items to be transfered to the players inv
- If the menu is closed before accepting nothing happens, if accepted the items should drop on the floor
- Pages separated into: All, Weapons, Clothing, Food (consumables), Magic, Misc
- Trader specialties? (i.e. a bartender having higher prices for drinks)
*/
var API = Java.type("noppes.npcs.api.NpcAPI").Instance();
var invStart = 36; // Custom container starts at 36, current row = invStart + 9(desired row[0-5])
var menuSlots = {"Buying":{"Back":37, "Refresh":38, "Next":39, "Cancel":41, "Accept":42, "Sell":44, "Up":45, "Down":63}, "Selling":{"Cancel":41, "Accept":42, "Buy":44}};

function interact(event)
{
    populateGUI(event.player.showChestGui(6), "Buying", event.player);
    event.player.getStoreddata().put("TraderMenu_TransactionType", "Buying");
    event.player.getTempdata().put("CurrentTransaction", {"CurrentPage":"All", "VScroll":0, "HScroll":0, "SellMenu":[]})
}

function customChestClicked(event)
{
    // Player interacts with the menu
    var Type = event.player.getStoreddata().get("TraderMenu_TransactionType");
    if(Type === "Buying")
    {
        switch(event.slot)
        {
            case menuSlots[Type]["Sell"]:
                // Player wants to swap to sell menu
                //event.player.message("Sell");
                //setMenuBar(event.container, "Selling");
                populateGUI(event.container, "Selling", event.player)
                event.player.getStoreddata().put("TraderMenu_TransactionType", "Selling");
                var menuButtons = getMenuButtons();
                event.slotItem = menuButtons["Buy"].copy(); // The clicked slot cannot be editied with setSlot for some reason
                break;
            case menuSlots[Type]["Cancel"]:
                // Player wants to cancel the transaction
                event.player.message("Cancel");
                cancelTransaction(event.container, event.player);
                break;
            case menuSlots[Type]["Accept"]:
                // Player wants to proceed with the transaction
                event.player.message("Accept");
                acceptTransaction();
                break;
            case menuSlots[Type]["Next"]:
                // Player wants to proceed to the next page of item groups, eg: All, Weapons, Clothing, Food (consumables), Magic, Misc
                // Page right
                event.player.message("Next");
                break;
            case menuSlots[Type]["Back"]:
                // Player wants to go the the previous item grouping
                // Page left
                event.player.message("Back");
                break;
            case menuSlots[Type]["Up"]:
                // Player wants to scroll up the item list
                // Vertical scroll -1
                event.player.message("Up");
                break;
            case menuSlots[Type]["Down"]:
                // Player wants to scroll down the item list
                // Vertical scroll +1
                event.player.message("Down");
                break;
            case -1: // No menu item yet
                // Player wants to scroll to the next page in the items they want to purchase
                // Forward button on the bottom of the screen
                break;
            case -2:
                // Player wants to scroll to the previous page of items they wan to purchase
                // Back button on the bottom of the screen
                break;
            default:
                break;
        }
    }
    else if(Type === "Selling")
    {
        switch(event.slot)
        {
            case menuSlots[Type]["Buy"]:
                // Player wants to swap to buy menu
                //setMenuBar(event.container, "Buying");
                // Save items placed in menu
                saveSellMenuItems(event.container, event.player);
                populateGUI(event.container, "Buying", event.player);
                event.player.getStoreddata().put("TraderMenu_TransactionType", "Buying");
                var menuButtons = getMenuButtons();
                event.slotItem = menuButtons["Sell"].copy();
                break;
            case menuSlots[Type]["Cancel"]:
                cancelTransaction(event.container, event.player);
                break;
            case menuSlots[Type]["Accept"]:
                acceptTransaction();
                break;
            default:
                if([36,37,38,39,40,41,42,43,44].indexOf(event.slot) == -1)
                {
                    // Player has clicked a slot that isn't in the menu bar
                    if(!(event.heldItem.isEmpty() && event.slotItem.isEmpty())) // If the slot is occupied and/or the player is holding an item, swap them
                    {
                        var held = event.heldItem; // Can't use this to edit slot contents for whatever reason
                        var slot = event.slotItem;
                        if(held.compare(slot, false))
                        {
                            // Same item, can it be stacked?
                            if(event.slotItem.getMaxStackSize() == event.slotItem.getStackSize())
                            {
                                // Do nothing
                            }
                            else
                            {
                                // Is the player trying to stack them within the max size?
                                if(event.slotItem.getMaxStackSize() >= (event.slotItem.getStackSize() + event.heldItem.getStackSize()))
                                {
                                    //stack them in the slot
                                    var air = event.player.world.createItem("minecraft:air", 0, 1);
                                    event.slotItem.setStackSize(slot.getStackSize() + held.getStackSize());
                                    event.heldItem = air.copy();
                                }
                                else
                                {
                                    // Player is holding more than can be stacked, fill to stack size
                                    var numInSlot = event.slotItem.getStackSize();
                                    var maxStackSize = event.slotItem.getMaxStackSize();
                                    var remainder = maxStackSize - numInSlot;

                                    event.slotItem.setStackSize(maxStackSize);
                                    event.heldItem.setStackSize(remainder);
                                }
                            }
                        }
                        else
                        {
                            // Simple swap
                            event.heldItem = event.slotItem.copy();
                            event.slotItem = held.copy();
                        }
                    }
                }
                else{event.player.message("Invalid Slot")}
                break;
        }
    }
    //setMenuBar(event.container, event.player.getStoreddata().get("TraderMenu_TransactionType"));
}

function customChestClosed(event)
{
    cancelTransaction(event.container, event.player);
}

function populateGUI(Chest, Type, Player)
{
    Chest.setName("Trader");
    setMenuBar(Chest, Type);
    populateItems(Chest, Type, Player);
}

function clearGUI(Chest)
{
    for(var i = 36; i <= 89; i++)
    {
        Chest.setSlot(i, API.getIWorld(0).createItem("minecraft:air", 0, 1));
    }
}

function setMenuBar(Chest, Type)
{
    clearGUI(Chest);
    var menuButtons = getMenuButtons();
    if(Type == "Buying")
    {
        // Name
        Chest.setName("Buy menu");

        // Top bar
        Chest.setSlot(invStart, menuButtons["Blank"]);
        Chest.setSlot(invStart + 1, menuButtons["Back"]);
        Chest.setSlot(invStart + 2, menuButtons["Refresh"]);
        Chest.setSlot(invStart + 3, menuButtons["Next"]);
        Chest.setSlot(invStart + 4, menuButtons["Blank"]);
        Chest.setSlot(invStart + 5, menuButtons["Cancel"]);
        Chest.setSlot(invStart + 6, menuButtons["Accept"]);
        Chest.setSlot(invStart + 7, menuButtons["Profit"]);
        Chest.setSlot(invStart + 8, menuButtons["Sell"]);

        // Sidebar
        Chest.setSlot(invStart + 9*1, menuButtons["Up"]);
        Chest.setSlot(invStart + 9*2, menuButtons["Blank"]);
        Chest.setSlot(invStart + 9*3, menuButtons["Down"]);
        Chest.setSlot(invStart + 9*4, menuButtons["Blank"]);

        // Separator
        Chest.setSlot(invStart + 9*4 + 1, menuButtons["Blank"]);
        Chest.setSlot(invStart + 9*4 + 2, menuButtons["Blank"]);
        Chest.setSlot(invStart + 9*4 + 3, menuButtons["Blank"]);
        Chest.setSlot(invStart + 9*4 + 4, menuButtons["Blank"]);
        Chest.setSlot(invStart + 9*4 + 5, menuButtons["Blank"]);
        Chest.setSlot(invStart + 9*4 + 6, menuButtons["Blank"]);
        Chest.setSlot(invStart + 9*4 + 7, menuButtons["Blank"]);
        Chest.setSlot(invStart + 9*4 + 8, menuButtons["Blank"]);
    }
    else if(Type == "Selling")
    {
        // Name
        Chest.setName("Sell menu");
        Chest.setSlot(invStart, menuButtons["Blank"]);
        Chest.setSlot(invStart + 1, menuButtons["Blank"]);
        Chest.setSlot(invStart + 2, menuButtons["Blank"]);
        Chest.setSlot(invStart + 3, menuButtons["Blank"]);
        Chest.setSlot(invStart + 4, menuButtons["Blank"]);
        Chest.setSlot(invStart + 5, menuButtons["Cancel"]);
        Chest.setSlot(invStart + 6, menuButtons["Accept"]);
        Chest.setSlot(invStart + 7, menuButtons["Loss"]);
        Chest.setSlot(invStart + 8, menuButtons["Buy"]);
    }
}

function applyMenuItemNBT(Item, Name)
{
    Name = Name || "§r";
    Item.nbt.setInteger("HideFlags", 63);
    Item.nbt.setInteger("Unbreakable", 1);
    Item.nbt.setIntegerArray("AttributeModifiers", []);
    Item.setCustomName(Name);
    return Item;
}

function getMenuButtons()
{
    var menuItem = applyMenuItemNBT(API.getIWorld(0).createItem("minecraft:diamond_hoe", 1, 1));
    var itemList = {};
    itemList["Blank"] = menuItem.copy();
    menuItem.setCustomName("§rPrevious Page");menuItem.setItemDamage(2);
    itemList["Back"] = menuItem.copy();
    menuItem.setCustomName("§rBuy Items");menuItem.setItemDamage(3);
    itemList["Buy"] = menuItem.copy()
    menuItem.setCustomName("§rCancel Trade");menuItem.setItemDamage(4);
    itemList["Cancel"] = menuItem.copy();
    menuItem.setCustomName("§rOffer Rejected");menuItem.setItemDamage(5);
    itemList["Accept Grey"] = menuItem.copy();
    menuItem.setCustomName("§rAccept Trade");menuItem.setItemDamage(6);
    itemList["Accept"] = menuItem.copy();
    menuItem.setCustomName("§rDown");menuItem.setItemDamage(7);
    itemList["Down"] = menuItem.copy();
    menuItem.setCustomName("§r[ERROR Currency not calculated]");menuItem.setItemDamage(8);
    itemList["Loss"] = menuItem.copy();
    menuItem.setCustomName("§rNext Page");menuItem.setItemDamage(9);
    itemList["Next"] = menuItem.copy();
    menuItem.setCustomName("§r[ERROR Currency not calculated]");menuItem.setItemDamage(10);
    itemList["Profit"] = menuItem.copy();
    menuItem.setCustomName("§rRefresh");menuItem.setItemDamage(11);
    itemList["Refresh"] = menuItem.copy();
    menuItem.setCustomName("§rSell Items");menuItem.setItemDamage(12);
    itemList["Sell"] = menuItem.copy();
    menuItem.setCustomName("§rUp");menuItem.setItemDamage(13);
    itemList["Up"] = menuItem.copy();

    return itemList;
}

function populateItems(Chest, Type, Player)
{
    if(Type === "Buying")
    {
        // TODO code for finding and populating the correct items here
    }
    else if(Type === "Selling")
    {
        // The player can swap at any time, so see if they have already put items in it
        var transaction = Player.getTempdata().get("CurrentTransaction");
        var items = transaction["SellMenu"];
        if(items != null && items.length > 0)
        {
            // They have, place them
            for(var i = invStart + 9; i < items.length; i++)
            {
                Chest.setSlot(i, items[i]);
            }
        }
        else
        {
            // No data, create some in case something is wrong
            saveSellMenuItems(Chest, Player);
        }
    }
}

function saveSellMenuItems(Chest, Player)
{
    var transaction = Player.getTempdata().get("CurrentTransaction");
    var items = Chest.getItems();
    transaction["SellMenu"] = items;
    Player.getTempdata().put("CurrentTransaction", transaction);
}

function acceptTransaction()
{

}

function cancelTransaction(Chest, Player)
{
    var Type = Player.getStoreddata().get("TraderMenu_TransactionType");
    if(Type === "Selling")
    {
        // Player was in the middle of selling items, they need to be given back
        saveSellMenuItems(Chest, Player);
    }
    // Give player back items in sell menu
    var sellingItems = Player.getTempdata().get("CurrentTransaction")["SellMenu"];
    if(sellingItems != null && sellingItems.length > 0)
    {
        var firstItem = true;
        for(var i = invStart + 9; i < sellingItems.length; i++)
        {
            if(sellingItems[i].getItemName() != "Air")
            {
                //Player.message("Giving slot: " + i);
                //Player.message(sellingItems[i].getItemName());
                //Player.message("Ammount: " + sellingItems[i].getStackSize());
                //var result = Player.giveItem(sellingItems[i]);
                Player.giveItem(sellingItems[i]);
                //Player.message("Result: " + result);
                if(firstItem)
                {
                    firstItem = false;
                    Player.removeItem(sellingItems[i], sellingItems[i].getStackSize());
                    Player.giveItem(sellingItems[i]);
                }
            }
        }
        Player.updatePlayerInventory();
    }
    // Empty Sell menu
    var transaction = Player.getTempdata().get("CurrentTransaction");
    transaction["SellMenu"] = [];
    Player.getTempdata().put("CurrentTransaction", transaction);
    // TODO work out buying stuff

    populateGUI(Chest, Type, Player);
}