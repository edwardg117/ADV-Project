# Road Mapper for Roads.js by edwardg
# Version 2
Version = 2
# This script is designed to work with Node Registry V2 only
CompatableRegistryVer = [2]
RegistryFile = r"Node Registry Exmaple v2.json"
PathsFile = r"Mapped Paths.json"
# There is so much spaghetti here that it's going to take too long to clean up atm, as long as it works it's going to stay.
# Code below
import json
import math

def main():
    registry = dict()
    paths = {"Info":{"Version":Version},"Paths":{},"WorldPaths":{},"interCityTravel":{},"locationToCity":{},"CityGates":{}}
    initSuccess = True
    try:
        print("Reading from " + RegistryFile)
        f = open(RegistryFile, "r")
        registry = json.load(f)
        f.close
        del f
        if(registry["Info"]["Version"] in CompatableRegistryVer):
            print("Node Registry File OK")
        else:
            print("Node Registry is a version not recognised by this script, this could cause problems!")
            print("Accepted versions: " + str(CompatableRegistryVer))
    except FileNotFoundError:
        print(RegistryFile + " not found! Please use the road creation tool to create nodes!")
        initSuccess = False
    except json.decoder.JSONDecodeError:
        print("Bad JSON in file "  + RegistryFile)
        initSuccess = False

    try:
        print("Reading from " + PathsFile)
        f = open(PathsFile, "r")
        paths = json.load(f)
        f.close
        del f
    except FileNotFoundError:
        f = open(PathsFile, "w")
        json.dump(paths, f)
        f.close()
        del f
    except json.decoder.JSONDecodeError:
        print("Bad JSON in paths file!\n Erasing")
        f = open(PathsFile, "w")
        json.dump(paths, f)
        f.close()
        del f

    if(initSuccess):
        while(True):
            ans = input("What do you want to do?\n(M) Map paths, (F) Find shortest path, (L) List nodes, (X) Exit\n> ").upper()

            if(ans == "M"):
                desiredOperation = input("What do you want to map?\n(C) City, (W) World or (A) All\n> ").upper()
                if(desiredOperation == "C"):
                    print("Which City do you want to map?")
                    cityList = list(registry["Cities"].keys())
                    cityList.pop(cityList.index("World")) # Remove world from the list because it has to be handled differently
                    print(cityList)
                    city = input("> ")
                    if(city in cityList):
                        mappedCity = mapCity(registry, city)
                        if(mappedCity): # If we get a return
                            paths["Paths"][city] = mappedCity
                            paths["CityGates"] = {**paths["CityGates"],**getCityGates(registry, city)}
                            f = open(PathsFile, "w")
                            json.dump(paths, f)
                            f.close()
                            del f
                    else:
                        print("City '" + city + "' is not in the list! Check spelling and try again.\n")
                elif(desiredOperation == "W"):
                    print("Mapping World, step 1/3")
                    paths["WorldPaths"] = mapWorld(registry, paths)
                    print("World Paths mapped. Determining fastest way between Cities, step 2/3") # DONE Function to map between cities
                    paths["interCityTravel"] = interCityMapper(registry, paths)
                    print("Fastest path between each City found! Determining how to travel between world Locations and Cities, step 3/3") # DONE function to map World locations
                    paths["locationToCity"] = locationToCityMapper(registry, paths)
                    f = open(PathsFile, "w")
                    json.dump(paths, f)
                    f.close()
                    del f
                elif(desiredOperation == "A"):
                    print("Mapping All")
                    paths = {"Info":{"Version":Version},"Paths":{},"WorldPaths":{},"interCityTravel":{},"locationToCity":{},"CityGates":{}}
                    print("Mapping World, step 1/3")
                    paths["WorldPaths"] = mapWorld(registry, paths)
                    print("World Paths mapped. Determining fastest way between Cities, step 2/3") # DONE Function to map between cities
                    paths["interCityTravel"] = interCityMapper(registry, paths)
                    print("Fastest path between each City found! Determining how to travel between world Locations and Cities, step 3/3") # DONE function to map World locations
                    paths["locationToCity"] = locationToCityMapper(registry, paths)
                    f = open(PathsFile, "w")
                    json.dump(paths, f)
                    f.close()
                    del f
            elif(ans == "F"):
                startCity = input("What City is the Starting Location in?\n> ")
                if(startCity == ""):
                    startCity = "World"
                startLocation = input("What is the Starting Location?\n> ")
                endCity = input("What City is the Ending Location in?\n> ")
                if(endCity == ""):
                    endCity = "World"
                endLocation = input("What is the Ending Location?\n> ")
                print("Fastest way from " + startLocation + " (" + startCity + ") to " + endLocation + " (" + endCity + ") is:")
                print(reconstructPaths(paths, startCity, startLocation, endCity, endLocation))
            elif(ans == "L"):
                allCities = registry["Cities"].keys()
                for city in allCities:
                    print("Locations in '" + city + "':")
                    print(list(registry["Cities"][city]["Locations"].keys()))
            elif(ans == "X"):
                print("Bye!")
                break
            else:
                print("\n###Invalid command!###")
    else:
        print("One or more problems occurred while reading from " + RegistryFile + " and " + PathsFile + " that has prevented this script from running, exiting!")
        input("Press Enter to exit...")

