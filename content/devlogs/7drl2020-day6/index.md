+++
title = "7 Day Roguelike 2020: Day 6"
date = 2020-03-05T22:00:00+10:00
path = "7drl2020-day6"

[taxonomies]

[extra]
og_image = "screenshot4.png"
+++

I spent today play-testing and tweaking mechanics to make them more fun and balanced.
Originally there were slimes which granted the player abilities when attacked.
These slimes would flee the player at half speed, and you would need to chase them
down while evading other slimes to get new attacks, defences and techs.
This proved tedious, so I cut them. Now all enemies have a chance to drop items when
killed. The green "goo" slimes drop better items, but they also spawn sludge when
killed, so you have to step in sludge and take damage to pick up the item.
There are also various items placed around the level, with better items being
placed in sludge.

![screenshot4.png](screenshot4.png)

<!-- more -->

I found that I was dying a lot, and there wasn't a large variety of defense abilities,
so I added armour with a count that decreases when hit, and made the dodge ability
move the player to an adjacent empty cell.

The screenshot above also shows off "examine" mode. The game already identified
tiles when moused-over, but there was no keyboard-only option. In "examine" mode
you can move the cursor (the yellow cell two cells left of the player) with the
keyboard or mouse.

I also spent some time today focussing on completeness and flavour. You start the
game in a foyer of sorts - a procedurally-generated mini-sewer with a single room and staircase leading downwards.

![screenshot3.png](screenshot3.png)

The purpose of this first level is to give the player a chance to pick an initial ability
to start the game with.

The dungeon ends on the 6th floor with a boss fight against a slime with lots of health and abilities.
At the moment it only divides when hit. Tomorrow I will make this boss fight more interesting.

![screenshot5.png](screenshot5.png)

If you kill the boss you win the game.

![screenshot2.png](screenshot2.png)

Writing some proper end text is another job for tomorrow.

![screenshot.png](screenshot.png)

I also added a backstory. There's an option in the main menu to display the backstory,
and when the game runs for the first time it's shown before gameplay begins.

![screenshot6.png](screenshot6.png)

The game sets a flag in the config after showing the backstory so it won't appear at the start
of subsequent runs.
