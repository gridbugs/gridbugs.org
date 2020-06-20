---
layout: post
title: "Roguelike Tutorial 2020: Part 2 - Generic Entities, Rendering, and the Map"
date: 2020-06-19 20:00:00 +1000
categories: gamedev roguelikes tutorial
permalink: /roguelike-tutorial-2020-part-2/
excerpt_separator: <!--more-->
og_image: screenshot.png
---

In the {% local roguelike-tutorial-2020-part-1 | previous part %} we got a single '@' sign moving
around the screen. The player character was represented by a coordinate stored directly in
the game state. In this part, we'll define a generic "entity" type, of which the player character
is merely one instance. The rendering logic will be generalized to draw arbitrary game entities.
Finally, we'll use the generic entity type to define map components - namely walls and
floor tiles.

<!--more-->

This part is loosely based on [this part](http://rogueliketutorials.com/tutorials/tcod/part-2/) of the
python tcod tutorial.

Reference implementation branch for starting point: [part-1-end](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-1-end)

In this post:

- [Generic Entities](#generic-entities)
- [General Rendering](#general-rendering)
- [Walls and Floors](#walls-and-floors)

## <a name="generic-entities">Generic Entities</a>

## <a name="general-rendering">General Rendering</a>

## <a name="walls-and-floors">Walls and Floors</a>

Reference implementation branch: [part-2-end](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-2-end)

{% local roguelike-tutorial-2020-part-3 | Click here for the next part! %}