def getCityGates(Registry, City):
    """Gets a list of the Gates for the City"""
    Gates = list(Registry["Cities"][City]["Gates"].keys())
    GatesDict = {}
    for gate in Gates:
        GatesDict[gate] = City
    return GatesDict


def mapCity(Registry, City):
    """Maps a single City
    Registy: A copy of the Node Registry
    
    City: String name of the City to map"""
    cityPaths = {} # Paths internally in the city
    if(City in list(Registry["Cities"].keys())):
        # City has nodes, find Locations and Gates
        Locations = Registry["Cities"][City]["Locations"]
        Gates = Registry["Cities"][City]["Gates"] 

        toMap = {**Locations, **Gates} # Things to map paths from and to
        allNodes = {**toMap, **Registry["Nodes"]}
        iterations = 0
        totalNodes = len(toMap)
        for nodeToMap in toMap:
            if(len(toMap[nodeToMap]["Neighbours"]) == 0):
                print(toMap[nodeToMap]["Name"] + " has no neighbours, skipping rouge node")
                continue
            openSet = [nodeToMap] # The nodes we have reached but want to investigate, we start with the starting node
            reached = list() # Nodes that have been reached
            unReached = list(allNodes.keys()) # Nodes that have not been reached (all at the start)    
            subList = dict() # Dictionary to hold values for the current node
            # Fill the sub dict with entries
            for nodeName in allNodes:
                #print("Adding", nodeName, "to the current sub list")
                subList[nodeName] = [math.inf, None]
            subList[nodeToMap] = [0,None] # The Starting node has a distance of 0
            iterations += 1
            print("Preparing to map paths from", nodeToMap, "(" + str(iterations) + "/" + str(totalNodes) + ")")
            #print(subList)
            current = nodeToMap # Current node is the starting node lmao
            # Find all paths

            while unReached: # While there are items in this list
                neighbours = allNodes[current]["Neighbours"] # Get neighbouring nodes for the current node
                for neighbour in neighbours: # For each neighbour check the following:
                    if("Type" in list(allNodes[current].keys())): # If this is a gate
                        if(allNodes[current]["Type"] == "Entry"): # If this is an entry gate proceed, if not then skip
                            if (subList[current][0] + neighbour[1]) < subList[neighbour[0]][0]: # If the node has a faster route than it currently knows change it
                                subList[neighbour[0]][0] = subList[current][0] + neighbour[1] # Distance of previous node + the weight to travel between them
                                subList[neighbour[0]][1] = current # Add new shortest path as last node
                            if(neighbour[0] not in reached and neighbour[0] not in openSet): # If this node is new and not ready to investigate make it
                                openSet.append(neighbour[0])
                    else: # Not a gate, treat it normally
                        if (subList[current][0] + neighbour[1]) < subList[neighbour[0]][0]: # If the node has a faster route than it currently knows change it
                            subList[neighbour[0]][0] = subList[current][0] + neighbour[1] # Distance of previous node + the weight to travel between them
                            subList[neighbour[0]][1] = current # Add new shortest path as last node
                        if(neighbour[0] not in reached and neighbour[0] not in openSet): # If this node is new and not ready to investigate make it
                            openSet.append(neighbour[0])
                
                unReached.pop(unReached.index(current)) # Remove the un-reached list
                reached.append(current) # Add it to the "Been there done that" list
                openSet.pop(openSet.index(current)) # Remove the current node from investigation list
                # If we still have things to look at, set the one with the shortest path to be looked at
                if openSet:
                    #current = openSet[0]
                    # Find shortest path
                    newCurrent = openSet[0] # Pick the first one as a starting point
                    for node in openSet:
                        if subList[newCurrent][1] > subList[node][1]: # If a node has a smaller weight than the node being considered, make it the new considerd node
                            newCurrent = node
                    current = newCurrent # Once found the shortest path, set it to be investigated
                #print("OpenSet: " + str(openSet))
                else:
                    print("## Skipping " + str(unReached) + " as node/s are unreachable")
                    for unreachable in unReached: # Remove unreachables from the data
                        subList.pop(unreachable)
                    unReached = []

            cityPaths[nodeToMap] = subList

    else:
        print("[Error!] City '" + City + "' is not in Registry! Check spelling and try again.")
        cityPaths = False
    
    #print("cityPaths is:")
    #print(cityPaths)
    return cityPaths

