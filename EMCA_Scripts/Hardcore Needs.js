/*
Harder survival by edwardg

Thermal clothing needed in cold environments, 
*/
/* 
notes from adv tester:
original redstone logic went once every 10 redstone ticks (1 second or 0.1 tick events)
Snow in mountains: 94
fostbite max 200
for hypothermia to kill:
execute @p ~ ~ ~ /summon potion ~ ~1 ~ {CustomName:"Hypothemia",CustomNameVisible:1,Potion:{id:"minecraft:splash_potion",Count:1,tag:{Potion:"minecraft:strong_harming",CustomPotionEffects:[{Id:7,Amplifier:20,Duration:20}]}}}
standing on snow block is +3 cold
standing on snow layer is +3 cold
raining is +2 cold
heat source +5 cold reistance
Getting cold:
    /tellraw @a {"text":"You are ill-equiped for the current climate","color":"dark_red"}
    /title @a actionbar {"text":"You are ill-equiped for the current climate","color":"dark_red"}
level 1 hypothermia:
    /tellraw @a {"text":"You are now suffering from mild Hypothermia","color":"dark_red"}
    /title @a actionbar {"text":"You are now suffering from mild Hypothermia","color":"dark_red"}
    /effect @a minecraft:hunger 1 0
    /effect @a minecraft:weakness 2 0
level 2:
    /tellraw @a {"text":"You are now suffering from mid stage Hypothermia","color":"dark_red"}
    /title @a actionbar {"text":"You are now suffering from mid stage Hypothermia","color":"dark_red"}
    /effect @a minecraft:hunger 2 0
    /effect @a minecraft:slowness 2 0
    /effect @a minecraft:weakness 2 1
level 3:
    /tellraw @a {"text":"You are now suffering from late stage Hypothermia","color":"dark_red"}
    /title @a actionbar {"text":"You are now suffering from late stage Hypothermia","color":"dark_red"}
    /effect @a minecraft:slowness 2 2
    /effect @a minecraft:weakness 2 2
Death:
    /tellraw @a {"text":"You have died from Hypothermia","color":"dark_red"}
    execute @p ~ ~ ~ /summon potion ~ ~1 ~ {CustomName:"Hypothemia",CustomNameVisible:1,Potion:{id:"minecraft:splash_potion",Count:1,tag:{Potion:"minecraft:strong_harming",CustomPotionEffects:[{Id:7,Amplifier:20,Duration:20}]}}}

hunger
food lvl 9:
    effect @a minecraft:weakness 4
food lvl 4:
    effect @a minecraft:weakness 4 1
    effect @a minecraft:slowness 4
    effect @a minecraft:mining_fatigue 4
food lvl 2:
    effect @a minecraft:weakness 4 2
    effect @a minecraft:slowness 4 1
    effect @a minecraft:mining_fatigue 4 1
    (1/4 chance) /effect @a minecraft:nausea 8 20
    (1/6 chance) /effect @a minecraft:blindness 3

sleep
Iworld.getTime() returns current world time in ticks
Iworld.getTotalTime() returns total time world has been active in ticks (excludes paused time)
bonus 10% xp for well rested
sleep point added once every 20 ticks (two tick event)
ticks per day: (24000)+24000 from extended days = 48000
testfor @a {Sleeping:1b}
minor sleep dep: 4000 NEW: 144000
    say You are suffering from mild sleep deprivation
    scoreboard players remove @a skillCharisma 1
    scoreboard players remove @a skillAwareness 1
advanced sleep dep: 6000 NEW: 240000
    say You are suffering from advanced sleep deprivation
    blockdata ~-3 ~ ~4 {Command:"effect @a slowness 4"}
    scoreboard players remove @a skillLockpick 1
    scoreboard players remove @a skillSmithing 1
crit sleep dep: 8000 NEW: 288000
    say You are suffering from critical sleep deprivation
    blockdata ~-2 ~ ~5 {Command:"effect @a weakness 4"}
    scoreboard players remove @a skillCharisma 2 (additional points)
    scoreboard players remove @a skillAwareness 2
    scoreboard players remove @a skillLockpick 2
    scoreboard players remove @a skillSmithing 2
    (1/9 chance) ghosts/visions spawn that swarm and harras the player (no damage, hitting causes them to despawn)
deadly sleep dep: 10000 NEW: 36000
    say You died because you haven't slept in the past week

How to record sleep:
BAD
function tick(event)
{
    event.API.executeCommand(event.player.world, '/title @a actionbar {"text":"Time: ' + event.player.world.getTime()%24000 + '","color":"dark_red"}');
    var player = event.player
    // At the start of the day, check if the player slept
    // Modulo 24000 because getTime() will increase above 1 MC day
    if((player.world.getTime()%24000 >= 0) && (player.world.getTime()%24000 <= 10)) // First 10 ticks
    {
        if(player.getStoreddata().get("Slept"))
        {
            player.world.broadcast("Player slept through the night.");
            player.getStoreddata().put("lastSleep", player.world.getTotalTime()); // Record last sleep
        }
        else
        {
            player.world.broadcast("Player did not sleep this night!");
        }
    }
    // Test for player sleeping
    if(player.world.getTime()%24000 >= 12541) // players can sleep from 12,541 to 23,458 ticks
    {
        var bedTest = event.API.executeCommand(player.world, '/testfor @a[name=' + player.getDisplayName() + '] {Sleeping:1b}'); // Says if the player was found or did not match tag

        if(bedTest == "Found " + player.getDisplayName())
        {
            player.getStoreddata().put("Slept", 1);
        }
        else if(player.getStoreddata().get("Slept"))
        {
            player.getStoreddata().put("Slept", 0);
        }
    }
}
GOOD FORGE SCRIPT
var API = Java.type("noppes.npcs.api.NpcAPI").Instance();
function playerWakeUpEvent(event)
{
    var mcPlayer=event.getEntityPlayer();
    var player=API.getIEntity(mcPlayer);
    if((player.world.getTime()%24000 >= 0) && (player.world.getTime()%24000 <= 10))
    {
        //player.world.broadcast("Player slept");
        player.getStoreddata().put("lastSleep", player.world.getTotalTime());
    }
}
    */

