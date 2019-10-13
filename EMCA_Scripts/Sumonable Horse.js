/*
Witcher 3 style horse summoning by edwardg
*/
function init(event)
{
    event.npc.addTag("npcHorse") // needed for teleporting and identifying this horse in minecraft
}

function tick(event)
{
    if(event.npc.role.getInfinite()) // If the horse is following the player
    {
        //event.npc.world.broadcast("Seeking Player")
        if(event.npc.world.getClosestEntity(event.npc.getPos(), 2, 1)) // If near the player, stop following
        {
            //event.npc.world.broadcast("The player is close, tp'ing home")
            event.npc.role.setInfinite(0)
            event.npc.setMount(null)
            event.API.executeCommand(event.npc.world, "tp @e[tag=npcHorse] @e[tag=horseMarker]")
        }
    }
}

/* ### Player-side Stuff ###
    if(event.message == "-saveHorse") // Save the UUID of the Real Horse perminately on the player
    {
        var entity = event.player.world.getClosestEntity(event.player.getPos(), 2, 4) // 4 for horse
        event.player.world.broadcast("UUID: " + entity.getUUID())
        event.player.getStoreddata().put("playerHorse", entity.getUUID())  
    }
    if(event.message == "-saveRider") // Save the UUID of the Rider NPC perminately on the player
    {
        var entity = event.player.world.getClosestEntity(event.player.getPos(), 2, 2) // 2 for npc
        event.player.world.broadcast("UUID: " + entity.getUUID())
        event.player.getStoreddata().put("horseRider", entity.getUUID())
    }
     if(event.message == "-onTop") // Mount Rider on Horse for no reason
    {
        var horse = event.player.world.getEntity((event.player.getStoreddata().get("playerHorse")))
        var navigator = event.player.world.getEntity((event.player.getStoreddata().get("horseRider")))
        horse.addRider(navigator)
    }

    if(event.message == "-horse2") // Player summons their horse
    {
        event.API.executeCommand(event.player.world, "execute @p ~ ~ ~ spreadplayers ~ ~ 10 20 false @e[tag=npcHorse]")
        event.API.executeCommand(event.player.world, "tp @e[tag=playerHorse] @e[tag=npcHorse]")
        var horse = event.player.world.getEntity((event.player.getStoreddata().get("playerHorse")))
        var navigator = event.player.world.getEntity((event.player.getStoreddata().get("horseRider")))
        horse.addRider(navigator)
        navigator.role.setFollowing(event.player)
        navigator.role.setInfinite(1)
    }
*/