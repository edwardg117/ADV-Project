/*
Alternate conversation script v0.03 by edwardg
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

New in version 0.03
- Fallout style "Ask me about" is mostly working
- Got rid of globals
- Got rid of magic numbers
- Readability slightly increased

Planned features:
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

// Finally killed these dirty globals

// No more magic numbers :D
// Indexes for stuff in a response. R for response, ie. RText = Response text
var RText = 0;
var RNPC_Response = 1;
var RColour = 2;
var RNPC_Sound = 3;
var RAvailability_Options = 4;
var RScript = 5;
var RNext = 6;
// Timers
var ReplyTimer = 1;
var AskAboutTimer = 2;
var dynamicReplyListTimer = 4;

function startDialog(event, npc, player, startingList)
{
    // Starts the dialog loop with the NPC
    if(!Boolean(npc.getStoreddata().get("inDialogWith")))
    {    
        var start = dialog[startingList]; // Entry point for the conversation
        npc.getStoreddata().put("currentResponseList", startingList);
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
        npc.getTimers().start(ReplyTimer, 2, true);
    }
}

function continueDialog(event, chosenOption)
{
    // Continueation of dialog between player and NPC after a chosen response
    event.npc.getStoreddata().put("dialogResponse", "");
    var npc = event.npc;
    var player = npc.world.getEntity(npc.getStoreddata().get("inDialogWith")); // get Player
    if(npc.getStoreddata().get("currentResponseList") != "DynamicList")
    {
        var diagOptions = dialog[npc.getStoreddata().get("currentResponseList")]["diagOptions"];
    }
    else
    {
        var diagOptions = JSON.parse(npc.getStoreddata().get("dynamicOptionsList"));
    }

    // Need to find the chosen option in relation to the current reponse list
    var i = 0;
    for(i = 0; i < diagOptions.length; i++) // I've debated about using a while here but decided against it because something has to be wrong with my code
    {    // Find the exact response in the array
        if(diagOptions[i][RText] == chosenOption)
        {
            var chosenDiagOption = i;
            break; // not really nescassary but why go though remaining stuff if found
        }
    }
    // Now that we have found the option
    npc.world.broadcast("\n\n"); // Spacing
    //npc.say("oof!")
    //npc.say(JSON.stringify(diagOptions));
    npc.say(diagOptions[chosenDiagOption][RNPC_Response]); // Say response to option
    //npc.say("AH")
    npc.world.playSoundAt(npc.getPos(), diagOptions[chosenDiagOption][RNPC_Sound], 1.0, 1.0); // Play sound for response
    //npc.say("phat oof")
    //npc.say(JSON.stringify(diagOptions));
    diagOptions[chosenDiagOption][RScript](event, npc); // Run scripts for dialog if any
    //npc.say("code check")

    // What do I do now?
    if(diagOptions[chosenDiagOption][RNext] != "") // Are we moving to a new Response list?
    {
        if(diagOptions[chosenDiagOption][RNext] == "End") // Are we ending dialog?
        {
            endDialog(npc, player); // Ends dialog nicely
        }
        else if(diagOptions[chosenDiagOption][RNext] == "AskMeAbout") // Are we doing an "Ask me about" (Tell Me About in Fallout)
        {
            // Compile list of triggers 
            var triggerList = 0;
            var unfilteredTopics = dialog["AskMeAbout"]["Topics"];
            var topicList = []; // A list of strings ["topic 1", "topic 2", "topic 3"] doing this to avoid searching through the entire thing, response and all every time the player asks something
            for(var i = 0; i < unfilteredTopics.length; i++)
            {
                //  A b                             b  Cd                  d e                  e f                  fC A
                //[ [ ["trigger","trigger","trigger"], [["response","sound"],["response","sound"],["response","sound"]] ],   another topic]
                // Topics is split into a list of topics
                // A topic is split into a list of triggers and a list of reponses
                // A response is split into a list of the text and sound
                for(var trigger = 0; trigger < unfilteredTopics[i][triggerList].length; trigger++)
                {
                    topicList.push(unfilteredTopics[i][triggerList][trigger].toLowerCase());
                }
            }
            // Print a handy exit option
            var exitHelp = '/tellraw @p ["",{"text":"[exit]","color":"red","clickEvent":{"action":"run_command","value":"[exit]"},"hoverEvent":{"action":"show_text","value":{"text":"","extra":[{"text":"Click to return to dialog"}]}}}]';
            npc.executeCommand(exitHelp);
            // Save that list for retreval
            npc.getStoreddata().put("topicList", JSON.stringify(topicList));
            // Start the appropriate timer
            npc.getTimers().start(AskAboutTimer, 2, true);
        }
        else if(diagOptions[chosenDiagOption][RNext] == "DynamicList") // The next response list can change based on conditions in game, such as the number of horses the horse seller has
        {
            var diagOptions = diagOptions[chosenDiagOption][RScript](event, npc); // Get the response list from the return of the option that the player chose
            npc.getStoreddata().put("dynamicOptionsList", JSON.stringify(diagOptions));
            npc.getStoreddata().put("currentResponseList", "DynamicList");
            npc.getTimers().start(ReplyTimer, 2, true);
            runDelay(1, function(){printChoices(npc, diagOptions, event);}); // Wait a specified time (1 second) before printing responses
        }
        else
        {
            // Moving to a new reponse list
            npc.getStoreddata().put("currentResponseList", diagOptions[chosenDiagOption][RNext]); // The new repsonse list is stored here
            var nextList = dialog[npc.getStoreddata().get("currentResponseList")]; // Get the new response list
            diagOptions = nextList["diagOptions"]; // Get the responses in that list
            runDelay(1, function(){printChoices(npc, diagOptions, event);}); // Wait a specified time (1 second) before printing responses
            npc.getTimers().start(ReplyTimer, 2, true); // Start the "Check for response" loop again
        }
    }
    else
    {
        runDelay(1, function(){printChoices(npc, diagOptions, event);}); // Wait a specified time (1 second) before printing responses
        npc.getTimers().start(ReplyTimer, 2, true); // Start the "Check for response" loop again
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
    //log("start printing choices")
    if(npc.getStoreddata().get("inDialogWith")) // Has dialog ended because the player walked away?
    {
        var options = [];
        var option = "";
        var i = 0;
        for(i = 0; i < diagOptions.length; i++)
        {
            if(diagOptions[i][RAvailability_Options](event, npc))
            {
                // If availability options section returns true then add it
                options.push([diagOptions[i][RText], diagOptions[i][RColour]]); // ["text","colour"]
            }
        }
        npc.getStoreddata().put("currentDiagResponses", JSON.stringify(options));

        for(i = 0; i < options.length; i++)
        {
            option = '/tellraw @p ["",{"text":"' + (i+1) + '. ' + options[i][0] + '","color":"' + options[i][1] + '","clickEvent":{"action":"run_command","value":"' + options[i][0] + '"}}]' //,"hoverEvent":{"action":"show_text","value":{"text":"","extra":[{"text":"[Hover Text]"}]}}}]';
            //tellraw @p ["",{"text":"[Replace Me]","color":"gold","clickEvent":{"action":"run_command","value":"[Replace Me]"},"hoverEvent":{"action":"show_text","value":{"text":"","extra":[{"text":"[Hover Text]"}]}}}]
            npc.executeCommand(option);
        }
    }
}

function timer(event)
{
    if(event.id == ReplyTimer) // Get dialog response
    {
        var response = event.npc.getStoreddata().get("dialogResponse");
        if(response)
        {
            var responses = [];
            var currentRespnseList = JSON.parse(event.npc.getStoreddata().get("currentDiagResponses"));
            for(var i = 0; i < currentRespnseList.length; i++)
            {
                responses.push(currentRespnseList[i][0]);
            }
            var responseIndex = responses.indexOf(response);
            if(responseIndex >= 0)
            {
                /*event.npc.world.broadcast("You typed a valid option and was option number " + (responseIndex + 1) + "!"); */
                event.npc.getTimers().stop(ReplyTimer);
                continueDialog(event, response);
            }
            else
            {
                event.npc.getStoreddata().put("dialogResponse", ""); // Clear garbage response so we don't keep checking it
            }
        }
        if(event.npc.getStoreddata().get("inDialogWith") != "") // This if else ends dialog if the player walks away
        {
            var player = event.npc.world.getEntity(event.npc.getStoreddata().get("inDialogWith"));
            var playerName = player.getDisplayName();
            var output = event.API.executeCommand(player.world, 'testfor @p[name='+ playerName + ',x=' + event.npc.getPos().getX() +',y=' + event.npc.getPos().getY() + ',z=' + event.npc.getPos().getZ() + ',r=5]');
            if(output.indexOf("Found " + playerName) == -1)
            {
                event.npc.getTimers().stop(ReplyTimer);
                endDialog(event.npc, player);
            }
        }
        else
        {
            event.npc.getTimers().stop(ReplyTimer);
        }
    }
    
    if(event.id == AskAboutTimer)
    {
        var response = event.npc.getStoreddata().get("dialogResponse");
        if(response)
        {
            // see if the response is in the list of topics
            var npc = event.npc;
            var topicList = JSON.parse(npc.getStoreddata().get("topicList"));
            response = response.toLowerCase();
            if(topicList.indexOf(response) >= 0)
            {
                // valid topic to ask about, find the appropriate responses
                var unfilteredTopics = dialog["AskMeAbout"]["Topics"];
                // The following are constants, do not change them unless you, and someone else you explained it to, understand what you're doing
                var triggerList = 0;
                var responsesList = 1;
                var text = 0;
                var sound = 1;
                // Counters, they are used for counting
                var trigger = 0;
                var i = 0;
                var found = false; // This one doesn't count, it does flips
                var topicNumber = 0;
                while(!found)
                {
                    // reset trigger itterative counter (That made more sense in my head)
                    trigger = 0;
                    // Itterate over the trigger list for the topic
                    while(trigger < unfilteredTopics[i][triggerList].length)
                    {
                        // Examine the trigger word/phrase
                        if(response == unfilteredTopics[i][triggerList][trigger].toLowerCase())
                        {
                            found = true;
                            topicNumber = i;
                        }
                        trigger++;
                    }
                    i++;
                }
                // Topic has been found, serve response
                var responseList = unfilteredTopics[topicNumber][responsesList]; // The possible responses to the trigger
                var chosenResponse = randInt(0, (responseList.length - 1)); // Pick one of them randomly
                npc.world.broadcast("\n\n"); // Spacing
                npc.say(responseList[chosenResponse][text]); // NPC actually says it
                npc.world.playSoundAt(npc.getPos(), responseList[chosenResponse][sound], 1.0, 1.0); // Play sound for text
                event.npc.getStoreddata().put("dialogResponse", "");
                // Print helpful exit message
                var exitHelp = '/tellraw @p ["",{"text":"[exit]","color":"red","clickEvent":{"action":"run_command","value":"[exit]"},"hoverEvent":{"action":"show_text","value":{"text":"","extra":[{"text":"Click to return to dialog"}]}}}]';
                npc.executeCommand(exitHelp);
            }
            else if(response == "[exit]")
            {
                // Player is done asking questions
                var text = 0;
                var sound = 1;

                var prevDialogList = dialog[npc.getStoreddata().get("currentResponseList")]; // Go back to previous response list
                var diagOptions = prevDialogList["diagOptions"];

                npc.world.broadcast("\n\n"); // Spacing
                npc.say(dialog["AskMeAbout"]["LeaveReply"][text]); // Say the leaving line
                npc.world.playSoundAt(npc.getPos(), dialog["AskMeAbout"]["LeaveReply"][sound], 1.0, 1.0);
                runDelay(1, function(){printChoices(npc, diagOptions, event);}); // Wait a specified time to print the options, thanks Ronan for the runDelay() function
                event.npc.getTimers().stop(AskAboutTimer);
                event.npc.getTimers().start(ReplyTimer, 2, true);
            }
            else
            {
                // NPC doesn't know about it
                // Choose random response
                var text = 0;
                var sound = 1;

                var NPCResponse = dialog["AskMeAbout"]["UnknownTopic"];
                var randomResponse = randInt(0, (NPCResponse.length -1));

                npc.world.broadcast("\n\n"); // Spacing
                npc.say(NPCResponse[randomResponse][text]); // Say the text
                npc.world.playSoundAt(npc.getPos(), NPCResponse[randomResponse][sound], 1.0, 1.0); // Play sound for text
                event.npc.getStoreddata().put("dialogResponse", "");
                // Print helpful exit message
                var exitHelp = '/tellraw @p ["",{"text":"[exit]","color":"red","clickEvent":{"action":"run_command","value":"[exit]"},"hoverEvent":{"action":"show_text","value":{"text":"","extra":[{"text":"Click to return to dialog"}]}}}]';
                npc.executeCommand(exitHelp);
            }
        }
        if(event.npc.getStoreddata().get("inDialogWith") != "") // Player walkaway checker
        {
            var player = event.npc.world.getEntity(event.npc.getStoreddata().get("inDialogWith"));
            var playerName = player.getDisplayName();
            var output = event.API.executeCommand(player.world, 'testfor @p[name='+ playerName + ',x=' + event.npc.getPos().getX() +',y=' + event.npc.getPos().getY() + ',z=' + event.npc.getPos().getZ() + ',r=5]');
            if(output.indexOf("Found " + playerName) == -1)
            {
                event.npc.getTimers().stop(AskAboutTimer);
                endDialog(event.npc, player);
            }
        }
        else
        {
            event.npc.getTimers().stop(AskAboutTimer);
        }
    }

    if(event.id == dynamicReplyListTimer)
    {
        var response = event.npc.getStoreddata().get("dialogResponse");
        if(response)
        {
            var responses = [];
            var currentRespnseList = JSON.parse(event.npc.getStoreddata().get("currentDiagResponses"));
            for(var i = 0; i < currentRespnseList.length; i++)
            {
                responses.push(currentRespnseList[i][0]);
            }
            var responseIndex = responses.indexOf(response);
            if(responseIndex >= 0)
            {
                /*event.npc.world.broadcast("You typed a valid option and was option number " + (responseIndex + 1) + "!"); */
                event.npc.getTimers().stop(dynamicReplyListTimer);
                continueDialog(event, response);
            }
            else
            {
                event.npc.getStoreddata().put("dialogResponse", ""); // Clear garbage response so we don't keep checking it
            }
        }
        if(event.npc.getStoreddata().get("inDialogWith") != "") // This if else ends dialog if the player walks away
        {
            var player = event.npc.world.getEntity(event.npc.getStoreddata().get("inDialogWith"));
            var playerName = player.getDisplayName();
            var output = event.API.executeCommand(player.world, 'testfor @p[name='+ playerName + ',x=' + event.npc.getPos().getX() +',y=' + event.npc.getPos().getY() + ',z=' + event.npc.getPos().getZ() + ',r=5]');
            if(output.indexOf("Found " + playerName) == -1)
            {
                event.npc.getTimers().stop(dynamicReplyListTimer);
                endDialog(event.npc, player);
            }
        }
        else
        {
            event.npc.getTimers().stop(dynamicReplyListTimer);
        }
    }
}

function tick(e) {
    runDelayTick();
}

function randInt(min, max) 
{   // Returns a random number
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}