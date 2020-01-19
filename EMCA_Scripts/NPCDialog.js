/*
Alternate conversation script v0.02 by edwardg
Main features:
- Uses chat window for conversation rather than the dialog feature by Noppes
- Runs around the responses to dialogs rather than the dialogs themselves
    i.e Response lists that can be as long as you like, move to multiple lists
    No need to create a new dialog if you want to have more than 6 reponses to what the NPC says
    No need to create duplicate dialogs if you want the same options to be present after a selection
- Allows the use of a script to check dialog options and run a script when option is chosen
- More control over what happens in a conversation
- Simply call startDialog and pass it the dialog you want to start on
- Play sound from resourcepack to acompany dialog
- Dialog stops if player walks away

New in version 0.02
- startDialog must now be passed event, startDialog(event, npc, player, startingList)
- functions in dialog scripts are now passed event first. function(event, npc)
- availability functions now passed event first, function(event, npc)

Planned features:
- A Fallout style "Ask me about"
- Pre-made animations / poses to play when option is chosen or halfway through the NPC dialog
- Build in NPC dialog in sentances rather than all at once
- Custom hover text on reponses
- End dialog if player walks away but continue from where the left off

## Uses Run Delay by Ronan https://pastebin.com/YVqHYiAi ##
Load his script into a the same tab


/*
Things to remember
Timer values:
1 = checking for reply
2 = checking for reply for "ask me about" (Not implemented yet, just reserving it)

Response Structure (current):
0 Text
1 NPC Response
2 Colour
3 NPC sound
4 Availability Options
5 Script stuff to run when option is chosen
6 Where to go next (The response list, empty for stay in same)
*/
var GDiagResponses; // array with ["Option","Colour"]
var GCurrentResponseList; // string

// swapping to this for readability soon
var RText = 0;
var RNPC_Response = 1;
var RColour = 2;
var RNPC_Sound = 3;
var RAvailability_Options = 4;
var RScript = 5;
var RNext = 6;


function startDialog(event, npc, player, startingList)
{
    // Starts the dialog loop with the NPC
    if(!Boolean(npc.getStoreddata().get("inDialogWith")))
    {    
        var start = dialog[startingList]; // Start is the entry point I've hardcoded, will be an option in future
        GCurrentResponseList = startingList;
        var diagOptions = start["diagOptions"];

        npc.world.broadcast("\n"); // Spacing
        npc.say(start["Text"]); // Print the starting/entry text for this dialog (only done this once)
        npc.world.playSoundAt(npc.getPos(), start["Sound"], 1.0, 1.0);
        runDelay(1, function(){printChoices(npc, diagOptions, event);}); // Wait a specified time to print the options, thanks Ronan for the runDelay() function

        // Store information on NPC and player so they know they are in a dialog and who with
        player.getStoreddata().put("isInDialog", 1);
        player.getStoreddata().put("inDialogWith", npc.getUUID());
        npc.getStoreddata().put("dialogResponse", "");
        npc.getStoreddata().put("inDialogWith", player.getUUID());
        // Start the "Check for response" loop
        npc.getTimers().start(1, 2, true);
    }
}

