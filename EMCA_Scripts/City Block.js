var size = 4
var locationName = "Desert City"
var faction  = "Desert City"
var discoverySound = "minecraft:ui.toast.challenge_complete"

var IPlayer = Java.type("noppes.npcs.api.entity.IPlayer");
var NpcAPI = Java.type("noppes.npcs.api.NpcAPI").Instance();
var ScriptedWaypoint = Java.type("com.scriptedjm.api.ScriptedWaypoint");

function init(event)
{
    event.block.setIsPassible(true); // Player can walk through the block
    event.block.setModel("minecraft:barrier"); // Invisible
}

function tick(event)
{
    var players = event.block.world.getNearbyEntities(event.block.getPos(), size, 1) // Player type is 1
    if(players.length)
    {
        //event.block.world.broadcast("AAH")
        for(var i = 0; i < players.length; i++)
        {
            if(!(getWaypoints(players[i], locationName).length))
            {
                if(faction)
                {
                    var factionList = event.API.getFactions().list();
                    for(var j = 0; j < factionList.length; j++)
                    {
                        //event.block.world.broadcast("Faction Name: " + factionList[j].getName());
                        //if(factionList[j].getName() == faction){var factionId = factionList[j].getId;break;}
                        if(factionList[j].getName() == faction){break;}
                    }
                    //event.block.world.broadcast("Factions: " + factionList);
                    //var player points = players[i].getFactionPoints(factionId);
                    var playerStanding = factionList[j].playerStatus(players[i]);
                    switch(playerStanding)
                    {
                        case -1:
                            // Hostile
                            var colour = [255,0,0]; // Red
                            break;
                        case 0:
                            // Neutral
                            var colour = [255,255,255]; // White
                            break;
                        case 1:
                            /// Friendly
                            var colour = [0,255,0]; // Green
                            break;
                    }
                }
                else{var colour = [255,255,255];}
                var wayPos = event.block.getPos().offset(1,1); // 1 block up
                var dimId = event.block.world.	getDimension().getId();
                newWaypoint(players[i], locationName, wayPos, dimId, colour, true, false);
                //event.API.executeCommand(event.block.world, "/tellraw @a[name=" + players[i].getDisplayName() + "
                //event.API.executeCommand(event.block.world, '/title ' + players[i].getDisplayName() + ' subtitle {"text":"You have discovered: ' + locationName + '" }');
                //event.API.executeCommand(event.block.world, '/title ' + players[i].getDisplayName() + ' title {"text":" "}');
                //event.block.world.broadcast("AAH")
                event.API.executeCommand(event.block.world, '/title ' + players[i].getDisplayName() + ' subtitle {"text":"Location discovered" }');
                event.API.executeCommand(event.block.world, '/title ' + players[i].getDisplayName() + ' title {"text":"' + locationName + '"}');
                players[i].playSound(discoverySound, 1, 1)
            }
        }
    }
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