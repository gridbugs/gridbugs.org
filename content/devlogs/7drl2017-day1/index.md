+++
title = "7 Day Roguelike 2017: Day 1"
date = 2017-03-05T03:22:00+10:00
path = "7drl2017-day1"

[taxonomies]
+++

After a day of development, I've implemented some of the basic functionality and
created some of the artwork. You can control the speed of the van, and steer it
provided that its speed is above zero. Zombies can be run over which insta-kills
them, or they can be shot if they are directly in front of the van.

![screenshot.png](screenshot.png)
<!-- more -->

The most interesting bug I encountered was the engine not dealing with entities
moving out of bounds. The previous game I developed with this engine had
impassible tiles around the edge of the map, but the map I'm testing with does
not. Originally, you could fire a bullet off the right side of the screen and
see it appear on the far left of the screen, one row below.

Tomorrow I'm going to implement the in-between-level logic, consisting of
buying upgrades/repairs/items, and switching the weapons currently equipped.
I'm also going to start implementing a terrain generator.
