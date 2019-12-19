/*
Roads for NPCs script Aplhpa 1 by edwardg
Functions for the CNPC to use so it can use roads properly

Companion script: Roads.js
Uses jsonified by ratquaza (baito), https://github.com/ratquaza/jsonified

In this version:
- 


Planned:
- 


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
*/

function init(event)
{
    event.npc.getStoreddata().put("NavSpeed", navSpeed)
    event.npc.getStoreddata().put("isNavigating", 0)
    event.npc.getStoreddata().put("Home", home)
    event.npc.getStoreddata().put("HomeCity", city)
    event.npc.getStoreddata().put("CurrentLocation", home)
    event.npc.getStoreddata().put("NavTo", home)
    event.npc.getStoreddata().put("navPath", "")

}

function prepNav(npc, start, end, speed)
{
    // Moves NPC to starting node and returns the shortest path
    var spiderClass = Java.type("org.baito.forge.jsonified.Spider")
    var spider = new spiderClass()
    spider.in("CNPCsRoads")
    var shortestPath = ""

    if(spider.exists(npc.world.getName() + "_NodeRegistry.json")) // Does the Node Registry exist? Can't go anywhere without it
    {
        if(spider.exists(npc.world.getName() + "_paths.json"))
        {
            var nodeRegistry = JSON.parse(spider.get(npc.world.getName() + "_NodeRegistry.json"))
            var paths = JSON.parse(spider.get(npc.world.getName() + "_paths.json"))
            // Check to see if the node has already been created under that name
            if(start in nodeRegistry)
            {
                if(end in nodeRegistry)
                {
                    var nav = nodeRegistry[start]["Pos"]
                    npc.navigateTo(nav[0], nav[1], nav[2], speed)
                    // Reconstruct Path
                    var lastNode = paths[start][end][1]
                    if(lastNode)
                    {
                        shortestPath = []
                        while(lastNode)
                        {
                            //npc.world.broadcast("lastNode: " + JSON.stringify(lastNode))
                            //npc.world.broadcast("shortestPath: " + JSON.stringify(shortestPath))
                            shortestPath.push(lastNode)
                            //npc.world.broadcast("shortestPath: " + JSON.stringify(shortestPath))
                            lastNode = paths[start][lastNode][1]
                        }
                        shortestPath.reverse()
                        shortestPath.push(end)
                    }
                    else
                    {
                        // Cannot reach destination
                        npc.world.broadcast("[ERR!] " + npc.getDisplay().getName() + ": " + end + " Cannot be reached from " + start)
                    }

                }
                else
                {
                    npc.world.broadcast("[ERR!] " + npc.getDisplay().getName() + ": " + end + " is not in Node Registry!")
                }
                

            }
            else
            {
                npc.world.broadcast("[ERR!] " + npc.getDisplay().getName() + ": " + start + " is not in Node Registry!")
                
            }
        }
        else
        {
            npc.world.broadcast("[ERR!] " + npc.getDisplay().getName() + ": " + "Couldn't find mapped paths, please map paths for me to navigate!")
        }
    }
    else
    {
        npc.world.broadcast("[ERR!] " + npc.getDisplay().getName() + ": " + "Couldn't find Node Registry, please create nodes and map paths for me to navigate!")
    }

    // Move to start
    //npc.world.broadcast("PrepNav returning " + shortestPath)
    return shortestPath
}

function tick(event)
{
    if(event.npc.getStoreddata().get("CurrentLocation") != event.npc.getStoreddata().get("NavTo"))
    {
        //event.npc.world.broadcast("I need to navigate!")
        if(event.npc.getStoreddata().get("navPath"))
        {
            // Already have a path made
            //event.npc.world.broadcast("navPathExists!")
            if(event.npc.getStoreddata().get("isNavigating"))
            {
                // rgrgrgrg

            }
            else
            {
                if(!(event.npc.isNavigating()))
                {
                    //event.npc.world.broadcast("Travel to Start complete")
                    event.npc.getStoreddata().put("isNavigating", 1)
                    //event.npc.world.broadcast("navPath in NPC: " + event.npc.getStoreddata().get("navPath"))
                }
            }
        }
        else
        {
            // No nav path exists, make one
            event.npc.world.broadcast("Navigating from: " + event.npc.getStoreddata().get("CurrentLocation") + " to " + event.npc.getStoreddata().get("NavTo"))
            var shortestPath = prepNav(event.npc, event.npc.getStoreddata().get("CurrentLocation"), event.npc.getStoreddata().get("NavTo"), event.npc.getStoreddata().get("NavSpeed"))
            //event.npc.world.broadcast("shortestPath after return: " + JSON.stringify(shortestPath))
            event.npc.getStoreddata().put("LastLocationRecorded", "")
            event.npc.getStoreddata().put("navPath", JSON.stringify(shortestPath))
            event.npc.world.broadcast("navPath in NPC: " + event.npc.getStoreddata().get("navPath"))
        }
        //event.npc.getStoreddata().put("LastLocationRecorded", event.npc.getStoreddata().get("CurrentLocation"))
        //var shortestPath = prepNav(event.npc, event.npc.getStoreddata().get("CurrentLocation"), event.npc.getStoreddata().get("NavTo"), event.npc.getStoreddata().get("NavSpeed"))
    }
    else if(event.npc.getStoreddata().get("isNavigating"))
    {
        event.npc.getStoreddata().put("isNavigating", 0)
        event.npc.getStoreddata().put("navPath", "")
    }
}