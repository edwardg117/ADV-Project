/*
Roads for NPCs script Aplhpa 1 by edwardg
Functions for the CNPC to use so it can use roads properly

Companion script: Roads.js
Uses jsonified by ratquaza (baito), https://github.com/ratquaza/jsonified

About this script:
- Can navigate from one node to another if nodes have been mapped/pathed (any node to any node)
- Navigates to the starting node if it's not already standing on it
- Stops navigating when target node is reached
- Navigation speed can be changed from walking super slow to running at the speed of light
- Attempts to autorecover if navigation fails (because NPCs seem to stop navigating even if they haven't reached the target location)
    - Tries to start pathfinding again 3 times
    - On the 4th try the NPC is teleported to the node it can't reach



New in this version:
- New functions:
initializeRoadsNPC(event)
    - Replaces the old init function and should be called in your own init (ONCE)

getShortestPath(start, end, npc)
    - Determines if the nodes can be reached and returns the shortest path

trekTo(npc, destination, speed)
    - Starts navigation
    - This should be called to make the NPC navigate

- Now uses timer better, less calculations

Planned:
- (I'm making this up as a go along)

Put into NPC:
var navSpeed = 2 // How fast the NPC should walk range(1-5)
var home = ""
var city = ""

*/
/*
#edwardg's notes#
How to make a new IPos, thanks Ronan:
var MCBlockPos = Java.type("net.minecraft.util.math.BlockPos");
var IBlockPosWrapper = Java.type("noppes.npcs.api.wrapper.BlockPosWrapper");
var myPos = new IBlockPosWrapper(new MCBlockPos(x, y, z));

Make Spider in config\CNPCsRoads\:
var spiderClass = Java.type("org.baito.forge.jsonified.Spider")
var spider = new spiderClass()
spider.in("CNPCsRoads")

Things to remember
Timer values:
1 = Check navigation, if need to move to the next node or try to recover
*/

function initializeRoadsNPC(event)
{
    event.npc.getStoreddata().put("NavSpeed", navSpeed);
    event.npc.getStoreddata().put("isNavigating", 0);
    event.npc.getStoreddata().put("Home", home);
    event.npc.getStoreddata().put("HomeCity", city);
    event.npc.getStoreddata().put("CurrentLocation", home);
    event.npc.getStoreddata().put("NavTo", home);
    event.npc.getStoreddata().put("navPath", "");
    event.npc.getStoreddata().put("consecutiveRevoverFails", 0);
}

function getShortestPath(start, end, npc)
{
    // Returns the shortest path from start to end or null if not possible
    var spiderClass = Java.type("org.baito.forge.jsonified.Spider");
    var spider = new spiderClass();
    spider.in("CNPCsRoads");
    var shortestPath = null;

    if(spider.exists(npc.world.getName() + "_NodeRegistry.json")) // Does the Node Registry exist? Can't go anywhere without it
    {
        if(spider.exists(npc.world.getName() + "_paths.json")) // Have paths been mapped? Need those to know where to go
        {
            // Node registry exists and Paths have been made, start looking for the path
            var paths = JSON.parse(spider.get(npc.world.getName() + "_paths.json"));
            var nodeRegistry = JSON.parse(spider.get(npc.world.getName() + "_NodeRegistry.json"));
            if(start in nodeRegistry) // Check to see if starting node is in the Node Registry
            {
                if(end in nodeRegistry)// Check to see if ending node is in the Node Registry
                {
                    // Good to go, find the paths for start to end
                    var lastNode = paths[start][end][1];
                    // To reconstruct the list, it must be done in reverse
                    if(lastNode) // Final check, if this fails: there's no path from start to end
                    {
                        shortestPath = [];
                        while(lastNode)
                        {
                            shortestPath.push(lastNode);
                            lastNode = paths[start][lastNode][1];
                        }
                        shortestPath.reverse();
                        shortestPath.push(end);
                    }
                    else{log("ERR!]: " + end + " is not reachale from " + start + "!");}
                }
                else{log("[ERR!]: Ending node is not in the Node Registry, check spelling");}
            }
            else{log("[ERR!]: Starting node is not in the Node Registry, check spelling");}
        }
        else{log("[ERR!]: Couldn't find mapped paths, please map paths for me to navigate!");}
    }
    else{log("[ERR!]: Couldn't find Node Registry, please create nodes and map paths for me to navigate!");}

    return shortestPath;
}

