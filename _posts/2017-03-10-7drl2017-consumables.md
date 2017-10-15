---
layout: post
title: "7 Day Roguelike 2017: Consumables"
date: 2017-03-10 03:33:00 +1000
categories: gamedev roguelikes 7drl
---

I added many features today, most notably consumable items that can be used
while stationary in the field to repair the engine or replace a burst tyre.
These items can be bought from the shop in the survivor camp. The shop also
sells repairs that happen immediately.

Zombies are now dumber, and the game can handle many more of them.
The game had noticeable delays between turns when there were more than 30
enemies on a map. Profiling revealed most of the time being spent in the zombie
pathfinding code. Each zombie was performing a search to find the shortest path
to the player. This was wasteful, and could be made much faster using dijkstra
maps, where a map describing the shortest path from each cell to the player is
computed once, and used by all NPCs. In the interest of time however, I made
the zombies simply walk to wards the
player if they know where the player is. This means zombies will now bump into
obstacles as they move towards the player, which is appropriate behaviour for
zombies. The game can now handle hundreds of zombies with no noticeable slowdown.

Various other minor changes:
 - The contents of the shop is now randomized each time you enter the survivor
camp.
 - The chance to encounter the more difficult enemies (cars and bikes) goes up as
the game progresses.
 - The current amount of money owned by the player appears on the hud.
 - The hud is now visible in menus in the survivor camp.
 - I added flavour text to the camp explaining that the player is healed and
   paid when entering the camp. This should also help establish the game's
   (minimal) story.
 - The message log is now cleared between delivery runs.
 - Driving into barrels causes them to explode.
