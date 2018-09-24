---
layout: post
title: "Roguelike Lighting Demo"
date: 2016-12-20 09:31:00 +1000
categories: gamedev roguelikes lighting project
excerpt_separator: <!--more-->
---

This is a demonstration of some lighting techniques I've been experimenting
with. It was originally intended to be an entire game, but I've abandoned it to
work on other projects.

 - [Run in browser](https://games.gridbugs.org/roguelike-lighting-demo)
   - Use arrow or vi keys to move. Press "f" followed by a direction key to fire a
     burst of plasma.
 - [Source code on github](https://github.com/stevebob/roguelike-lighting-demo)

![screenshot](/images/roguelike-lighting-demo/screenshot0.png)
<!--more-->

## Lighting the edges of cells

Determining lit areas is the same problem as determining visible areas. I reuse
my existing vision system [described
here](/visible-area-detection-recursive-shadowcast).
A slight modification was required to handle the following complication.

In grid based games, when computing visible area, each cell is typically either
completely visible or completely obscured. This is not sufficient when computing
lit area. Consider the case where there is a wall between the player and some
light source. The wall is lit on the opposite side to the player, but the player
should see an unlit wall.

![inside](/images/roguelike-lighting-demo/screenshot1.png)

<p class="label">View from inside a well-lit room. The yellow "£" is the light
source.</p>

Since the direction from which a cell is lit now matters, the amount of light
reaching each side of each cell must be tracked, rather than just determining
whether or not a cell is lit. When an observer sees a cell, the vision system
detects which sides of the cell they can see. The cell is drawn with a
brightness based on the visible side with the most light reaching it.

Note that this only applies to opaque cells.

![outside](/images/roguelike-lighting-demo/screenshot2.png)

<p class="label">View from outside the same room shown above.</p>

In order to correctly light the cells in the corners of rooms, the amount of
light reaching the corners of cells is also tracked.

## Areas unlit by certain lights

The demo includes a lighthouse with a spinning light on top. The walls of the
lighthouse and its interior are unlit by the light on top. In practice,
the entity providing the lighthouse's light is in the centre of the
lighthouse, and there is only one "level". The effect of only certain areas
being lit by certain lights is achieved by something I call light channels.

![lighthouse-outside](/images/roguelike-lighting-demo/screenshot4.png)
<p class="label">The wall of the lighthouse is not illuminated by the
lighthouse's light.</p>

A light channel is an integer. Each light source declares a collection of channels
which it illuminates, and each entity with a tile declares a collection of
channels which it can be illuminated by. A light source illuminates a tile if
there is at least one channel in common between the light source and the tile.
In practice this is implemented using bitfields.

![lighthouse-inside](/images/roguelike-lighting-demo/screenshot5.png)
<p class="label">The interior of the lighthouse is illuminated by the player's
light only.</p>

Most entities with tiles, and most light sources, use all light channels. The
lighthouse light uses only channel 0, and the lighthouse walls and floor use
only channel 1. Thus, walls and floor of the lighthouse are not illuminated by
the lighthouse light, but are still illuminated by other lights.