var SNOW_LEVEL = 120;
// # Snowy Biomes
// Biome temp 0.0, snow level 0
var biomes_0_00 = ["Ice Plains Spikes", "Ice Plains", "Ice Mountains", "Cold Taiga", "Cold Taiga Hills", "Cold Taiga M", "FrozenOcean", "FrozenRiver"];
// Biome temp 0.05, snow level 0
var biomes_0_05 = ["Cold Beach"];
// # Cold Biomes
// Biome temp 0.2, snow level 90
var biomes_0_20 = ["Extreme Hills", "Extreme Hills M", "Extreme Hills+", "Extreme Hills+ M", "Extreme Hills Edge", "Stone Beach"];
// Biome temp 0.25, snow level 120
var biomes_0_25 = ["Taiga", "TaigaHills", "Taiga M", "Mega Spruce Taiga", "Redwood Taiga Hills M"];
// Biome temp 0.3, snow level 150
var biomes_0_30 = ["Mega Taiga", "Mega Taiga Hills"];
// # Lush Biomes
// Biome temp 0.5, snow level 256 (out of world)
var biomes_0_50 = ["River", "Ocean", "Deep Ocean", "The Void"];
// Biome temp 0.6, snow level 256 (out of world)
var biomes_0_60 = ["Birch Forest", "Birch Forest Hills", "Birch Forest M", "Birch Forest Hills M"];
// Biome temp 0.7, snow level 256 (out of world)
var biomes_0_70 = ["Forest", "ForestHills", "Flower Forest", "Roofed Forest", "Roofed Forest M"];
// Biome temp 0.8, snow level 256 (out of world)
var biomes_0_80 = ["Plains", "Sunflower Plains", "Swampland", "Swampland M", "Beach"];
// Biome temp 0.9, snow level 256 (out of world)
var biomes_0_90 = ["MushroomIsland", "MushroomIslandShore"];
// Biome temp 0.95, snow level 256 (out of world)
var biomes_0_95 = ["Jungle", "JungleHills", "Jungle M", "JungleEdge", "Jungle Edge M", "Bamboo Jungle"];
// # The End
// The End dimension, all biomes 0.5, does not rain
var endBiomes = ["The End", "Small End Islands", "End Midlands", "End Highlands", "End Barrens"];
// # Dry/Warm Biomes
// Biome temp 1.0, no rain or snow
var biomes_1_00 = ["Savanna Plateau"];
// Biome temp 1.1, no rain or snow
var biomes_1_10 = ["Savanna M", "Savanna Plateau M"];
// Biome temp 1.2, no rain or snow
var biomes_1_20 = ["Savanna"];
// Biome Temp 2.0, no rain or snow
var biomes_2_00 = ["Desert", "DesertHills", "Desert M", "Mesa", "Mesa Plateau F", "Mesa Plateau", "Mesa Plateau F M", "Mesa Plateau M", "Hell"];

