---
layout: post
title: "Pathfinding on a Grid"
date: 2018-02-15 21:43:00 +1000
categories: gamedev roguelikes algorithms
---

In this post I describe how to achieve sensible pathfinding of multiple
NPCs in a turn-based, grid-based setting.
When multiple NPCs are moving around on the same map, they can get in each
other's way, which causes unusual-looking behaviour unless properly handled.
This post builds up a pathfinding technique, identifying, and addressing,
unusual behaviour caused by multiple NPCs interfering with each other.

I'll make the
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

A note on diagrams: The player will be denoted with a `@`. Each NPC will be
referred to by a letter. White cells are traversable. Grey cells are
non-traversable.

## Initial Approach: Follow a Dijkstra Map

The first approach will be to generate a map which stores, for each cell, the
distance from that cell to the player. These distances are shown as the numbers
in the top-left corner of each traversable cell in the diagram below.
The data structure storing these distances (generally a 2d array of numbers) is
sometimes called a "Dijkstra Map".
[Here](http://www.roguebasin.com/index.php?title=The_Incredible_Power_of_Dijkstra_Maps)
is an article elaborating on dijkstra maps.

![](/images/pathfinding-on-a-grid/a.png)

A benefit of using a dijkstra map, rather than searching for a path for each NPC,
is that the dijkstra map only needs to be generated each time the player moves.
To determine which way an NPC should move, we need only consider the neighbours
of that NPC's cell in the dijkstra map, choosing the one with the lowest score.
This scales well as the number of NPCs increases, as there is only a small
amount of work that must be done for each NPC.

![](/images/pathfinding-on-a-grid/b.png)

The example above shows a single step for `X` and `Y`, where each moved to its
lowest-valued neighbour.
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
single legal move would only increase its distance from the player.

![](/images/pathfinding-on-a-grid/c.png)

On `X`'s
turn, `X` would still move towards the player, creating a gap between `X` and
`Y`, which looks unusual:

![](/images/pathfinding-on-a-grid/d.png)

To prevent gaps from forming, we need to make sure that
NPCs move in increasing order of their distance to the player. Since we generate
a dijkstra map, it's easy to determine how far each NPC is from the player  (that is,
the closest NPC to the player moves first, then the second closest, and so on).
Simply sorting NPCs by the value of their cell in the dijkstra map is enough to
produce a turn order which avoids this problem.

## Getting stuck behind NPCs

The next problem occurs when NPCs are very close to the player.
Consider the diagram below.
On `X`'s next turn, it will remain next to the player - there's nothing it can
do to get closer to the player, so no need to move (In a typical roguelike it
would probably attack the player at this point). But what does `Y` do? None of
`Y`'s traversable neighbours are lower-valued in the dijkstra map than `Y`'s
current cell, so it will stay put, despite it being possible to eventually get
closer to the `@`, by first moving away from it by going north.

![](/images/pathfinding-on-a-grid/e.png)

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
searching again.

## Briefly taking the long way around

Let's step through what will happen in the following scenario.
Assume that `X`
moves first, as both NPCs start the same distance from the player.

![](/images/pathfinding-on-a-grid/g.png)

On `X`'s turn, it moves towards the player, blocking the way for `Y`.

![](/images/pathfinding-on-a-grid/h.png)

The only neighbour of `Y` with a lower value than its current cell is currently
blocked by `X`, so it falls back to searching, it's still possible to get to the
player, so `Y` takes the first step on that long journey.

![](/images/pathfinding-on-a-grid/i.png)

`X` continues to move towards the player. There's now a traversable cell
adjacent to `Y` with a lower value than `Y`'s cell, so it moves back to where it
was.

![](/images/pathfinding-on-a-grid/j.png)

When two NPCs meet at a doorway, the first one to move goes through, and the
other spends a turn moving towards another entrance to the room (assuming one
exists), regardless of how far away it is. In this situation, a more sensible
move for `Y` would have been to wait a turn until `X` had moved out of its way,
before proceeding right through the doorway.

We've seen one case where searching for a path around NPCs is required to
prevent unusual behaviour, and now another case where searching causes unusual
behaviour. So when should an NPC search, and when should it wait?

It's not immediately obvious. What should `Y` do here?

![](/images/pathfinding-on-a-grid/k.png)

`Y` is 2 cells away from `@`, but 28 cells away without moving through `X`.

What about here?

![](/images/pathfinding-on-a-grid/l.png)

`Y` is 12 cells away from `@`.

And here?

![](/images/pathfinding-on-a-grid/m.png)

6 cells.

At this distance it probably makes sense for `Y` to move along the optimal path
treating `X` as non-traversable, since there is a reasonable chance that by the
time `Y` reaches `@`, `X` won't have been killed by the player yet. In the
previous examples, where `Y` has further to travel, there's an increased chance
that the fastest way for `Y` to get to `@` is to wait for `@` to kill `X` and
move through the gap that creates.

In general, it seems like the sensible way to decide whether to wait or follow a
search path is based on the difference between the length of the search path and
the distance from the NPC to the player. The specific threshold above which it
becomes better to wait than follow the path, is up to the individual game.

## Summary


