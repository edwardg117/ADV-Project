function interact(event)
{
    var horse = event.block.world.createEntity("minecraft:horse");
    var Const_horseHealthRange = [2, 10, 12, 14, 16, 18, 20, 22, 26, 28, 30];
    var Const_horseSpeedRange = [0.1, 0.1125, 0.1375, 0.1525, 0.1925, 0.2325, 0.2875, 0.3, 0.3375, 0.35, 0.4];
    var Const_horseJumpRange = [0.39, 0.4, 0.45, 0.48, 0.58, 0.645, 0.73, 0.785, 0.848, 0.915, 0.97];
    var horseVariants = [0,256,512,768,1024,
1,257,513,769,1025,
2,258,514,770,1026,
3,259,515,771,1027,
4,260,516,772,1028,
5,261,517,773,1029,
6,262,518,774,1030]
    
    var chosenVariant = horseVariants[randInt(0,35)];
    //horse.getEntityNbt().	setInteger("Variant", chosenVariant);
    //event.block.world.broadcast(horse.getEntityNbt().getType("Variant"));
    /*var keys = horse.getEntityNbt().	getKeys();
    var keyList = [];
    var i = 0
    for(i = 0; i < keys.length; i += 1)
    {
        keyList.push(keys[i]);
    }
    event.block.world.broadcast(JSON.stringify(keyList));*/
    event.block.world.broadcast(chosenVariant);
    horse.addTag("needsVariant");
    horse.setPos(event.block.getPos());
    horse.spawn();
    var randomHealth = Const_horseHealthRange[randInt(1,10)];
    var randomSpeed = Const_horseSpeedRange[randInt(1,10)];
    var randomJump = Const_horseJumpRange[randInt(1,10)];
    event.API.executeCommand(event.block.world, '/entitydata @e[type=horse,tag=needsVariant] {SaddleItem:{id:"minecraft:saddle",Count:1b},Tame:1,Variant:' + chosenVariant + ',Attributes:[{Name:generic.maxHealth,Base:' + randomHealth + '},{Name:generic.movementSpeed,Base:' + randomSpeed + '},{Name:horse.jumpStrength,Base:' + randomJump + '}]}');
    horse.removeTag("needsVariant");
    //horse.getEntityNbt().	setInteger("Variant", chosenVariant); // setInteger broke ;(
}

function randInt(min, max) 
{   // Returns a random number
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}