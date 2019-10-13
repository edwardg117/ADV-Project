function init(event)
{
    // Start timer
    event.npc.timers.forceStart(1,300, false)
}

function timer(event)
{
    // If timer comletes, despawn
    if(event.id == 1)
    {
        event.npc.despawn()
    }
}

// If player attacks before timer has finished, despawn
function damaged(event)
{
    event.npc.despawn()
}
