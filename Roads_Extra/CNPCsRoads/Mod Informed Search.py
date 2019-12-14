import json
import math
#import copy


def mapPaths(nodes):
    toMap = list(nodes.keys())
    masterList = dict()
    for nodeToMap in toMap:
        if(len(nodes[nodeToMap]["Neighbours"]) == 0):
            print(nodes[nodeToMap]["Name"] + " has no neighbours, skipping rougue node")
            continue
        openSet = [nodeToMap] # The nodes we have reached but want to investigate, we start with the starting node
        reached = list() # Nodes that have been reached
        unReached = list(nodes.keys()) # Nodes that have not been reached (all at the start)    
        subList = dict() # Dictionary to hold values for the current node
        # Fill the sub dict with entries
        for nodeName in toMap:
            print("Adding", nodeName, "to the current sub list")
            subList[nodeName] = [math.inf, None]
        subList[nodeToMap] = [0,None] # The Starting node has a distance of 0
        print("Preparing to map paths from", nodeToMap)
        print(subList)
        current = nodeToMap # Current node is the starting node lmao
        # Find all paths

        while unReached: # While there are items in this list
            neighbours = nodes[current]["Neighbours"] # Get neighbouring nodes for the current node
            for neighbour in neighbours: # For each neighbour check the following:
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
                unReached = []

            nodeList = list(nodes.keys()) # Sanity check: print each node, how far it is from the start and the shortest path from the last node to it
            for node in nodeList:
                print(node, subList[node][0], subList[node][1])
        print("New subList:")
        print(subList)
        print("Appending", nodeToMap, "to Masterlist")
        masterList[nodeToMap] = subList
    print("Masterlist is:")
    print(masterList)
    return masterList

def reconstructPath(start, end, compiledList):
    if(start in compiledList.keys()):
        # Begin reconstructing the path
        # Get the previous node from the "end" node
        lastNode = compiledList[start][end][1] # Grab the last node from the ending node
        if(lastNode):
            ShortestPath = [] # build the path in reverse here
            while lastNode:
                #print("Last Node is:", lastNode)
                ShortestPath.append(lastNode)
                lastNode = compiledList[start][lastNode][1]
            #print(ShortestPath)
            ShortestPath.reverse() # The path is backwards, fix it
            ShortestPath.append(end) # It looks silly without the end node
            #print(ShortestPath)
            print("Shortest path from", start, "to", end, "is:", ShortestPath)
        else:
            print(end + " Cannot be reached from " + start)
            ShortestPath = None
    else:
        print(start + " has no neighbours (nodes to travel to)")
        ShortestPath = None
    return ShortestPath
        # [name,[x,y,z],[neighbours], distance, [vertex list]]
#nodes = [[1,[5,3,4],[2,3,4],0], [2,[3,6,7],[1,4],0]]

def main():
    nodes = dict()
    paths = dict()

    #paths = mapPaths(nodes)
    while True:
        ans = input("What do you want to do? (R) Read nodes from file, (M) Map Nodes, (F) Find shortest path, (L) List Nodes, (X) Exit\n> ").upper()

        if ans == "R":
            try:
                print("Reading from nodeRegistry.json")
                f = open("nodeRegistry.json", "r")
                nodes = json.load(f)
                f.close
                del f
            except FileNotFoundError:
                f = open("nodeRegistry.json", "w")
                json.dump(nodes, f)
                f.close()
                del f
            except json.decoder.JSONDecodeError:
                print("Bad JSON in nodeRegistry file!\n Erase?")
                input("Y/N? > ")

            try:
                print("Reading from paths.json")
                f = open("paths.json", "r")
                paths = json.load(f)
                f.close
                del f
            except FileNotFoundError:
                f = open("paths.json", "w")
                json.dump(paths, f)
                f.close()
                del f
            except json.decoder.JSONDecodeError:
                print("Bad JSON in paths file!\n Erase?")
                input("Y/N? > ")
            print("Done!")


        elif ans == "M":
            if nodes:
                paths = mapPaths(nodes)
                f = open("paths.json", "w")
                json.dump(paths, f)
                f.close
                del f
                print("Done!")
            else:
                print("Nodes haven't been read in!")
        
        elif ans == "F":
            if paths:
                start = ""
                end = ""
                while start == "":
                    start = input("Please enter a starting node: ")
                    if start not in nodes.keys(): # If invalid input assume the user wants to exit
                        print(start, "is not in Node list!")
                        start = ""
                        
                while end == "":
                    end = input("Please choose an ending node: ")
                    if end not in nodes.keys(): # If invalid input assume the user wants to exit
                        print(end, "is not in Node list!")
                        end = ""
            #passing = copy.deepcopy(nodes) # Need to give a complete copy of nodes rather than a pointer to nodes
                reconstructPath(start, end, paths)
            else:
                print("Nodes have not been mapped!")
        elif ans == "L":
            if nodes:
                print(nodes.keys())
                print("Done!")
            else:
                print("Nodes have not been read in!")
        
        elif ans == "X":
            print("Bye!")
            break
        
        else:
            print("Invalid command!")
            

main()