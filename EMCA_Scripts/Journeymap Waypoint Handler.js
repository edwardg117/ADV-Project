/*
Journeymap Waypoint Handler/Manager V0.03 by edwardg
Uses ScriptedJourneyMap v1.0.1 beta by slava_110 https://cdn.discordapp.com/attachments/177204059109982208/601412316583690251/ScriptedJourneyMap-1.0.1-beta.jar
Written for Journeymap version 1.12.2-5.7.1
Journeymap API Version: v1.12-1.4
Huge thanks to Runon and slava_110 for their help and suggestions.

About:
Allows for the creation, modification and deletion of waypoints in Journeymap.
All waypoints created by this script are stored in the "Waypoints" storedata and tempdata and NOT TO DISK.
YOU CANNOT MODIFY OR DELETE ANY WAYPOINTS SAVED TO DISK OR CREATED BY PLAYER.
A Waypoint's Id in the WaypointRegistry is NOT the same as Waypoint.getId() after updating the waypoint, 
ALWAYS USE getWaypoints() to get a waypoint

Usage:
newWaypoint(IPlayer Player, String Name, IPos Pos, Int Dim, Int[] Colour, Bool ShowPlayer, Bool Editable):
    Creates and registers a new waypoint
    Returns the new Waypoint's Id

setVisible(IPlayer Player, String Id, bool Visible):
    Makes the waypoint visible to the player or hidden from the player
    Returns the Waypoint Id supplied

getWaypoints(IPlayer Player, String Name):
    Returns a list of Waypoint Ids with matching Name

updateWaypoint(IPlayer Player, String Id, {"Attribute":NewValue}):
    Updates the waypoint
    Returns true if success and false on failure

reloadWaypoints(IPlayer Player):
    Reloads waypoints from Storeddata and reverts un-saved changes

deleteWaypoint(IPlayer Player, String Id):
    Deletes a Waypoint and removes it from the world if loaded
    Returns true if success and false on failure
*/

var IPlayer = Java.type("noppes.npcs.api.entity.IPlayer");
var NpcAPI = Java.type("noppes.npcs.api.NpcAPI").Instance();
var ScriptedWaypoint = Java.type("com.scriptedjm.api.ScriptedWaypoint");

function init(event)
{
    var player = event.player;
    if(player.getTempdata().get("Waypoints"))
    {
        // Waypoints already loaded, do nothing
        player.message("Waypoints already loaded, doing nothing")
    }
    else
    {
        // Are there Waypoints load?
        if(player.getStoreddata().get("Waypoints"))
        {
            // There's Waypoints to load
            player.message("There's Waypoints to load")
            player.getTimers().start(500, 40, 0); // timer id 500, 40 ticks, no repeat picked 500 because it's big and I don't think anyone has 500 timers and 2 seconds to make sure it's after loading finishes
        }
        else
        {
            player.message("There's no Waypoint data at all")
            player.getStoreddata().put("Waypoints", "{}"); // Ensure it looks nice for when some are added
            player.getTempdata().put("Waypoints", {});
        }
    }
}

function timer(event)
{
    switch(event.id)
    {
        case 500:
            var player = event.player;
            var savedWaypointRegistry = JSON.parse(player.getStoreddata().get("Waypoints"));
            var waypointRegistry = {};
            for(var i = 0; i < Object.keys(savedWaypointRegistry).length; i++)
            {
                var existingPoint = ScriptedWaypoint.fromJSON(savedWaypointRegistry[Object.keys(savedWaypointRegistry)[i]]["WaypointJSON"]);
                if(!(savedWaypointRegistry[Object.keys(savedWaypointRegistry)[i]]["isHidden"])){existingPoint.show(player);}
                waypointRegistry[Object.keys(savedWaypointRegistry)[i]] = existingPoint;
            }
            player.getTempdata().put("Waypoints", waypointRegistry);
            break;
    }
}

