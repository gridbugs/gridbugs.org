+++
title = "7 Day Roguelike 2020: Day 1"
date = 2020-02-29T20:00:00+10:00
path = "7drl2020-day1"

[taxonomies]
+++

Today I focused on procedural generation. I have a small playable demo of a
procedurally-generated sewer. Walls are placed using
[wave function collapse](@/blog/wave-function-collapse/index.md),
then sludge pools, bridges, doors, and the start and goal locations are chosen
based on hand-crafted rules. I then spent an hour or so integrating the level
generator into the [RIP](https://github.com/gridbugs/rip) engine, and messing
around with graphics and lighting.

![screenshot.png](screenshot.png)

<!-- more -->

Levels have lots of open space and no 1-tile corridors, which will make combat
against slimes interesting (you can't get surrounded in a 1-tile corridor).
Levels are relatively small, at 24x24 tiles. My intention is to
show the entire level at once (ie. no scrolling), and render each game tile
as 2x2 graphical tiles to display more info per tile.

Here are some levels produced by the generator:

![map0.png](map0.png)
![map1.png](map1.png)
![map2.png](map2.png)
![map3.png](map3.png)

The plan for tomorrow is to add a single type of NPC, and implement the 2x2
tile rendering and user interface displaying sequences of combat outcomes.
