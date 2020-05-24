/*
Moving path editor V0.01 by edwardg

Usage Instructions:

*/

/**
 * Applies a new moving path to an NPC
 * @param {ICustomNpc} Npc The NPC to apply the new moving path to
 * @param {[[Number,Number,Number],...]} Points A list of waypoints in format [x,y,z]
 * @param {Number} Position How far along the NPC is in the path, Default: 0
 * @param {Number} Type 0 = Looping, 1 = Backtracking, Default: 0
 * @param {Boolean} Pauses Stop at each point? Default: false
 * @example setMovingPath(event.npc, [[1,2,3],[5,2,3],[5,2,7],[1,2,7]], 0, false)
 * @returns {Boolean} Success or Failure
 */
function setMovingPath(Npc, Points, Position, Type, Pauses)
{
    Position = Position || 0;
    Type = Type || 0;
    Pauses = Pauses || false;
    // Construct a string with all the path points
    var pathLength = Points.length;
    var pointList = "[";
    for(var i = 0; i < pathLength; i++)
    {
        /*
        Each point in a moving path looks like this {Array:[I;546,73,-155]}
        Each point exists in an ordered list in the NPC's NBT data
        To change we need to make a string with the same format and use
        /entitydata to set the new waypoint data
        */
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
    /*
    Npc.setMovingPathType​(int type,
                       boolean pauses)

    //MovingPatern:0, 0 Looping, 1 Backtracking
    MovingPos:0, /* Position in array 
    MovingPathNew:[ /* List of points 
        {Array:[I;546,73,-155]},
        {Array:[I;546,72,-153]},
        {Array:[I;544,72,-153]},
        {Array:[I;544,72,-156]}
        ]
    */
    Npc.addTag(Npc.getUUID() + "modifyingPath");
    Npc.executeCommand('/entitydata @e[tag=' + Npc.getUUID() + 'modifyingPath] {MovingPos:' + Position + ',MovingPathNew:' + pointList + '}');
    Npc.ai.setMovingPathType(Type, Pauses);
    Npc.removeTag(Npc.getUUID() + "modifyingPath");
}