/** Creates and registers a new waypoint, returns the new Waypoint's Id
 * @param {IPlayer} Player "The player this waypoint is being added to, must be noppes.npcs.api.IPlayer"
 * @param {string} Name "Display name of waypoint, Default: 'Un-named Waypoint'"
 * @param {IPos} Pos "Postion of the waypoint, must be noppes.npcs.api.IPos, Default: Player postion"
 * @param {number} Dim "Dimension of the waypoint, Default: Same as Player"
 * @param {Int8Array} Colour "Colour of the waypoint, Default: Random"
 * @param {boolean} ShowPlayer "Should the waypoint be shown to the player, Default: false"
 * @param {boolean} Editable "Is player editable, Default: true"
 */
function newWaypoint(Player, Name, Pos, Dim, Colour, ShowPlayer, Editable)
{
    Name = Name || "Un-named Waypoint";
    Pos = Pos || Player.getPos();
    Dim = Dim || Player.world.getDimension().getId();
    Colour = Colour || [randInt(0, 255),randInt(0, 255),randInt(0, 255)];
    ShowPlayer = ShowPlayer || false;
    Editable = Editable || true;
    var newWaypoint = new ScriptedWaypoint(Pos, Dim)
    .setName(Name)
    .setColor(Colour[0], Colour[1], Colour[2])
    .setEditable(Editable);
    // Add new waypoint to registry
    var savedWaypointRegistry = JSON.parse(Player.getStoreddata().get("Waypoints"));
    savedWaypointRegistry[newWaypoint.getId()] = {"WaypointJSON": newWaypoint.toJSON(), "isHidden":!ShowPlayer, "ActualPos":[Pos.getX(), Pos.getY(), Pos.getZ()], "ActualName":Name};
    var waypointRegistry = Player.getTempdata().get("Waypoints");
    waypointRegistry[newWaypoint.getId()] = newWaypoint;
    Player.getStoreddata().put("Waypoints", JSON.stringify(savedWaypointRegistry));

    if(ShowPlayer){Player.getTempdata().put("Waypoints", waypointRegistry);newWaypoint.show(Player);}
    return newWaypoint.getId();
}

/** Makes the waypoint visible to the player or hidden from the player
 * Returns the updated point or null if error
 * @param {IPlayer} Player "IPlayer to show to/hide from"
 * @param {String} Id "The Waypoint Id"
 * @param {boolean} Visible "true: show to player, false: hide from player"
 */
function setVisible(Player, Id, Visible)
{
    var savedWaypointRegistry = JSON.parse(Player.getStoreddata().get("Waypoints"));
    var waypointRegistry = Player.getTempdata().get("Waypoints");
    
    if(savedWaypointRegistry[Id]["isHidden"] != Visible && typeof(Visible) == typeof(true))
    {
        // No change needed
        if(Visible){log("[WARN] JMWaypointHandler.setVisible(): " + savedWaypointRegistry[Id]["ActualName"] + " is already Visible!\nMaking no changes to Waypoint.");}
        else{log("[WARN] JMWaypointHandler.setVisible(): " + savedWaypointRegistry[Id]["ActualName"] + " is already Hidden!\nMaking no changes to Waypoint");}
    }
    else
    {
        // Updating Waypoint
        if(Visible && typeof(Visible) == typeof(true))
        {
            // Set Waypoint to visible
            log("[INFO] JMWaypointHandler.setVisible(): Setting Waypoint " + savedWaypointRegistry[Id]["ActualName"] + " to Visible!");
            var Waypoint = ScriptedWaypoint.fromJSON(savedWaypointRegistry[Id]["WaypointJSON"]);
            Waypoint.show(Player);

            // Update registry
            savedWaypointRegistry[Id]["isHidden"] = false;
            savedWaypointRegistry[Id]["WaypointJSON"] = Waypoint.toJSON();
            waypointRegistry[Id] = Waypoint;
            // Write
            Player.getStoreddata().put("Waypoints", JSON.stringify(savedWaypointRegistry));
            Player.getTempdata().put("Waypoints", waypointRegistry);
        }
        else if(Visible == false && typeof(Visible) == typeof(false))
        {
            // Set Waypoint to hidden
            log("[INFO] JMWaypointHandler.setVisible(): Setting Waypoint " + savedWaypointRegistry[Id]["ActualName"] + " to Hidden!");
            //Waypoint.remove(Player);
            var Waypoint = waypointRegistry[Id];
            // Update registry
            savedWaypointRegistry[Id]["isHidden"] = true;
            savedWaypointRegistry[Id]["WaypointJSON"] = Waypoint.toJSON();
            delete waypointRegistry[Id]; // Remove the key
            // Write
            Player.getStoreddata().put("Waypoints", JSON.stringify(savedWaypointRegistry));
            Player.getTempdata().put("Waypoints", waypointRegistry);
            Waypoint.remove(Player);
        }
        else
        {
            log("[ERR] JMWaypointHandler.setVisible(): Visible parameter was not a Boolean, was: " + typeof(Visible) + ", value was: " + Visible);
            return null;
        }
    }
    return Id;
}

