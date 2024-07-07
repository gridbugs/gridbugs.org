+++
title = "7 Day Roguelike 2023: Even More Procedural Generation!"
date = 2023-03-09
path = "7drl2023-day4"

[taxonomies]
tags = ["procgen"]

[extra]
og_image = "town.png"
+++

Yet another day of working on procedural generation and I think I'm finally finished (the
procgen - not the game!). I added a generator for the starting town, a swamp
area, a flooded city area, and dungeons which are accessible from the city.

![Screenshot of the starting town](town.png)

<!-- more -->

The city section has a sluice gate that has rusted through and leaked water into the
city causing it to flood, but the gate is still shut and it blocks the path of
the player to get out of the city and reach the ocean. There are bunkers under
the city that have controls for the gate. Some buildings have stairs that lead
to the bunkers (the '>' tiles).

![Screenshot of the sunken city](city.png)

Going down the stairs takes you to a bunker. I used a fairly standard dungeon
generator here because I don't want to spend any more time on procedural
generation. This dungeon generator is borrowed from a half-finished tutorial on
how to use my game engine. It populates dungeons with rooms, corridors, and
doors. It generates dungeons with loops, is conceptually simple and easy to
implement. I'm really happy with the dungeons it generates. I might write a blog post
about this algorithm after the game jam.

![Screenshot of a bunker](dungeon.png)

Unlike all my previous games this one takes place in a single giant level
(except for the tiny dungeons under the city). The map is about 500 tiles wide
so it's too wide to comfortably fit on my screen. To debug the terrain generator
I made a small program that renders a simplified view of the generated terrain
to a terminal and used a tiny font to quickly iterate on terrain generation
without having to start the game engine.

Here's how the starting town looks in the debugging view:

![Debugging visualization of the starting town](town-dev.png)

And this is how the city looks:

![Debugging visualization of the city](city-dev.png)

My plan for tomorrow is to add a fuel system, a passenger system, and a time
system, where you lose if you end up on the river after dark. Part of the
generated terrain includes an inn in both the swamp and the city where you'll be
able to trade for fuel and wait out the night.
