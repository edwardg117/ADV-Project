/*
Roads aplpha 1 by edwardg
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


Planned
- 4 Types of node
    1. Start/End        (Location/arrival)
    2. Nav              (Between start and end nodes)
    3. Greater Nav      (Between two cities)
    4. City Entry/Exit  (Marks arrivial/departure from a city)
    5. Decision Node    (Also could be called "itersection node", directs the NPC down the correct road and corrects the path if the NPC went the wrong way)
- More intuative method for learning neighbours (who is next in line and previous if backtracking enabled)
- Where it is, ie. in a City or between two Cities
- Interface for NPCs to use so they can make use of it
- Ensure that the block can only be destroyed by a player in creative mode and no other means

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
    var spiderClass = Java.type("org.baito.forge.jsonified.Spider")
    var aboutMe = {}
    //event.block.world.broadcast(JSON.stringify(aboutMe))
    event.block.setIsPassible(true)
    //event.block.setModel("minecraft:barrier")
    
    // Node Type
    event.block.getStoreddata().put("Type", type)
    aboutMe["Type"] = type
    
    // Block Position
    var pos = event.block.getPos()
    //event.block.world.broadcast("I'm at: " + String(pos.getX()) + " " + String(pos.getY()) + " " + String(pos.getZ()))
    aboutMe["Pos"] = [pos.getX(),pos.getY(),pos.getZ()]
    
    // Node Name
    event.block.getStoreddata().put("Name", name)
    aboutMe["Name"] = name

    // City Name
    event.block.getStoreddata().put("City", city)
    aboutMe["City"] = city

    // Neighbours
    var finalNeighbours = []
    if(neighbours.length)
    {
        var i = 0
        var distToNeighbour
        for(i = 0; i < neighbours.length; i++)
        {
            distToNeighbour = getDistancetoNeighbour(event.block, neighbours[i])
            finalNeighbours.push([neighbours[i], distToNeighbour])
        }
    }
    aboutMe["Neighbours"] = finalNeighbours

    var finalAboutMe = {}
    finalAboutMe[aboutMe["Name"]] = aboutMe
    //event.block.world.broadcast(JSON.stringify(aboutMe))
    
    // Create spider to crawl though files for us ### Thanks to baito for making this possible
    var spider = new spiderClass()
    spider.in("CNPCsRoads")

    // Save our object
    if(spider.exists("NodeRegistry.json")) // If Node Registry already exists, simply try to add new node if new
    {
        var nodeRegistry = JSON.parse(spider.get("NodeRegistry.json"))
        // Check to see if the node has already been created under that name
        if(aboutMe["Name"] in nodeRegistry)
        {
            if(JSON.stringify(aboutMe["Pos"]) == JSON.stringify(nodeRegistry[aboutMe["Name"]]["Pos"]))
            {
                event.block.world.broadcast("Updating Node...")
                // ## Update Code here ##
                nodeRegistry[aboutMe["Name"]] = aboutMe
                spider.create("NodeRegistry.json", 1, JSON.stringify(nodeRegistry))
            }
            else
            {
                event.block.world.broadcast("This Node name already exists in Node Registry!\nExisting Node: " + nodeRegistry[aboutMe["Name"]]["Name"] + " " + nodeRegistry[aboutMe["Name"]]["Pos"] + "\n Please choose a unique name for new node at: " + aboutMe["Pos"])
            }
            

        }
        else
        {
            event.block.world.broadcast("Adding New Node to Registry...")
            // ## Update Code here ##
            nodeRegistry[aboutMe["Name"]] = aboutMe
            spider.create("NodeRegistry.json", 1, JSON.stringify(nodeRegistry))
        }
    }
    else
    {
        event.block.world.broadcast("Couldn't find Node Registry, creating it!")
        spider.create("NodeRegistry.json", 1, JSON.stringify(finalAboutMe))

    }
    
    /*
    var roads = spider.get("RoadsTest.json")
    event.block.world.broadcast(roads)
    */
   /*
   if(neighbours.length)
   {
        var i = 0
        var distToNeighbour
        for(i = 0; i < neighbours.length; i++)
        {
            distToNeighbour = getDistancetoNeighbour(event.block, neighbours[i])
            event.block.world.broadcast("Distance to " + neighbours[i] + " " + distToNeighbour)
        }
   }
   */
}

function broken(event) // Player destroys scripted block
{
    var spiderClass = Java.type("org.baito.forge.jsonified.Spider")
    var spider = new spiderClass()
    spider.in("CNPCsRoads")
    var aboutMe = {}
    var pos = event.block.getPos()
    aboutMe["Pos"] = [pos.getX(),pos.getY(),pos.getZ()]
    aboutMe["Name"] = name
    // Save our object
    if(spider.exists("NodeRegistry.json")) // Does the Node Registry exist yet?
    {
        var nodeRegistry = JSON.parse(spider.get("NodeRegistry.json"))

        // Check to see if the node name is in the registry
        if(aboutMe["Name"] in nodeRegistry)
        {
            if(JSON.stringify(aboutMe["Pos"]) == JSON.stringify(nodeRegistry[aboutMe["Name"]]["Pos"])) // Do the xyz cordinates match what's in the registry?
            {
                // If yes to all, then the node exists in the Node Registry and must be removed
                delete nodeRegistry[aboutMe["Name"]] // Remove from memory
                spider.create("NodeRegistry.json", 1, JSON.stringify(nodeRegistry)) // Save to file
                event.block.world.broadcast("Node Removed from Node Registry, name freed")
            }
        }
    }
}

function getDistancetoNeighbour(Node, neighbourName)
{
    var distance = null
    var spiderClass = Java.type("org.baito.forge.jsonified.Spider")
    var spider = new spiderClass()
    spider.in("CNPCsRoads")
    var NodePos = Node.getPos()
    if(spider.exists("NodeRegistry.json")) // Does the Node Registry exist yet?
    {
        var nodeRegistry = JSON.parse(spider.get("NodeRegistry.json"))

        // Check to see if the node name is in the registry
        if(neighbourName in nodeRegistry)
        {
            var nPos = nodeRegistry[neighbourName]["Pos"]
            var MCBlockPos = Java.type("net.minecraft.util.math.BlockPos")
            var IBlockPosWrapper = Java.type("noppes.npcs.api.wrapper.BlockPosWrapper")
            var neighbourPos = new IBlockPosWrapper(new MCBlockPos(nPos[0], nPos[1], nPos[2]))
            distance = NodePos.distanceTo(neighbourPos)
        }
        else
        {
            Node.world.broadcast("Invalid Neighbour: " + neighbourName + " not in Node Registry")
        }
    }
    else
    {
        Node.world.broadcast("Node Registry does not exist, please create 1 node before declaring it a neighbour")
    }
    return distance
}