/** Returns a list of Waypoint Ids with matching Name 
 * @param {IPlayer} Player "The IPlayer to search on"
 * @param {String} Name "Name to try and find"
*/
function getWaypoints(Player, Name)
{
    var savedWaypointRegistry = JSON.parse(Player.getStoreddata().get("Waypoints"));
    var waypoints = Object.keys(savedWaypointRegistry);
    var foundWaypoints = [];

    for(var Id = 0; Id < waypoints.length; Id++)
    {
        //Player.message("checking: " + savedWaypointRegistry[waypoints[Id]]["ActualName"])
        if(savedWaypointRegistry[waypoints[Id]]["ActualName"] == Name)
        {
            foundWaypoints.push(waypoints[Id]);
        }
    }
    return foundWaypoints;
}

/** Updates the Waypoint, returns true if success and false on failure. Use setVisible(Player, Id, Visible) to change Waypoint visibility.
 * @example {"Name":"New Name", "Pos":[234,66,-125], "Dim":0, "Colour":[255,255,255], "Editable":true}
 * @param {IPlayer} Player "IPlayer to update Waypoint for"
 * @param {String} Id "Id of the waypoint to update"
 * @param {Object} NewValues "A dictionary of values to update"
 */
function updateWaypoint(Player, Id, NewValues)
{
    var wasUpdated = false;
    if(Player instanceof IPlayer)
    {
        if(typeof(Id) == typeof("String"))
        {
            if(typeof(NewValues) == typeof({"Key":"Value"}))
            {
                // Values are the right types, proceed
                var savedWaypointRegistry = JSON.parse(Player.getStoreddata().get("Waypoints"));
                var waypointRegistry = Player.getTempdata().get("Waypoints");

                // Does Waypoint exist?
                if(Object.keys(savedWaypointRegistry).indexOf(Id) >= 0)
                {
                    var waypointInfo = savedWaypointRegistry[Id];
                    var tempPoint = ScriptedWaypoint.fromJSON(waypointInfo["WaypointJSON"]);

                    var toUpdate = Object.keys(NewValues);
                    if(toUpdate.indexOf("Name") >= 0){var Name = NewValues["Name"];log("[INFO] JMWaypointHandler.updateWaypoint(): Updating Name for: " + Id);}else{var Name = tempPoint.getName();log("[INFO] JMWaypointHandler.updateWaypoint(): No Name change for: " + Id);}
                    if(toUpdate.indexOf("Pos") >= 0){var Pos = NpcAPI.getIPos(NewValues["Pos"][0], NewValues["Pos"][1], NewValues["Pos"][2]);log("[INFO] JMWaypointHandler.updateWaypoint(): Updating Pos for: " + Id);}else{var Pos = tempPoint.getPos();log("[INFO] JMWaypointHandler.updateWaypoint(): No Pos change for: " + Id);}
                    if(toUpdate.indexOf("Dim") >= 0){var Dim = NewValues["Dim"];log("[INFO] JMWaypointHandler.updateWaypoint(): Updating Dim for: " + Id);}else{var Dim = tempPoint.getDimension();log("[INFO] JMWaypointHandler.updateWaypoint(): No Dim change for: " + Id);}
                    if(toUpdate.indexOf("Colour") >= 0){var Colour = NewValues["Colour"];log("[INFO] JMWaypointHandler.updateWaypoint(): Updating Colour for: " + Id);}else{var Colour = tempPoint.getColors();log("[INFO] JMWaypointHandler.updateWaypoint(): No Colour change for: " + Id);}
                    if(toUpdate.indexOf("Editable") >= 0){var Editable = NewValues["Editable"];log("[INFO] JMWaypointHandler.updateWaypoint(): Updating Editable for: " + Id);}else{var Editable = tempPoint.isEditable();log("[INFO] JMWaypointHandler.updateWaypoint(): No Editable change for: " + Id);}
                    var updatedWaypoint = new ScriptedWaypoint(Pos, Dim)
                    .setName(Name)
                    .setColor(Colour[0], Colour[1], Colour[2])
                    .setEditable(Editable);

                    // Save updated Waypoint
                    savedWaypointRegistry[Id]["WaypointJSON"] = updatedWaypoint.toJSON();
                    Player.getStoreddata().put("Waypoints", JSON.stringify(savedWaypointRegistry));

                    if(!waypointInfo["isHidden"])
                    {
                        // Waypoint is Visible update player
                        var oldWaypoint = waypointRegistry[Id];
                        oldWaypoint.remove(Player);
                        waypointRegistry[Id] = updatedWaypoint;
                        updatedWaypoint.show(Player);
                        Player.getTempdata().put("Waypoints", waypointRegistry);
                    }

                    wasUpdated = true;
                }
                else{log("[ERR] JMWaypointHandler.updateWaypoint(): Could not find a Waypoint with Id: " + Id);}
            }
            else{log("[ERR] JMWaypointHandler.updateWaypoint(): Passed NewValues was not a Dictionary of new values! i.e {'Colour':[255,255,0], 'Name':'New Name'}");}
        }
        else{log("[ERR] JMWaypointHandler.updateWaypoint(): Passed Id was not a String! Was: " + typeof(Id));}
    }
    else{log("[ERR] JMWaypointHandler.updateWaypoint(): Passed Player was not an IPlayer! Was: " + typeof(Player));}
    return wasUpdated;
}

