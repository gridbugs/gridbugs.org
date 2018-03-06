---
layout: post
title: "7 Day Roguelike 2018: Character Progression, Melee Combat"
date: 2018-03-06 23:44:00 +1000
categories: gamedev roguelikes 7drl
---

Today I implemented character progression. Character progression is entirely
made up of meters, which either give you new abilities, or passive benefits.
You get to choose 1 of 3 randomly selected meters to add to your character at
the end of each level, but only if you complete the mission for that level.

![upgrades](/images/7drl2018-character-progression-melee-combat/upgrades.png)

I noticed that it's possible to get stuck in a corner, surrounded by enemies.
The game prevents you from walking through NPCs, and doesn't progress time when
you take no action, or your attempted action fails, so the game is soft-locked
and you have to quit and start again.

I added a melee combat system to address this. I'm not a fan of bump combat, so
I added some mechanics to spice it up a bit.

Firstly, you have a stamina meter.  It increases every turn you don't attack in
melee, and decreases every turn you do attack in melee. If it's at 0, you can't
attack in melee.

Secondly, when you bump into an enemy, you attack all enemies adjacent to the
player.

![screenshot](/images/7drl2018-character-progression-melee-combat/screenshot.png)

When you start the game, you always have a health and stamina meter, so it's
always possible to do melee combat when nothing else is available. You also
start with a third, randomly chosen meter.

There are several issues I've noticed which I'm yet to fix:
 - When attempting to take an action involving a meter, and the action fails due
   to the meter being empty, time still passes. This is especially frustrating
   in melee combat, where you bump into an NPC, they don't take damage, and
   the player still gets attacked by the NCP. Time shouldn't progress in this case.
 - Relatedly, when an attempt to take an action fails due to a meter being 0,
   the player should be alerted.
 - There's a tiny chance (I've seen it twice ever in hundreds of runs) that the
   terrain generator will place items and NPCs inside walls. After the first
   time I added code to print the RNG seed each time, and on the second time I
   recorded the RNG seed, so I can reliably reproduce the problem and solve it.