def mapWorld(Registry, Paths):
    """Maps the world, City to City and World locations.

    Registry: A copy of the Node Registry"""
    worldPaths = {}
    # Get Locations from World
    locations = Registry["Cities"]["World"]["Locations"]
    # Compile a list of all Gates from every City
    allGates = dict()
    #for cityName in Registry["Cities"].keys():
        #allGates = {**allGates, **Registry["Cities"][cityName]["Gates"]}
    # Remove neigbours from Entry Gates and replace them with all Exit gates with weights
    # This will also require mapping the city if it has not already been mapped
    # The reason for doing this is to simulate travelling through the city, but we don't need to know how to travel through the City because they are mapped separately
    # So: G1->n23->n24->n25....->n73->G2 becomes G1->G2 because the first bit is already stored in the City map
    for cityName in Registry["Cities"].keys():
        # Check if it's been mapped
        if(cityName not in Paths["Paths"].keys() and cityName != "World"):
            print("#### Need to map: " + cityName)
            justMapped = mapCity(Registry, cityName) # Map the City
            if(justMapped): # If we get a return, apply the newly mapped City
                Paths["Paths"][cityName] = justMapped
                Paths["CityGates"] = {**Paths["CityGates"],**getCityGates(Registry, cityName)}
                f = open(PathsFile, "w")
                json.dump(Paths, f)
                f.close()
                del f
            else:
                print("[Warning!] Something went wrong, '" + cityName + "' needed to be mapped but mapping failed! Skipping...")
                continue # Don't keep going, move on

        city = Registry["Cities"][cityName]
        gates = city["Gates"]
        # Sort gates into Entry and Exits as we need to modify the Entry Gates only
        entryGateList = list()
        exitGateList = list()
        for gate in gates.keys():
            if(gates[gate]["Type"] == "Entry"):
                entryGateList.append(gate)
            else:
                exitGateList.append(gate)
        # Apply changes to Entry Gates
        for entryGate in entryGateList:
            gates[entryGate]["Neighbours"] = []
            for exitGate in exitGateList:
                gates[entryGate]["Neighbours"].append([exitGate,Paths["Paths"][cityName][entryGate][exitGate][0]]) # appends [exit gate, weight]
        # We now have all the gates in the City point to eachother instead of the nodes between them
        allGates = {**allGates, **gates}
    
    nodes = Registry["Nodes"]

    # Combine into toMap dict and allNodes dict
    toMap = {**locations, **allGates}
    allNodes = {**toMap, **nodes}

    iterations = 0
    totalNodes = len(toMap)
    for nodeToMap in toMap:
            if(len(toMap[nodeToMap]["Neighbours"]) == 0):
                print(toMap[nodeToMap]["Name"] + " has no neighbours, skipping rouge node")
                continue
            openSet = [nodeToMap] # The nodes we have reached but want to investigate, we start with the starting node
            reached = list() # Nodes that have been reached
            unReached = list(allNodes.keys()) # Nodes that have not been reached (all at the start)    
            subList = dict() # Dictionary to hold values for the current node
            # Fill the sub dict with entries
            for nodeName in allNodes:
                #print("Adding", nodeName, "to the current sub list")
                subList[nodeName] = [math.inf, None]
            subList[nodeToMap] = [0,None] # The Starting node has a distance of 0
            iterations += 1
            print("Preparing to map paths from", nodeToMap, "(" + str(iterations) + "/" + str(totalNodes) + ")")
            #print(subList)
            current = nodeToMap # Current node is the starting node lmao
            # Find all paths

            while unReached: # While there are items in this list
                neighbours = allNodes[current]["Neighbours"] # Get neighbouring nodes for the current node
                for neighbour in neighbours: # For each neighbour check the following:
                    if(False): # If this is a gate "Type" in list(allNodes[current].keys())
                        if(allNodes[current]["Type"] == "Entry"): # If this is an entry gate proceed, if not then skip
                            if (subList[current][0] + neighbour[1]) < subList[neighbour[0]][0]: # If the node has a faster route than it currently knows change it
                                subList[neighbour[0]][0] = subList[current][0] + neighbour[1] # Distance of previous node + the weight to travel between them
                                subList[neighbour[0]][1] = current # Add new shortest path as last node
                            if(neighbour[0] not in reached and neighbour[0] not in openSet): # If this node is new and not ready to investigate make it
                                openSet.append(neighbour[0])
                    else: # Not a gate, treat it normally
                        if (subList[current][0] + neighbour[1]) < subList[neighbour[0]][0]: # If the node has a faster route than it currently knows change it
                            subList[neighbour[0]][0] = subList[current][0] + neighbour[1] # Distance of previous node + the weight to travel between them
                            subList[neighbour[0]][1] = current # Add new shortest path as last node
                        if(neighbour[0] not in reached and neighbour[0] not in openSet): # If this node is new and not ready to investigate make it
                            openSet.append(neighbour[0])
                
                unReached.pop(unReached.index(current)) # Remove the un-reached list
                reached.append(current) # Add it to the "Been there done that" list
                openSet.pop(openSet.index(current)) # Remove the current node from investigation list
                # If we still have things to look at, set the one with the shortest path to be looked at
                if openSet:
                    #current = openSet[0]
                    # Find shortest path
                    newCurrent = openSet[0] # Pick the first one as a starting point
                    for node in openSet:
                        if subList[newCurrent][1] > subList[node][1]: # If a node has a smaller weight than the node being considered, make it the new considerd node
                            newCurrent = node
                    current = newCurrent # Once found the shortest path, set it to be investigated
                #print("OpenSet: " + str(openSet))
                else:
                    print("## Skipping " + str(unReached) + " as node/s are unreachable")
                    for unreachable in unReached: # Remove unreachables from the data
                        subList.pop(unreachable)
                    unReached = []

            worldPaths[nodeToMap] = subList
    
    #print("worldPaths is:")
    #print(worldPaths)
    return worldPaths