/** Reloads waypoints from Storeddata and reverts un-saved changes
 * @param {IPlayer} Player "IPlayer to reload waypoints for"
 */
function reloadWaypoints(Player)
{
    var savedWaypointRegistry = JSON.parse(Player.getStoreddata().get("Waypoints"));
    var waypointRegistry = {};
    // Remove all currently loaded Waypoints
    var oldWaypointRegistry = Player.getTempdata().get("Waypoints");
    for(var i = 0; i < Object.keys(oldWaypointRegistry).length; i++)
    {
        oldWaypointRegistry[Object.keys(oldWaypointRegistry)[i]].remove(Player);
    }
    // Add Waypoints from Storeddata
    for(var i = 0; i < Object.keys(savedWaypointRegistry).length; i++)
    {
        var existingPoint = ScriptedWaypoint.fromJSON(savedWaypointRegistry[Object.keys(savedWaypointRegistry)[i]]["WaypointJSON"]);
        if(!(savedWaypointRegistry[Object.keys(savedWaypointRegistry)[i]]["isHidden"])){existingPoint.show(Player);}
        waypointRegistry[Object.keys(savedWaypointRegistry)[i]] = existingPoint;
    }
    Player.getTempdata().put("Waypoints", waypointRegistry);
}

/** Deletes a Waypoint and removes it from the world if loaded
 * @param {IPlayer} Player "IPlayer to delete Waypoint from"
 * @param {String} Id "Id for the Waypoint to remove"
 */
function deleteWaypoint(Player, Id)
{
    var wasDeleted = false;
    if(Player instanceof IPlayer)
    {
        if(typeof(Id) == typeof("String"))
        {
            // Types look okay, can proceed to delete
            var savedWaypointRegistry = JSON.parse(Player.getStoreddata().get("Waypoints"));
            if(Object.keys(savedWaypointRegistry).indexOf(Id) >= 0)
            {
                log("[INFO] JMWaypointHandler.deleteWaypoint(): Deleting Waypoint: " + Id);
                if(!savedWaypointRegistry[Id]["isHidden"])
                {
                    // Waypoint is visible, must remove that too
                    var waypointRegistry = Player.getTempdata().get("Waypoints");
                    var Waypoint = waypointRegistry[Id];
                    Waypoint.remove(Player);
                    delete waypointRegistry[Id]; // Removed from the loaded list
                    // Save
                    Player.getTempdata().put("Waypoints", waypointRegistry);
                }
                delete savedWaypointRegistry[Id]; // Removed from saved list
                // Save
                Player.getStoreddata().put("Waypoints", JSON.stringify(savedWaypointRegistry));
                wasDeleted = true;
            }
            else{log("[ERR] JMWaypointHandler.deleteWaypoint(): Could not find a Waypoint with Id: " + Id);}
        }
        else{log("[ERR] JMWaypointHandler.deleteWaypoint(): Passed Id was not a String! Was: " + typeof(Id));}
    }
    else{log("[ERR] JMWaypointHandler.deleteWaypoint(): Passed Player was not an IPlayer! Was: " + typeof(Player));}
    return wasDeleted;
}

