/*
Moving path editor V0.02 by edwardg

Usage Instructions:
Call setMovingPath() from anywhere you choose, just give it a valid npc and list of points. I've done basically no error checking or handling.
The only thing I made sure of was that you can't step outside of the points you send in with the current position.
- The function will not change things like stop on interact, speed and if the npc should be following a moving path, you need to set those yourself. 
nbt cheatsheet:
{
ReturnToStart:1b, // Return to start 
stopAndInteract:1b, // Stand still if the player is interacting 
MovingPatern:0, // 0 Looping, 1 Backtracking 
StartPosNew:[I;546,73,-155], // Unsure, possibly home as it's never included in the moving path or changes based on the first point in it
MoveState:0, // Walking animation, see http://www.kodevelopment.nl/customnpcs/api/1.12.2/noppes/npcs/api/constants/AnimationType.html
MoveSpeed:5, // Movement speed, 1-10 
MovingState:2, // Unsure, possibly for standing, wandering, moving path. I never checked
MovingPos:0, // Position in array 
MovementType:0, // Unsure, possibly something related to how NPC moves 
MovingPause:1b, // Stop at each point
MovingPathNew:[ // List of points 
    {Array:[I;546,73,-155]},
    {Array:[I;546,72,-153]},
    {Array:[I;544,72,-153]},
    {Array:[I;544,72,-156]}
    ]
}
*/

/**
 * Applies a new moving path to an NPC
 * @param {ICustomNpc} Npc The NPC to apply the new moving path to
 * @param {[[Number,Number,Number],...]} Points A list of waypoints in format [x,y,z]
 * @param {Number} Position How far along the NPC is in the path, Default: 0
 * @param {Number} Type 0 = Looping, 1 = Backtracking, Default: 0
 * @param {Boolean} Pauses Stop at each point? Default: false
 * @example setMovingPath(event.npc, [[1,2,3],[5,2,3],[5,2,7],[1,2,7]], 0, false)
 * @returns {Boolean} Success
 */
function setMovingPath(Npc, Points, Position, Type, Pauses)
{
    Position = Position || 0;
    Type = Type || 0;
    Pauses = Pauses || false;

    // Construct a string with all the path points
    var pathLength = Points.length;
    if(Position >= pathLength)
    {
        Position = pathLength - 1;
        log("[WARN] MovingPathEditor.setMovingPath(): Path Positon was greater than the number of Points provided, set it to the last point.");
    }
    else if(Position < 0)
    {
        Position = 0;
        log("[WARN] MovingPathEditor.setMovingPath(): Path Positon was less than 0, set it to the first point.");
    }
    /*
        Each point in a moving path looks like this {Array:[I;546,73,-155]}
        Each point exists in an ordered list in the NPC's NBT data
        To change we need to make a string with the same format and use
        /entitydata to set the new waypoint data
    */
   log("[INFO] MovingPathEditor.setMovingPath(): Generating path string.");
    var pointList = "[";
    for(var i = 0; i < pathLength; i++)
    {
        pointList += "{Array:[I;" + Points[i][0] + "," + Points[i][1] + "," + Points[i][2] + "]}";
        if(i != pathLength-1)
        {
            pointList += ","; // Append a comma so we can add the next item
        }
        else
        {
            pointList  += "]"; // Append the close bracket so the list is finished
        }
    }

    // Now we have the points, we apply them 
    log("[INFO] MovingPathEditor.setMovingPath(): Applying path.");
    Npc.addTag(Npc.getUUID() + "modifyingPath");
    Npc.executeCommand('/entitydata @e[tag=' + Npc.getUUID() + 'modifyingPath] {MovingPos:' + Position + ',MovingPathNew:' + pointList + '}');
    Npc.ai.setMovingPathType(Type, Pauses);
    Npc.removeTag(Npc.getUUID() + "modifyingPath");
    log("[INFO] MovingPathEditor.setMovingPath(): Done.");
    return true;
}

