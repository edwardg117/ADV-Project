/*
Full screen image display V1.00 by edwardg
Displays a fullscreen image that is loaded in a resource pack
Supports all 16x9 displays up to 4k
ALL IMAGES MUST BE SQUARE
eg
1280x1280
1920x1920
2560x2560
3840x3840
Place image to display at the top of the canvas and leave the bottom blank

***ONLY WORKS IN SINGLEPLAYER***

*/
var NpcAPI = Java.type("noppes.npcs.api.NpcAPI").Instance();
function showFullscreen16x9Image(Player, Texture)
{
    var Minecraft = Java.type("net.minecraft.client.Minecraft").func_71410_x();
    var maxWidth = 3840; // 4k
    var maxHeight = 2160;
    var screenWidth = Minecraft.field_71443_c;
    var screenHeight = Minecraft.field_71440_d;
    var maxScale = Math.floor(screenHeight/240); // GUI will not be drawn bigger than this so we need to ignore lager values
    var pause = true;

    if(screenWidth > maxWidth || screenHeight > maxHeight || screenWidth/screenHeight != 16/9)
    {
        Player.message("Unsupported resolution or aspect ratio! Result may not look as intended.");
    }

    var scaleFactor = maxHeight/screenHeight; // 4k = 1, 2k = 1.5, 1080 = 2, 720 = 3, 480 = 4.5
    var guiScale = Minecraft.field_71474_y.field_74335_Z;
    // If guiScale is 0 (Auto) or greater than the max scale available for the monitor, set to the max scale
    //guiScale = guiScale || Math.floor(screenHeight/240);
    if(guiScale == 0 || guiScale > maxScale){guiScale = maxScale;}
    
    var gui = NpcAPI.createCustomGui(0, 1*(screenWidth/guiScale), 1*(screenHeight/guiScale), pause); // GUI should encompass the whole screen with 0,0 being in the top left pixel
    
    //gui.setBackgroundTexture("minecraft:textures/gui/" + texture[6]); // black background for testing
    /* 
    1080
    1 = 7.5
    2 = 3.75
    3 = 2.5
    4 = 1.875
    */
    gui.addTexturedRect(1, Texture, 0, 0, 256, 256).setScale((15/scaleFactor)/guiScale);

    Player.showCustomGui(gui);
    return gui;
}