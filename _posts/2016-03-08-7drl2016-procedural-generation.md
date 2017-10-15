---
layout: post
title: "7 Day Roguelike 2016: Procedural Generation"
date: 2016-03-08 3:04:00 +1000
categories: gamedev roguelikes 7drl
---

This is my second attempt at a procedurally generated space ship. The first
attempt involved generating the hull first by starting with a large rectangle
and stripping smaller rectangular pieces away until I got something roughly
hull-looking. I would then attempt to fill the hull with rooms. Adding rooms to
a preexisting hull proved messy and prone to difficult edge cases.

Here's what it looked like at the point where I gave up:
![](/images/7drl2016-procedural-generation/old.png)

This shows my attempt at adding hallways on the inside of the ship. I was going
to use some sort of binary partitioning scheme to split the space either side of
the hallways into rooms, but I spent several hours making very little progress
so I elected to sleep and try something else the next day.

So the next day I started the ship generator from scratch. The new plan was to
start with rooms, and compose them in a ship-like way. Specifically, I start
with a few long hallways a reasonable distance apart. Then I "grow" rooms around
the outside of the hallways. Rooms can also be grown from the edge of existing
rooms. There are a simple set of rules that prevent rooms from growing into
other rooms, and for opportunistically adding doors between pairs of rooms, and
adjacent rooms and hallways.

Here's an example of the output:
![](/images/7drl2016-procedural-generation/screenshot.png)

It's still not completely finished. I still need to add windows around the
outside of the hull, add items and NPCs, find a starting room for the player to
begin in, and add some sort of goal room or stairs to the next level.

My plan at the moment is:
- tomorrow:
    - complete level generator (windows, items, NPCs, stairs)
    - make the game winnable
- rest of week:
    - play test, polish, maybe add more weapons and enemies
