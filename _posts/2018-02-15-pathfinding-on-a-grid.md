---
layout: post
title: "Pathfinding on a Grid"
date: 2018-02-15 21:43:00 +1000
categories: gamedev roguelikes algorithms
---

In this post I describe how to achieve sensible pathfinding of multiple
agents in a turn-based, grid-based setting. For simplicity, I'll make the
following assumptions:

 - there is a single player
 - the goal of each NPC is to become adjacent to the player
 - NPCs can't move through one another or the player
 - on their turn, the player, and each NPC can move 1 or 0 squares in a cardinal direction
 - the map is a 2d grid of squares, each of which is permanently either
   traversable or non-traversable
 - the cost of moving between a pair of adjacent squares is 1 (ie. the grid is
   uniform)

The approach I describe won't rely too heavily on any of these assumptions.
I'm stating them here so as to remove any ambiguity in explanations.
Generalising the pathfinding technique to rely on fewer assumptions is left as
an exercise to the reader.

I'll first present a simple approach that gets us quite close to the desired
result, then repeatedly demonstrate problematic cases, and improvements to the
approach.

A note on diagrams: The player will be denoted with a `@`. Each NPC will be
referred to with a letter. White cells are traversable. Grey cells are
non-traversable.

## Initial Approach: Follow a Dijkstra Map

The first approach will be to generate a map which stores, for each cell, the
distance from that cell to the player. These distances are shown as the numbers
in the top-left corner of each traversable cell in the diagram below.
The data structure storing these distances (generally a 2d array of integers) is
sometimes called a "Dijkstra Map".
[Here](http://www.roguebasin.com/index.php?title=The_Incredible_Power_of_Dijkstra_Maps)
is an article elaborating on dijkstra maps.

![](/images/pathfinding-on-a-grid/a.png)

A benefit of using a dijkstra map, rather than searching for a path for each NPC,
is that the dijkstra map only needs to be generated each time the player moves.
To determine which way an NPC should move, we need only consider the neighbours
of that NPC's cell in the dijkstra map, moving the NPC into the neighbouring
cell which is closest to the player.

![](/images/pathfinding-on-a-grid/b.png)

Note that `Y` chose arbitrarily between 2 cells equidistant from the player.

## Gaps forming between NPCs

Here's the first problem with the current approach. Consider the following
arrangement:

![](/images/pathfinding-on-a-grid/c.png)

When `X` moves:

![](/images/pathfinding-on-a-grid/d.png)

And then `Y` moves:

![](/images/pathfinding-on-a-grid/e.png)

Everything seems fine, but what if `Y` had moved first? Since NPCs can't move
through each other, the best choice for `Y` is to stay where it is, as any
single legal move would only increase its distance from the player. On `X`'s
turn, `X` would still move towards the player, creating a gap between `X` and
`Y`, which is not ideal.

To prevent gaps from forming, we need to make sure that
NPCs move in increasing order of their distance to the player. Since we generate
a dijkstra map, it's easy to determine how far each NPC is from the player.
Simply sorting NPCs by the value of their cell in the dijkstra map is enough to
produce a turn order which avoids this problem.

## Getting stuck behind NPCs

The next problem occurs when NPCs are very close to the player. In the previous
scenario, we ended up with `X` adjacent to the player, and `Y` right behind `X`.
On `X`'s next turn, it will remain next to the player - there's nothing it can
do to get closer to the player, so no need to move (in a typical roguelike it
would probably attack the player at this point). But what does `Y` do? It's
clear from looking at the map that it should move north, but according to the
dijkstra map that would take it further from the player.

In cases where no improvements can be made to an NPC's position based on the
dijkstra map, we must search for the shortest path from the NPC to the player,
**treating NPCs as non-traversable cells**, and take the first step along this
path.

![](/images/pathfinding-on-a-grid/f.png)

The remainder of the optimal path from `Y` to the player is shown in red. Note
however, that now that `Y` has "stepped around" `X`'s ok to resume following the
dijktra map. Thus, pathfinding can be stateless: we don't need to keep track of
the fact that `Y` has searched for a path. On its next turn it can try moving
based on the dijkstra map. If this doesn't produce a move, then fall back to
searching.

## Briefly taking the long way around

![](/images/pathfinding-on-a-grid/g.png)
