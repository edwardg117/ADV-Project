/*
Companion script V0.01 by edwardg

*/

// Leveling up of companion

function init(event)
{
    // Initialise initial values for a melee companion
    // If already done: check to see if the player needs to followed again
    if(event.npc.getStoreddata().get("init"))
    {
        //event.npc.getStoreddata().put("init", 0) // emergency reset
        if(event.npc.getStoreddata().get("followedPlayer"))
        {
        
            if(event.npc.getStoreddata().get("isWaiting"))
            {
                // Do nothing
            }
            else
            {
                // Restore player as companion
                var player = event.npc.world.getPlayer(event.npc.getStoreddata().get("followedPlayer"));
                event.npc.getRole().setInfinite(1);
                event.npc.getRole().setFollowing(player);
            }
        }
    }
    else
    {
        // Starting values
        event.npc.getStoreddata().put("level", 1); // starting level
        event.npc.getStoreddata().put("attackNum", 0);
        
        var melee = event.npc.getStats().getMelee();
        var stats = event.npc.getStats();
        
        melee.setStrength(1);
        melee.setRange(5);
        melee.setDelay(20);
        stats.setMaxHealth(20);
        stats.setHealthRegen(1);
        stats.setAggroRange(5);
        
        event.npc.getStoreddata().put("init", 1);
        //event.npc.getStoreddata().put(")
        	//event.npc.world.broadcast(event.npc.getStats().getMelee().getStrength())
    }
}

function meleeAttack(event)
{
    //event.npc.world.broadcast("attack!");
    var npcLevel = event.npc.getStoreddata().get("level");
    var attackNum = event.npc.getStoreddata().get("attackNum");
    
    attackNum += 1;
    
    if(5 * npcLevel <= attackNum)
    {
        npcLevel += 1;
        attackNum = 0;
        var melee = event.npc.getStats().getMelee();
        var stats = event.npc.getStats();
        
        var currentStrength = melee.getStrength();
        var range = melee.getRange();
        var delay = melee.getDelay();
        var maxHealth = stats.getMaxHealth();
        	var regen = stats.getHealthRegen();
        var aggro = stats.getAggroRange();
        
        melee.setStrength(currentStrength + 1);
        if(delay >= 1 && (npcLevel / 5) % 1 == 0)
        {
            melee.setDelay(delay - 1);
            melee.setRange(range + 1);
            stats.setHealthRegen(regen + 1);
        }
        stats.setMaxHealth(maxHealth + 1);
        stats.setAggroRange(aggro + 1);
        
        event.npc.getStoreddata().put("level", npcLevel);
        event.npc.getStoreddata().put("attackNum", 0);
        
        event.npc.world.broadcast(event.npc.getDisplay().getName() + " is now Level " + npcLevel);
    }
    event.npc.getStoreddata().put("attackNum", attackNum + 1);
}

// Recruiting / dismissing of NPC, uses alternate dialog script

/*function interact(event)
{
    // Initiate dialog with scripts
    if(event.npc.getRole().getInfinite())
    {
        if(event.npc.getStoreddata().get("isWaiting"))
        {
            startDialog(event.npc, event.player, "IsCompanion");
        }
        else
        {
            startDialog(event.npc, event.player, "IsCompanion");
        }
    }
    else
    {
        startDialog(event.npc, event.player, "NotCompanion");
    }
    event.setCanceled(true);
}*/