var biomeTemps = { // Excludes End, Includes Nether
    "Ice Plains Spikes":0.0, // y=0
    "Ice Plains":0.0, 
    "Ice Mountains":0.0, 
    "Cold Taiga":0.0, 
    "Cold Taiga Hills":0.0, 
    "Cold Taiga M":0.0, 
    "FrozenOcean":0.0, 
    "FrozenRiver":0.0,
    "Cold Beach":0.05,
    "Extreme Hills":0.2, // y=90
    "Extreme Hills M":0.2, 
    "Extreme Hills+":0.2, 
    "Extreme Hills+ M":0.2, 
    "Extreme Hills Edge":0.2, 
    "Stone Beach":0.2,
    "Taiga":0.25, // y=120
    "TaigaHills":0.25, 
    "Taiga M":0.25, 
    "Mega Spruce Taiga":0.25, 
    "Redwood Taiga Hills M":0.25,
    "Mega Taiga":0.3, // y=150
    "Mega Taiga Hills":0.3,
    "River":0.5, // y=256
    "Ocean":0.5, 
    "Deep Ocean":0.5, 
    "The Void":0.5,
    "Birch Forest":0.6, 
    "Birch Forest Hills":0.6, 
    "Birch Forest M":0.6, 
    "Birch Forest Hills M":0.6,
    "Forest":0.7, 
    "ForestHills":0.7, 
    "Flower Forest":0.7, 
    "Roofed Forest":0.7, 
    "Roofed Forest M":0.7,
    "Plains":0.8, 
    "Sunflower Plains":0.8, 
    "Swampland":0.8, 
    "Swampland M":0.8, 
    "Beach":0.8,
    "MushroomIsland":0.9, 
    "MushroomIslandShore":0.9,
    "Jungle":0.95, 
    "JungleHills":0.95, 
    "Jungle M":0.95, 
    "JungleEdge":0.95, 
    "Jungle Edge M":0.95, 
    "Bamboo Jungle":0.95,
    "Savanna Plateau":1.0, // rain stops
    "Savanna M":1.1, 
    "Savanna Plateau M":1.1,
    "Savanna":1.2,
    "Desert":2.0, 
    "DesertHills":2.0, 
    "Desert M":2.0, 
    "Mesa":2.0, 
    "Mesa Plateau F":2.0, 
    "Mesa Plateau":2.0, 
    "Mesa Plateau F M":2.0, 
    "Mesa Plateau M":2.0, 
    "Hell":2.0
}
function tick(event)
{
    var player = event.player;
    var playerPos = player.getPos();

    // Calculate cold resistance
    var coldResistance = 4; // base resistance is 4
    var helmet = player.getArmor(3);
    var chestplate = player.getArmor(2);
    var pants = player.getArmor(1);
    var boots = player.getArmor(0);
    
    if(helmet.getNbt().has("coldResistance"))
    {
        coldResistance += helmet.getNbt().getInteger("coldResistance");
    }
    if(chestplate.getNbt().has("coldResistance"))
    {
        coldResistance += chestplate.getNbt().getInteger("coldResistance");
    }
    if(pants.getNbt().has("coldResistance"))
    {
        coldResistance += pants.getNbt().getInteger("coldResistance");
    }
    if(boots.getNbt().has("coldResistance"))
    {
        coldResistance += boots.getNbt().getInteger("coldResistance");
    }
    //player.world.broadcast("Cold Resistance: " + coldResistance);

    var currentBiome = player.world.getBiomeName(player.getPos().getX(),player.getPos().getZ());
    var currentBiomeTemp = biomeTemps[currentBiome];

    var environmentLevel = 0.0;
    var heightWeight = 6;
    var weatherWeight = 2;
    var timeWeight = 2;
    var snowBlockWeight = 2;
    var snowLayerWeight = 2;
    var tempWeight = 6;

    var time = player.world.getTime()%24000;
    // Same calc for hot and cold biomes
    if(player.world.isRaining()){environmentLevel += weatherWeight;}
    if(player.world.getBlock(playerPos.getX(), playerPos.getY() - 1, playerPos.getZ()).getName() == "minecraft:snow"){environmentLevel += snowBlockWeight;}
    if(player.world.getBlock(playerPos.getX(), playerPos.getY(), playerPos.getZ()).getName() == "minecraft:snow_layer"){environmentLevel += snowLayerWeight;}

    if(currentBiomeTemp < 1.0) // Cold and temperate
    {
        if((time > 12540) && (time < 23450)){environmentLevel += timeWeight;} // Night time
        environmentLevel += tempWeight*(1-(Math.pow(currentBiomeTemp,0.6))); // Biome temp calc for cool half
        // call height 50 zero for level 0 snow biomes
        if(currentBiomeTemp < 0.2 && playerPos.getY() >= 50){environmentLevel += heightWeight;}
        else if(currentBiomeTemp >= 0.2 && currentBiomeTemp < 0.25 && playerPos.getY() >= 90){environmentLevel += heightWeight;}
        else if(currentBiomeTemp >= 0.25 && currentBiomeTemp < 0.3 && playerPos.getY() >= 120){environmentLevel += heightWeight;}
        else if(currentBiomeTemp >= 0.3 && currentBiomeTemp < 0.5 && playerPos.getY() >= 150){environmentLevel += heightWeight;}
        else if(playerPos.getY() >= 180){environmentLevel += heightWeight;}

        // Work out if the player is safe
        var difference = Math.ceil(environmentLevel - coldResistance);
        if(player.getStoreddata().get("overheat"))
        {
            difference = Math.abs(difference);
            player.getStoreddata().put("overheat", player.getStoreddata().get("overheat") - (difference + coldResistance));
            if(player.getStoreddata().get("overheat") < 0){player.getStoreddata().put("overheat", 0);}
        }
        else
        {
            player.getStoreddata().put("frostbite", player.getStoreddata().get("frostbite") + difference);
            //if(difference > 0){event.API.executeCommand(event.player.world, '/title @a actionbar {"text":"You are freezing to death (' + player.getStoreddata().get("frostbite") + '/200)","color":"dark_red"}');}
            if(player.getStoreddata().get("frostbite") < 0){player.getStoreddata().put("frostbite", 0);}
        }
    }
    else // Hot and dry biomes
    {
        if((time >=0 && time <= 12540) || time >= 23450){environmentLevel -= timeWeight;} // Day time
        else{environmentLevel += timeWeight;} // Night time
        environmentLevel += tempWeight*(3-currentBiomeTemp); // Biome temp calc for hot half
        if(playerPos.getY() >= 200){environmentLevel += heightWeight;}
        if(player.inWater()){environmentLevel += 2;}

        // is the player too hot?
        var difference = Math.ceil(coldResistance - environmentLevel);
        if(player.getStoreddata().get("frostbite"))
        {
            difference = Math.abs(difference);
            player.getStoreddata().put("frostbite", player.getStoreddata().get("frostbite") - (difference + coldResistance));
            if(player.getStoreddata().get("frostbite") < 0){player.getStoreddata().put("frostbite", 0);}
        }
        else
        {
            player.getStoreddata().put("overheat", player.getStoreddata().get("overheat") + difference);
            //if(difference > 0){event.API.executeCommand(event.player.world, '/title @a actionbar {"text":"You are overheating to death (' + player.getStoreddata().get("overheat") + '/200)","color":"dark_red"}');}
            if(player.getStoreddata().get("overheat") < 0){player.getStoreddata().put("overheat", 0);}
        }

    }

}