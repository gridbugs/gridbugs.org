---
layout: post
title: "7 Day Roguelike 2018: Meters, Objectives"
date: 2018-03-09 00:39:00 +1000
categories: gamedev roguelikes 7drl
permalink: /7drl2018-meters-objectives/
excerpt_separator: <!--more-->
---

Tonight I added new meters and objectives.

In this screenshot, the player has just activated an emergency beacon - the objective
of the level. Doing so alerts all NPCs of the player's presence, so getting to the
stairs will be challenging.

![screenshot](/images/7drl2018-meters-objectives/beacon.png)

<!--more-->

Another new objective is killing some "super eggs" before they hatch. The game displays
a bar for each egg, showing how close it is to hatching. If an egg hatches, you fail
the objective, and don't receive any upgrades for completing the level. Also, a Queen
hatches from the egg.

![screenshot](/images/7drl2018-meters-objectives/eggs.png)

The first new meter is the compass. It shows the shortest distance (ignoring NPCs) from
the player to their nearest objective, or the stairs/exit if the level's objective is
complete.

![screenshot](/images/7drl2018-meters-objectives/compass.png)

The second new meter is the "metabol" - a weapon which emits a wave that slows the
metabolism of enemies, effectively delaying their transformations.
The alien special infesting the dungeon has a life cycle of
egg -> larvae -> chrysalis -> arachnoid/beetoid, and super-egg -> queen. Enemies
tend to get tougher the further along the life cycle they are, so a weapon to delay
this progression may come in handy.

![screenshot](/images/7drl2018-meters-objectives/metabol-before.png)

After activating the weapon a wave radiates out from the player, delaying everything
it touches.

![screenshot](/images/7drl2018-meters-objectives/metabol-during.png)

Here's the aftermath.

![screenshot](/images/7drl2018-meters-objectives/metabol-after.png)

There's one day left! I'm almost finished adding content. I want to add two more meters:
one which allows the player to teleport a short distance, and another which pushes away
enemies which are close to the player. After that, I'll be play-testing and polishing.
