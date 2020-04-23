var API = Java.type("noppes.npcs.api.NpcAPI").Instance();
var invStart = 36; // Custom container starts at 36, current row = invStart + 9(desired row[0-5])
var menuSlots = {"Buying":{"Back":37, "Refresh":38, "Next":39, "Cancel":41, "Accept":42, "Sell":44, "Up":45, "Down":63}, "Selling":{"Cancel":41, "Accept":42, "Buy":44}};

function interact(event)
{
    populateGUI(event.player.showChestGui(6), "Buying");
    event.player.getStoreddata().put("TraderMenu_TransactionType", "Buying");
}

function customChestClicked(event)
{
    // Player interacts with the menu
    var Type = event.player.getStoreddata().get("TraderMenu_TransactionType");
    if(Type == "Buying")
    {
        switch(event.slot)
        {
            case menuSlots[Type]["Sell"]:
                event.player.world.broadcast("Player wants to sell!");
                setMenuBar(event.container, "Selling");
                event.player.getStoreddata().put("TraderMenu_TransactionType", "Selling");
                var menuButtons = getMenuButtons();
                event.slotItem = menuButtons["Buy"].copy(); // The clicked slot cannot be editied with setSlot for some reason
                break;
            default:
                break;
        }
    }
    else if(Type == "Selling")
    {
        switch(event.slot)
        {
            case menuSlots[Type]["Buy"]:
                event.player.world.broadcast("Player wants to buy!");
                setMenuBar(event.container, "Buying");
                event.player.getStoreddata().put("TraderMenu_TransactionType", "Buying");
                var menuButtons = getMenuButtons();
                event.slotItem = menuButtons["Sell"].copy();
                break;
            default:
                break;
        }
    }
    //setMenuBar(event.container, event.player.getStoreddata().get("TraderMenu_TransactionType"));
}

function populateGUI(Chest, Type)
{
    Chest.setName("Trader");
    setMenuBar(Chest, Type);
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