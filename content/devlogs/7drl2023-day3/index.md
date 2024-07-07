+++
title = "7 Day Roguelike 2023: More Procedural Generation"
date = 2023-03-08
path = "7drl2023-day3"

[taxonomies]
tags = ["procgen"]

[extra]
og_image = "screenshot.png"
+++

Another day of mostly working on procedural generation. This game is by far the
most complex procgen project I've done. I've integrated the river generator into
the game engine and added a couple of pools along the river which I'll populate
with settlements. There is also a small lake at the beginning of the river and
an ocean where the game ends.

![Screenshot showing the boat in a river lined with rocks and trees](screenshot.png)

<!-- more -->

The river is lined with trees and rocks which get thicker further from the
water. This is partly done for aesthetic reasons, but also it obstructs vision
and movement beyond a certain point. 15 tiles out from the river on either side
is a solid wall of trees. There is nothing beyond this wall. It's left blank to
reduce the number of entities the game needs to keep track of.

![Screenshot showing the boat parked on the beach of the ocean](beach.png)

It's also possible to win the game. If you make it to the ocean the game fades
out to a screen declaring that you have won.