def interCityMapper(Registry,  Paths):
    """
    Determines the fastest way to travel between Cities
    """
    interCityTravel = {}
    cityList = list(Registry["Cities"].keys())
    cityList.pop(cityList.index("World")) # Remove world from the list because we don't want to know how to get there

    for city in cityList: # Find shortest path to other cities
        destinations = list(Registry["Cities"].keys())
        destinations.pop(destinations.index(city)) # We don't want to go to the starting City
        destinations.pop(destinations.index("World"))
        subList = {}
        # Gather a list of all Exit Gates for the current City
        gates = Registry["Cities"][city]["Gates"]
        exitGateList = list()
        for gate in gates.keys():
            if(gates[gate]["Type"] == "Exit"):
                exitGateList.append(gate)
        # Now for every other City, determine which Entry gate is closest
        for destination in destinations:
            # Get all the Entry Gates
            destGates = Registry["Cities"][destination]["Gates"]
            entryGateList = list()
            for destGate in destGates.keys():
                if(destGates[destGate]["Type"] == "Entry"):
                    entryGateList.append(destGate)
            
            fastestRoute = [exitGateList[0], entryGateList[0]]
            for exitGate in exitGateList:
                for entryGate in entryGateList:
                    if(Paths["WorldPaths"][exitGate][entryGate][0] < Paths["WorldPaths"][fastestRoute[0]][fastestRoute[1]][0]):
                        fastestRoute = [exitGate, entryGate]
            #print("Fastest Route from '" + city + "' to '" + destination + "' is: " + str(fastestRoute))
            
            subList[destination] = {"Entry":fastestRoute[1],"Exit":fastestRoute[0]}
        interCityTravel[city] = subList
    #print(interCityTravel)
    return interCityTravel