/** Returns a random number */
function randInt(min, max) 
{
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

// ## Example Usage, uncomment to use. If a case has a */ it's regular expression, do not delete it (also why commenting is weird here)
/*
function chat(event)
{
    var player = event.player;
    switch(true) 
    {*/
        //case /-newWaypoint */.test(event.message):
            /*newWaypoint(player, event.message.slice(13), event.player.getPos(), event.player.world.getDimension().getId(), [255, 255, 255], true);
            break;*/
        //case /-randomColour */.test(event.message):
            // Changes the colour of the desired waypoint to a random colour
            /*var savedWaypointRegistry = JSON.parse(player.getStoreddata().get("Waypoints"));
            var foundList = getWaypoints(player, event.message.slice(14));
            if(foundList.length)
            {
                for(var i = 0; i < foundList.length; i++)
                {
                    var randomColour = {"Colour": [randInt(0,255), randInt(0,255), randInt(0,255)]}
                    updateWaypoint(player, foundList[i], randomColour);
                }
            }
            else
            {
                player.message("Couldn't find a waypoint by the name: '" + event.message.slice(14) + "'")
            }
           
           break;*/
        //case /-hideWaypoint */.test(event.message):
            /*var foundList = getWaypoints(player, event.message.slice(14));
            var savedWaypointRegistry = JSON.parse(player.getStoreddata().get("Waypoints"));
            if(foundList.length)
            {
                for(var i = 0; i < foundList.length; i++)
                {
                    setVisible(player, foundList[i], false);
                    player.message("Set '" + savedWaypointRegistry[foundList[i]]["ActualName"] + "' to hidden.");
                }
            }
            else
            {
                player.message("Couldn't find a waypoint by the name: '" + event.message.slice(14) + "'")
            }
            break;*/
        //case /-showWaypoint */.test(event.message):
            /*var foundList = getWaypoints(player, event.message.slice(14));
            var savedWaypointRegistry = JSON.parse(player.getStoreddata().get("Waypoints"));
            if(foundList.length)
            {
                for(var i = 0; i < foundList.length; i++)
                {
                    setVisible(player, foundList[i], true);
                    player.message("Set '" + savedWaypointRegistry[foundList[i]]["ActualName"] + "' to visible.");
                }
            }
            else
            {
                player.message("Couldn't find a waypoint by the name: '" + event.message.slice(14) + "'")
            }
            break;
        case /-reloadWaypoints/.test(event.message):
            reloadWaypoints(player);
            break;*/
        //case /-find */.test(event.message):
            /*player.message("Trying to find: '" + event.message.slice(6) + "'");
            var foundList = getWaypoints(player, event.message.slice(6));
            player.message("Found: " + JSON.stringify(foundList));
            break;
        case /-numWaypoints/.test(event.message):
            player.message("Number of Saved Waypoints:  " + Object.keys(JSON.parse(player.getStoreddata().get("Waypoints"))).length);
            player.message("Number of Loaded Waypoints: " + Object.keys(player.getTempdata().get("Waypoints")).length);
            break;*/
        //case /-deleteWaypoint */.test(event.message):
            /*var foundList = getWaypoints(player, event.message.slice(16));    
            if(foundList.length)
            {
                for(var i = 0; i < foundList.length; i++)
                {
                    deleteWaypoint(player, foundList[i]);
                    player.message("Deleted '" + event.message.slice(16) + "'");
                }
            }
            else
            {
                player.message("Couldn't find a waypoint by the name: '" + event.message.slice(16) + "'")
            }
    }
}*/