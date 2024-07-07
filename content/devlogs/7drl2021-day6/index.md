+++
title = "7 Day Roguelike 2021: Enemies, Message Log, Space Gradient"
date = 2021-03-11
path = "7drl2021-day6"

[taxonomies]

[extra]
og_image = "screenshot.png"
+++

Tonight I added a range of enemies, a message log, and made the space background a gradient.
The game is now feature-complete! I also added placeholder sound effects so when I get my hands on
real sound effects I can just slot them in.

![screenshot.png](screenshot.png)

Tomorrow I'll be adding music and sound effects, play-testing, polishing, and fixing bugs.

<!-- more -->


## Types of Enemy
The game will have 4 enemies.

### Zombie

Basic fodder. Easy to kill but there will be many of them.
Late game they will act like a resource because of the guns that heal and restore oxygen each time they kill things.

### Skeleton

Resurrects 10 turns after death. Since it costs resources to kill them and they don't die permanently, skeletons fill
the role normally taken by a "food clock" - an incentive for players to make forward progress and not hang out grinding.

### Boomer

Low armour and health, and explodes on death. The explosion will be relatively small, but still dangerous on a space station.
The player will probably want to avoid killing these enemies unless they've built a character that is comfortable being in space,
which should be a legitimate strategy if I've designed the game correctly!

### Tank

High health and armour. Deals double damage but knocks the player back two spaces so they have time to breath (unless there's no atmosphere!).
Only the chainsaw, railgun, and gaus cannon can get through its armour.

![enemies.png](enemies.png)

## Lots of Boomers!

When one has an enemy that explodes upon death, and explosions can kill other enemies, one is compelled to try the following experiment:

![boomers.png](boomers.png)

This lucky screenshot captures the frame during which the damage from the chain reaction of explosions has been dealt, but dead enemies haven't
been removed from the map. The room is illuminated from the resulting blast(s).

![boom.png](boom.png)

Some walls have been removed by the explosion, but luckily the hull remains intact.

![aftermath.png](aftermath.png)

And a single boomer survived!

![surviver.png](surviver.png)

## Space Gradient

Space is now rendered with a gradient!

![gradient.png](gradient.png)
