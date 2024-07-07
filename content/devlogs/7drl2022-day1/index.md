+++
title = "7 Day Roguelike 2022: Bootstrapping"
date = 2022-03-05
path = "7drl2022-day1"

[taxonomies]
+++

I spent most of the day bootstrapping the project.
Unlike the last few years, this year I've elected to start from scratch
rather than from an existing project, though I am copying code aggressively
from last years entry. The reason for doing this is to prevent needing to
prevent the technical debt from accumulating over multiple game jams hacking
on the same code base.

![screenshot.png](screenshot.png)

<!-- more -->

So far you can move the player character around, and open doors.
Collisions work, as does visible area detection and dynamic, diminishing lighting.
The game can be saved and loaded, it has a main menu and a pause menu, and controls
can be changed by editing a config file.