function trekTo(npc, destination, speed)
{
    // Starts timer 1, asks for shortest path, moves npc to starting node. Basically start the whole thing
    var shortestPath = getShortestPath(npc.getStoreddata().get("CurrentLocation"), destination, npc);

    if(shortestPath)
    {
        // Shortest path came back, we have a path to follow
        var spiderClass = Java.type("org.baito.forge.jsonified.Spider");
        var spider = new spiderClass();
        spider.in("CNPCsRoads");
        var nodeRegistry = JSON.parse(spider.get(npc.world.getName() + "_NodeRegistry.json"));

        npc.getStoreddata().put("NavSpeed", speed);
        var start = nodeRegistry[npc.getStoreddata().get("CurrentLocation")];
        var end = nodeRegistry[destination];
        npc.getStoreddata().put("LastLocationRecorded", npc.getStoreddata().get("CurrentLocation"));
        npc.getStoreddata().put("navPath", JSON.stringify(shortestPath));
        npc.getStoreddata().put("NavTo", destination);
        npc.getStoreddata().put("isNavigating", 1);

        npc.clearNavigation();
        npc.navigateTo(start["Pos"][0], start["Pos"][1], start["Pos"][2], speed);
        npc.getTimers().stop(1); // Not sure why it's a problem
        npc.getTimers().start(1, 1, true);
        log("Navigation started " + start["Name"] + " to " + end["Name"])
    }
    else{log("[ERR!]: Did not get a shortest path, navigation not started!");}
}

function timer(event)
{
    if(event.id == 1)
    {
        if(!event.npc.isNavigating())
        {
            // NPC is standing still, make it move again if needed
            if(event.npc.getStoreddata().get("CurrentLocation") != event.npc.getStoreddata().get("NavTo"))
            {
                // NPC needs to move to the next node or auto-recover
                var spiderClass = Java.type("org.baito.forge.jsonified.Spider");
                var spider = new spiderClass();
                spider.in("CNPCsRoads");
                var nodeRegistry = JSON.parse(spider.get(event.npc.world.getName() + "_NodeRegistry.json"));
                var navPath = JSON.parse(event.npc.getStoreddata().get("navPath"));
                var lastNodeReached = event.npc.getStoreddata().get("LastLocationRecorded");
                var lastNodeInPath = navPath.indexOf(lastNodeReached);
                var nextNode = navPath[lastNodeInPath + 1];
                var nextNodePos = nodeRegistry[nextNode]["Pos"];
                var fails = event.npc.getStoreddata().get("consecutiveRevoverFails"); // After 3 failed attempts to reach a node, the npc probably can't get to it
                if(fails <= 3)
                {
                    //event.npc.world.broadcast("Trying to autorecover to " + JSON.stringify(nextNodePos))
                    event.npc.navigateTo(nextNodePos[0], nextNodePos[1], nextNodePos[2], event.npc.getStoreddata().get("NavSpeed"));
                    fails += 1;
                    event.npc.getStoreddata().put("consecutiveRevoverFails", fails);
                }
                else
                {
                    //event.npc.world.broadcast("Teleporting..." + nextNodePos[0] + " " + nextNodePos[1] + " " + nextNodePos[2]);
                    event.npc.setPosition(nextNodePos[0] + 0.5, nextNodePos[1], nextNodePos[2] + 0.5);
                    event.npc.getStoreddata().put("consecutiveRevoverFails", 0);
                }
            }
            else
            {
                // Navigation finished
                event.npc.getStoreddata().put("isNavigating", 0);
                event.npc.getStoreddata().put("navPath", "");
                event.npc.getStoreddata().put("isNavigating", 0);
                event.npc.getTimers().stop(1);
                log("Navigation Complete");
            }
        }
        else
        {
            event.npc.getStoreddata().put("consecutiveRevoverFails", 0);
        }
    }
}