def locationToCityMapper(Registry, Paths):
    """
    Determines which Entry/Exit to use when travelling to and from a City when navigating to or from a World Location
    """
    locationToCity = {}
    # Get World Locations
    locations = Registry["Cities"]["World"]["Locations"].keys()

    # Get all Cities
    cityList = list(Registry["Cities"].keys())
    cityList.pop(cityList.index("World")) # Remove world from the list because we don't want to know how to get there

    # For all locations: Determine the closest Entry and Exit Gates for all Cities
    for location in locations:
        subList = {}
        for city in cityList:
            # Compile lists of Gates
            gates = Registry["Cities"][city]["Gates"]
            entryGateList = list()
            exitGateList = list()
            for gate in gates.keys():
                if(gates[gate]["Type"] == "Entry"):
                    entryGateList.append(gate)
                else:
                    exitGateList.append(gate)
            # Find the closest Entry for the City
            closestEntryGate = entryGateList[0]
            for entryGate in entryGateList:
                if(Paths["WorldPaths"][location][entryGate][0] < Paths["WorldPaths"][location][closestEntryGate][0]):
                    closestEntryGate = entryGate
            # Find the closest Exit for the City
            closestExitGate = exitGateList[0]
            for exitGate in exitGateList:
                if(Paths["WorldPaths"][location][exitGate][0] < Paths["WorldPaths"][location][closestExitGate][0]):
                    closestExitGate = exitGate
            subList[city] = {"Entry":closestEntryGate,"Exit":closestExitGate}
            #print("Fastest way to " + location + " from " + city + " is " + closestExitGate)
            #print("Fastest way to " + city + " from " + location + " is " + closestEntryGate + "\n")
        locationToCity[location] = subList
    #print(locationToCity)
    return locationToCity
            
