/*
Roads Alpha 4 by edwardg
Uses jsonified by ratquaza (baito), https://github.com/ratquaza/jsonified

In this version:
- Block is passable
- Block is invisible
- Can be told neighbouring nodes
- Automatically register node for pathing
- Node names (enforces unique name for each node. Must be told it's name, no auto-incrementing nodes)
- Automatic location getting (records where it is in the world and saves it)
- Can get the distance between it and neighbours
- Method for storing all this
- In separate python file:
    - Read all nodes
    - Discover the shortest path from any node to any other node
        - Method for returning the shortest path
        - Able to tell when a node has no path to it and avoids crash
    - Records all path information in a separate json file so it can be read by another script
- Automatically removes itself from the register if destroyed
- Updates where the NPC is whenever it passes it and updates a second value if it is in the node list
    - If in nav path -> I am the last reached node in the path, update in NPC.
- No longer tells the NPC that it needs to walk to the next node, that will be up to the NPC now


Planned
- 4 Types of node
    1. Start/End        (Location/arrival)
    2. Nav              (Between start and end nodes)
    3. Greater Nav      (Between two cities)
    4. City Entry/Exit  (Marks arrivial/departure from a city)
    5. Decision Node    (Also could be called "itersection node", directs the NPC down the correct road and corrects the path if the NPC went the wrong way)
- More intuative method for learning neighbours (who is next in line and previous if backtracking enabled)
- Where it is, ie. in a City or between two Cities
- Ensure that the block can only be destroyed by a player in creative mode and no other means

Type 0 = Start/End
Type 1 = Nav

Put into Scripted Block:
var type = 0 // Type of Node
var name = "TestNode" // Name of Node
var city = "" // Name of City/City ID
var neighbours = [] // String names of neighbouring Nodes (what nodes can you go to from here)
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
    // Has this node already been initialised?
    if(event.block.getStoreddata().get("init"))
    {
        // Block has been initialised before
        var nodeRegistry = getNodeRegistry(event);
        if(event.block.getStoreddata().get("Name") != name)
        {
            // Node name has changed, update everything
            // Remove the old node
            event.block.world.broadcast("Removing " + event.block.getStoreddata().get("Name") + " from Node Registry...");
            removeNodeFromRegistry(event, nodeRegistry);
            // Add the new node
            event.block.world.broadcast("Adding " + event.block.getStoreddata().get("Name") + " to Node Registry...");
            addNodeToRegistry(event, nodeRegistry);
            
        }
        else
        {
            // Node name has not changed, update accordingly
            var myRegistry = nodeRegistry[name];
            if(type != myRegistry["Type"] || city != myRegistry["City"] || JSON.stringify(neighbours) != JSON.stringify(myRegistry["Neighbours"]))
                {
                    event.block.world.broadcast("Updating Node... " + name);
                    addNodeToRegistry(event, nodeRegistry);
                }
            // else no change, don't update
        }
    }
    else
    {
        // Block has not been initialised before, perform first time setup
        var spiderClass = Java.type("org.baito.forge.jsonified.Spider");
        var spider = new spiderClass();
        spider.in("CNPCsRoads");

        // It is possible that the world has no Node Registry, check for it
        if(spider.exists(event.block.world.getName() + "_NodeRegistry.json"))
        {
            // Node Registry exists, get it
            var nodeRegistry = JSON.parse(spider.get(event.block.world.getName() + "_NodeRegistry.json"));
        }
        else
        {
            // Node Registry doesn't exist, create it
            var nodeRegistry = {};
            spider.create(event.block.world.getName() + "_NodeRegistry.json", 1, JSON.stringify(nodeRegistry));
        }

        // We now have a Node Registry, see if the new node can be added
        if(name in nodeRegistry)
        {
            // A Node has already been initialised under that name, a new one needs to be chosen
            var pos = event.block.getPos();
            var nodePos = [pos.getX(),pos.getY(),pos.getZ()];
            event.block.world.broadcast("This Node name already exists in Node Registry!\nExisting Node: " + name + " " + nodeRegistry[name]["Pos"] + "\n Please choose a unique name for new node at: " + nodePos);
        }
        else
        {
            // Node is unique and can be added
            event.block.setIsPassible(true); // Player can walk through the block
            event.block.setModel("minecraft:barrier"); // Block is invisible

            event.block.world.broadcast("Adding New Node to Registry...");
            addNodeToRegistry(event, nodeRegistry);
            event.block.getStoreddata().put("init", 1); // Signifies that the Node has completed initialisation at least once
        }

    }
}

function addNodeToRegistry(event, nodeRegistry)
{
    // Adds a node to the Node Registry
    var spiderClass = Java.type("org.baito.forge.jsonified.Spider");
    var spider = new spiderClass();
    spider.in("CNPCsRoads");
    var aboutMe = {};

    // Node Type
    event.block.getStoreddata().put("Type", type);
    aboutMe["Type"] = type;
        
    // Block Position
    var pos = event.block.getPos();
    aboutMe["Pos"] = [pos.getX(),pos.getY(),pos.getZ()];

    // Node Name
    event.block.getStoreddata().put("Name", name);
    aboutMe["Name"] = name;

    // City Name
    event.block.getStoreddata().put("City", city);
    aboutMe["City"] = city;

    // Neighbours
    var finalNeighbours = [];
    if(neighbours.length)
    {
        var i = 0;
        var distToNeighbour;
        for(i = 0; i < neighbours.length; i++)
        {
            distToNeighbour = getDistancetoNeighbour(event.block, neighbours[i], nodeRegistry);
            finalNeighbours.push([neighbours[i], distToNeighbour]);
        }
    }
    aboutMe["Neighbours"] = finalNeighbours;
        
    // Add to registry
    nodeRegistry[aboutMe["Name"]] = aboutMe;
    spider.create(event.block.world.getName() + "_NodeRegistry.json", 1, JSON.stringify(nodeRegistry));
}

function removeNodeFromRegistry(event, nodeRegistry)
{
    // Removes a node from the Node Registy
    var spiderClass = Java.type("org.baito.forge.jsonified.Spider");
    var spider = new spiderClass();
    var nodeName = event.block.getStoreddata().get("Name");

    delete nodeRegistry[nodeName]; // Remove from memory
    spider.create(event.block.world.getName() + "_NodeRegistry.json", 1, JSON.stringify(nodeRegistry)); // Save to file
}

function getNodeRegistry(event)
{
    // Returns the Node Registry
    var spiderClass = Java.type("org.baito.forge.jsonified.Spider");
    var spider = new spiderClass();
    spider.in("CNPCsRoads");
    var nodeRegistry = JSON.parse(spider.get(event.block.world.getName() + "_NodeRegistry.json"));
    return nodeRegistry;
}

function broken(event) // Player destroys scripted block
{
    // Check to see if: 
    // 1. The Node Registry exists
    // 2. The Node is in the Registy
    // 3. It is the same Node and not one with a duplicate name.
    // Then remove it
    var nodeRegistry = getNodeRegistry(event);
    var pos = event.block.getPos();
    var nodePos = [pos.getX(),pos.getY(),pos.getZ()];
    var nodeName = event.block.getStoreddata().get("Name");
    
    if(spider.exists(event.block.world.getName() + "_NodeRegistry.json")) // Does the Node Registry exist yet?
    {
        // Node Registry exists. Check to see if the node name is in the registry
        if(nodeName in nodeRegistry)
        {
            // Node name is in the registry
            if(JSON.stringify(nodePos) == JSON.stringify(nodeRegistry[nodeName]["Pos"])) // Do the xyz cordinates match what's in the registry?
            {
                // If yes to all, then the node exists in the Node Registry and must be removed
                removeNodeFromRegistry(event, nodeRegistry);
                event.block.world.broadcast("Node Removed from Node Registry, name freed: " + nodeName);
            }
        }
    }
}

function getDistancetoNeighbour(Node, neighbourName, nodeRegistry)
{
    // Returns the distance to a specified neighbour
    var distance = null; // Initialise the return value
    var NodePos = Node.getPos(); // Position of the Node

    // Check to see if the node name is in the registry
    if(neighbourName in nodeRegistry)
    {
        var nPos = nodeRegistry[neighbourName]["Pos"];
        var MCBlockPos = Java.type("net.minecraft.util.math.BlockPos");
        var IBlockPosWrapper = Java.type("noppes.npcs.api.wrapper.BlockPosWrapper");
        var neighbourPos = new IBlockPosWrapper(new MCBlockPos(nPos[0], nPos[1], nPos[2]));
        distance = NodePos.distanceTo(neighbourPos);
    }
    else
    {
        Node.world.broadcast("Invalid Neighbour: " + neighbourName + " not in Node Registry");
    }

    return distance;
}

function collide(event)
{
    // When any entity walks into the scripted block, custom npcs are type 2
    if(event.entity.getType() == 2)
    {
        // An NPC has touched the block
        var myName = name;
        event.entity.getStoreddata().put("CurrentLocation", myName); // Let the NPC know it's here
        // Is the NPC trying to get somewhere?
        if(event.entity.getStoreddata().get("isNavigating"))
        {
            // NPC is trying to navigate to somewhere, is it me?
            if(event.entity.getStoreddata().get("NavTo") != myName)
            {
                // NPC is not trying to get to me, am I on the path to it?
                //var nodeRegistry = getNodeRegistry(event);
                var navPath = JSON.parse(event.entity.getStoreddata().get("navPath")); // The path the NPC is taking, found in the NPC
                var meInNavPath = navPath.indexOf(myName);
                if(meInNavPath > -1)
                {
                    // I'm in the Nav path, I need to let the NPC know it's reached me in it's path
                    event.entity.getStoreddata().put("LastLocationRecorded", myName);
                    // Old code had me telling the NPC to move here, I want the NPC to be in charge of that now
                }
            }
        }
    }
}