function continueDialog(event, chosenOption)
{
    // Continueation of dialog between player and NPC after a chosen response
    event.npc.getStoreddata().put("dialogResponse", "");
    var npc = event.npc;
    var player = npc.world.getEntity(npc.getStoreddata().get("inDialogWith")); // get Player
    var diagOptions = dialog[GCurrentResponseList]["diagOptions"];

    // Need to find the chosen option in relation to the current reponse list
    var i = 0;
    for(i =0; i < diagOptions.length; i += 1) // I've debated about using a while here but decided against it because something has to be wrong with my code
    {    // Find the exact response in the array
        if(diagOptions[i][0] == chosenOption)
        {
            var chosenDiagOption = i;
            break; // not really nescassary but why go though remaining stuff if found
        }
    }
    // Now that we have found the option
    npc.world.broadcast("\n\n"); // Spacing
    npc.say(diagOptions[chosenDiagOption][1]); // Say response to option
    npc.world.playSoundAt(npc.getPos(), diagOptions[chosenDiagOption][RNPC_Sound], 1.0, 1.0); // Play sound for response
    diagOptions[chosenDiagOption][5](event, npc); // Run scripts for dialog if any

    // What do I do now?
    if(diagOptions[chosenDiagOption][6] != "") // Are we moving to a new Response list?
    {
        if(diagOptions[chosenDiagOption][6] == "End") // Are we ending dialog?
        {
            endDialog(npc, player); // Ends dialog nicely
        }
        else
        {
            // Moving to a new reponse list
            GCurrentResponseList = diagOptions[chosenDiagOption][6]; // The new repsonse list is stored here, should probably not have magic numbers here but whatever
            var nextList = dialog[GCurrentResponseList]; // Get the new response list
            diagOptions = nextList["diagOptions"]; // Get the responses in that list
            runDelay(1, function(){printChoices(npc, diagOptions, event);}); // Wait a specified time (1 second) before printing responses
            npc.getTimers().start(1, 2, true); // Start the "Check for response" loop again
        }
    }
    else
    {
        runDelay(1, function(){printChoices(npc, diagOptions, event);}); // Wait a specified time (1 second) before printing responses
        npc.getTimers().start(1, 2, true); // Start the "Check for response" loop again
    }
}
function endDialog(npc, player)
{
    // Ends dialog nicely
    player.getStoreddata().put("isInDialog", 0);
    player.getStoreddata().put("inDialogWith", "");
    npc.getStoreddata().put("dialogResponse", "");
    npc.getStoreddata().put("inDialogWith", "");
    npc.world.broadcast("[Dialog Ended]"); // Remember to remove this later
}

function printChoices(npc, diagOptions, event)
{
    // determine available responses and print them with /tellraw
    log("start printing choices")
    if(npc.getStoreddata().get("inDialogWith")) // Has dialog ended because the player walked away?
    {
        var options = [];
        var option = "";
        var i = 0;
        for(i = 0; i < diagOptions.length; i += 1)
        {
            if(diagOptions[i][4](event, npc))
            {
                // If availability options section returns true then add it
                options.push([diagOptions[i][0], diagOptions[i][2]]); // ["text","colour"]
            }
        }
        GDiagResponses = options;

        for(i = 0; i < options.length; i += 1)
        {
            option = '/tellraw @p ["",{"text":"' + (i+1) + '. ' + options[i][0] + '","color":"' + options[i][1] + '","clickEvent":{"action":"run_command","value":"' + options[i][0] + '"}}]' //,"hoverEvent":{"action":"show_text","value":{"text":"","extra":[{"text":"[Hover Text]"}]}}}]';
            //tellraw @p ["",{"text":"[Replace Me]","color":"gold","clickEvent":{"action":"run_command","value":"[Replace Me]"},"hoverEvent":{"action":"show_text","value":{"text":"","extra":[{"text":"[Hover Text]"}]}}}]
            npc.executeCommand(option);
        }
    }
}

function timer(event)
{
    if(event.id == 1) // Get dialog response
    {
        var response = event.npc.getStoreddata().get("dialogResponse");
        if(response)
        {
            var responses = [];
            for(var i = 0; i < GDiagResponses.length; i += 1)
            {
                responses.push(GDiagResponses[i][0]);
            }
            //event.npc.world.broadcast(JSON.stringify(responses));
            //event.npc.world.broadcast(response); // print the response the NPC got
            var responseIndex = responses.indexOf(response);
            if(responseIndex >= 0)
            {
                /*event.npc.world.broadcast("You typed a valid option and was option number " + (responseIndex + 1) + "!"); */
                event.npc.getTimers().stop(1);
                continueDialog(event, response);
            }
            else
            {
                event.npc.getStoreddata().put("dialogResponse", ""); // Clear garbage response so we don't keep checking it
            }
        }
        if(event.npc.getStoreddata().get("inDialogWith") != "")
        {
            var player = event.npc.world.getEntity(event.npc.getStoreddata().get("inDialogWith"));
            var playerName = player.getDisplayName();
            var output = event.API.executeCommand(player.world, 'testfor @p[name='+ playerName + ',x=' + event.npc.getPos().getX() +',y=' + event.npc.getPos().getY() + ',z=' + event.npc.getPos().getZ() + ',r=5]');
            if(output.indexOf("Found " + playerName) == -1)
            {
                event.npc.getTimers().stop(1);
                endDialog(event.npc, player);
            }
        }
        else
        {
            event.npc.getTimers().stop(1);
        }
    }
    
}

function tick(e) {
    runDelayTick();
}