def reconstructPaths(Paths, StartCity, StartLocation, EndCity, EndLocation):
    """
    Reconstructs the path from Start to End
    """
    AllCityNames = Paths["Paths"].keys()
    # FIXME this is terrible, doesn't even check world
    if(StartCity not in AllCityNames and StartCity != "World"):
        print("[Error!] '" + StartCity + "' has not been mapped!")
        return False
    elif(StartCity == "World"):
        pass
    elif(StartLocation not in Paths["Paths"][StartCity].keys()):
        print("[Error!] '" + StartLocation + "' is not in '" + StartCity + "'!")
        return False
    if(EndCity not in AllCityNames and EndCity != "World"):
        print("[Error!] '" + EndCity + "' has not been mapped!")
        return False
    elif(EndCity == "World"):
        pass
    elif(EndLocation not in Paths["Paths"][EndCity].keys()):
        print("[Error!] '" + EndLocation + "' is not in '" + EndCity + "'!")
        return False
    # TODO Check to see if End node is reachable from the Start
    # For same City just see if End is a key
    # For inter-city, check the interCityTravel
    # For City-world Location, check locationToCity
    shortestPath = [EndLocation] # The path is built in reverse order here
    if(StartCity == EndCity and StartCity != "World"): # DONE!
        # Mapping a single City, nothing special to do
        prevNode = Paths["Paths"][EndCity][StartLocation][EndLocation][1] # get the previous node
        while prevNode:
            shortestPath.append(prevNode)
            prevNode = Paths["Paths"][EndCity][StartLocation][prevNode][1] # constantly get the previous node
        #shortestPath.reverse()
    else:
        # Navigating through the World
        # Step 1: Get to the World from the End
        if(EndCity == "World"):
            # Already in the World, no action needed
            prevNode = EndLocation
        else:
            # End in City, construct to Entry Gate
            if(StartCity == "World"):
                entryGate = Paths["locationToCity"][StartLocation][EndCity]["Entry"]
            else:
                entryGate = Paths["interCityTravel"][StartCity][EndCity]["Entry"]
            city = EndCity
            # Reconstruct
            prevNode = Paths["Paths"][city][entryGate][EndLocation][1]
            while prevNode:
                shortestPath.append(prevNode)
                prevNode = Paths["Paths"][city][entryGate][prevNode][1]
            prevNode = entryGate
        # Now in the world
        # Step 2: Construct through the world
        if(StartCity == "World"):
            # Start location is in the World, don't need to find a Gate
            navFrom = StartLocation
        else:
            # Start is in a City, find the Exit Gate
            if(EndCity == "World"):
                navFrom = Paths["locationToCity"][EndLocation][StartCity]["Exit"]
            else:
                navFrom = Paths["interCityTravel"][StartCity][EndCity]["Exit"]
        # Reconstruct
        prevNode = Paths["WorldPaths"][navFrom][prevNode][1]
        while prevNode:
            if(prevNode[0] == "G" and Paths["WorldPaths"][navFrom][prevNode][1]): # Is the node a Gate and is there another gate after it?
                # Yes, passing through a City. Which City?
                city = Paths["CityGates"][prevNode]
                exitGate = prevNode
                entryGate = Paths["WorldPaths"][navFrom][prevNode][1]
                # Reconstruct paht through City
                shortestPath.append(prevNode)
                prevNode = Paths["Paths"][city][entryGate][exitGate][1]
                while prevNode:
                    shortestPath.append(prevNode)
                    prevNode = Paths["Paths"][city][entryGate][prevNode][1]
                prevNode = Paths["WorldPaths"][navFrom][entryGate][1]
            else:
                shortestPath.append(prevNode)
                prevNode = Paths["WorldPaths"][navFrom][prevNode][1]
        # Now at StartLocation or StartCity
        # Step 3: Finish construction and reverse list
        if(StartCity != "World"):
            # Need to construct from Exit Gate for Start City (navFrom) to StartLocation
            city = Paths["CityGates"][navFrom]
            prevNode = Paths["Paths"][city][StartLocation][navFrom][1]
            while prevNode:
                shortestPath.append(prevNode)
                prevNode = Paths["Paths"][city][StartLocation][prevNode][1]

    shortestPath.reverse()
    return shortestPath

main()