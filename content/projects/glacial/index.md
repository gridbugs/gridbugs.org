+++
title = "Glacial"
date = 2016-03-01T01:27:01+10:00
path = "glacial"

[taxonomies]
tags = ["roguelikes"]
+++

A roguelike I made in Februrary 2016.

[Play in browser](https://games.gridbugs.org/glacial)

You are a faithful servant of the Pyro God.
You returned to the former home of your ancestors in search of his ancient cathedral,
only to find the city a frozen ruin.

![screenshot.png](screenshot.png)
<!-- more -->

I made this game as part of [One Game a Month](http://www.onegameamonth.com/).
Some of the code, mainly low-level data structures and basic utilities, was
reused from my previous game, [Bugcatcher](@/projects/bugcatcher/index.md). I also reused the core
concept of its engine, though re-implemented the engine from scratch.

If I had more time, I would have added deeper character progression. Currently,
each time you descend to a new level of the dungeon for the first time, you
receive a boost to your current health, which is also used as mana for the
fireball ability. I intended to add a shrine hidden on each level that could be
used to gain additional pyromancy abilities.

The code is on github:
[github.com/gridbugs/glacial](https://github.com/gridbugs/glacial)
