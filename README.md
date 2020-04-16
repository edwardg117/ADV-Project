# ADV-Project
A repository to house the scripts and others for the ADV Project

This is the collection of Custom NPCs scripts and other files being used in the ADV Project.
## Completed Files
These files have no more features planned and will only be updated for bugfixes.
- Journeymap Waypoint Handler/Manager
## Working Files
These files are not feature complete but have working features that can be used. These will be updated as they are worked on, listed order is not by priority.
- Pickable Doors

	This is a modification of a vanilla pickable doors I made that uses the two skills (lockpick and luck) to determine a successfull attempt.
	
	Planed:
	- Interactions with NPCs
	- Extend to chests as well
	- Only init once and not re-lock themselves when re-loaded (this was my first ever script so it doesn't take things into account)
- Summonable Horse

	Requires commandblock logic atm
	
	Planned:
	- Remove dependence on commandblocks
	- Easier install
	- Better random teleport of horse
- Roads
	
	Allows for the creation of road networks that NPCs will use to travel from location to location. This is really a visual thing but I think it looks better when NPCs actually travel along the roads. 
	Also it enables traveling greater distances than would be possible otherwise.
	
	Currently there's only 1 type of node and you have to input all information into each one manually which can be a pain/time consuming. [Current version in action](https://youtu.be/kMauBoDGFyk)
	
	Planned:
	- 4 Types of node
		1. Start/End        (Location/arrival)
		2. Nav              (Between start and end nodes)
		3. Greater Nav      (Between two cities)
		4. City Entry/Exit  (Marks arrivial/departure from a city)
		5. Decision Node    (Also could be called "itersection node", directs the NPC down the correct road and corrects the path if the NPC went the wrong way)
	- More intuative method for learning neighbours (who is next in line and previous if backtracking enabled)
	- Where it is, ie. in a City or between two Cities
	- Ensure that the block can only be destroyed by a player in creative mode and no other means
	- Remove dependency on Jsonified by Baito (it works great but I know how to use files now)
- Player like inventories for NPCs

	Adds a player-like inventory to the NPC, using files while I figure some things out
	
	Planned:
	- Use Storeddata for storing the inventory instead of a files
	- Function to see if an item is in the NPC's inventory, rather than returning a list of items
	- Function to remove and item from an NPC
	- Properly implement a way to have a default or random inventory on init, it's bare bones atm
- Alternate dialog using chat window

	Uses the Minecraft chat to have a conversation with an NPC. Based around responses to dialogs. Supports playing audio from a resource pack with dialog. 
	Allows running a custom script for every dialog option and using scripts to determine if the option is available.
	
	You can have as many dialog options as you want (provided it's less than the ammount of lines the chat window can store at once). 
	Also supports a Fallout style "Tell Me About" with miltiple triggers for each subject (called Topics in files), random responses for keywords and random responses for unknown subjects. (All allow audio)
	
	Planned:
	- Pre-made animations / poses to play when option is chosen or halfway through the NPC dialog (Using Mo Bends 1.0.0)
	- Build in NPC dialog in sentances rather than all at once
	- Custom hover text on reponses
	- End dialog if player walks away but continue from where the left off
- Companions (hirable and firable) <- uses alternate dialog

	Depends on Alternate Dialog, allows the player to recruit an NPC companion. Can use Inventories if you include it in the dialog script.
	
	Planned:
	- Propperly support companions leveling updated
	- Implement a player oppinion score to keep track of if they like/dislike the player and have them leave if it's too low
	- Record what the NPC's job is and re-set it after dismissing companion, rather than forcing the NPC to be a follower
- Lootable Bodies
	
	NPCs drop a lootable body on death that looks like they do and takes a random death pose from file. Can inherrit the inventory of the NPC if you want it to. Body will despawn after configured time.
	
	Planned:
	- More death poses
	- Option to randomly populate inventory using a loot table
	- Remove dependency on RunDelay by Ronan (Works great but the body doesn't count down while it's unloaded. Going to change to checking the total world time at init, will also stop running things in tick)
- Cities Block

	Uses Journeymap Waypoint Handler/Manager to automatically add waypoints to players who get close enough and play a sound. Still early stages but it can change the waypoint colour depending on the player's faction rep.
	
	Planned:
	- Register the city
	- Auto update colour based on player standing (possibly the block won't do it but places where it updates the players rep will)
	- Be useful for other things like roads and NPC AI
	
### Planned Files
These files either don't exist or don't have working versions. If they are uploaded you should wearily use them as a reference and never run them.
- Player leveling up system

	A way to manage the player leveling up and assigning skills and perks. Plan was 1 skill per level and 1 perk every 5 levels. Things from my half-working vanilla system:
	
	Skills:
	Awearness - Makes points of intrest easier to notice
	Charisma - Affects conversations
	Lockpick - The player's lockpicking skill
	Luck - How lucky the player is
	Rejuvenation - How quickly the player regains health
	Smithing - Level of craftable weapons, quality of crafted weapons, repair cost and speed
	Stealth - Detection range and sneak speed
	Survival - Environmental resistance, hunger decay, health bonuses, quality of food crafted

	Perks:
	Agillity - Faster movement, maybe faster attack speed
	Cephalopod - 3 extra hearts (max ranks 3) req: Rejuvination 3
	Necromancer - when your health drops to 2 hearts you can steal life from enemies
	Sensing - sense mobs through walls while standing still crouched	req: 7 awearness
	Smooth Criminal - Invisible while sneaking	req: 7 Stealth
	Strength - Higher attack damage
	Toughness - Incomming damage reduction
	Necrosis (Zombie Friends)
	Arachnophilia (Spider Friends)
	Ostiophobia (Skeleton Friends)


- Hardcore needs
	
	The player needs to eat(drink?), sleep and wear climate suitable clothing in order to survive; with increasingly negative effects as these are ignored. 
	I have started this one but barely, it can only tell when a player last slept and if they are going to overheat or freeze to death
	
	Planned:
	- Player must sleep at nights else they become tired and will die after not sleeping for a week
	- Player must keep food level above half or they will become hungry, same death applies as in normal Minecraft
	- Player must wear warm clothing in cold biomes and high altitudes and cool clothing in hot biomes, increasingly negative effects until death from hypothermia and hyperthemia respectively
	
- Barter System

	Using inventories window to buy/sell items with value that changes depending on the item, the item's quality(durability, enchants, etc) and player barter skill
	
	Planned:
	- Barter menu with multiple pages
	- Navigation menu in the inventory window (most likely the top row): Prev Page, Exit, Next Page
	- Player can sell items to a vendor and it will be added to the vendor's inventory
	
- Traders that use the barter system

	See Barter system

- Scripted events block
	
	A scripted block that can be used to start scripted events
	
	Planned:
	- An event unique to the block
	
- Better Player reputation system

	NPCs interact with the player differently depending on the player's reputation with the faction/town's 
	
	Planned:
	- Interact lines change based on player reputation
	- Vendor prices affected by player reputation
	- Companion interactions affected by player reputation
	- 
	
- Alive NPC AI

	Use all available systems to make the NPCs act more natually
	
	Planned:
	- NPCs need food and eat from their inventory at certian times and seek food if they have none
	- NPCs travel from home to work each day or to some leasure activity
	- Loitering NPCs
	- NPCs perform their jobs visually (Mo Bends will be useful for this)
	- NPCs Combat:
		- NPCs search bodies for weapons and ammunition
		- Ranged units have limited ammunition and change to melee when out or search for ammuntion on bodies
		- NPCs cordinate efforts, leaders could be assigned and control other units. When a leader dies it's units may panic or flee
	- NPCs have conversations with eachother
	- NPCs use the services provided by other NPCs (resteraunt can sell food, blacksmith repair weapons etc)
	
	
- Random encounters block

	Used for starting random encounters

	Planned:
	- More favourable events for higher karma players
	- More hostile events for lower karma players
	- Many types of encounters
	
- Faction armor
	
	Change player reputation for factions if they are wearing their armor or their enemies' armor.
	
	Planned:
	- Wearing the armor of a faction hostile to them will cause them to be hostile
	- Wearing their faction armor will cause them to not be hostile (unless seen by a senior officer or some high ranking who will see through the disguise)
	
- Regenerating plantlife
	
	Plants that can be picked by the player and re-generate food over time. E.g. A berry bush that the player can pick the berries from.
	
# Wiki
The wiki is getting progressivly more out of date as time goes on. I plan to fix this after semester ends.