---
layout: post
title: "7 Day Roguelike 2018: Items, Glossary, Combat, Railgun"
date: 2018-03-05 23:42:00 +1000
categories: gamedev roguelikes 7drl
permalink: 7drl2018-items-glossary-combat-railgun
excerpt_separator: <!--more-->
---

The most exciting changes today are the "Glossary", and a revamped combat 
system.

![screenshot](/images/7drl2018-items-glossary-combat-railgun/screenshot.png)
<!--more-->

I don't want the game to have a message log, and I think adding an "examine" 
command would break the flow of the game, but I want players to know the 
meaning of each symbol on the screen. Enter the "Glossary". Each symbol which 
the game renders, (with the exception of boring symbols like the walls and 
floor) gets an entry in the glossary at the bottom of the screen, explaining 
what the symbol means.

There were initially some problems with the feel of the combat system. NPCs 
would always move towards the player, regardless of whether they had seen the 
player before. This lead to all the NPCs in the level quickly converging on the 
player, causing them to be surrounded and overwhelmed. If the player succeeded 
in killing all the enemies, there were left with an empty, boring level to 
explore.

This was exacerbated by the fact that the basic gun fired a single bullet doing 
a single point of damage. Combat felt boring and was often futile.

To address this, I changed the NPC behaviour so that each NPC keeps track of 
whether its been seen by the player. Only once an NPC has been seen, do they 
start following the player around. This totally fixed the problem of the player 
being overwhelmed. The exception to this is bosses, which always know where the 
player is and actively pursues them.

To make gun-based combat more interesting, the basic gun now shoots in all 4 
cardinal directions each time it's fired. Since ammo is finite, and enemies 
move when you fire, the player is incentivised to position themselves such that 
they can hit several enemies with a single shot. The felt a lot more fun while 
playtesting.

Finally, I added a railgun. It does no more damage than the regular gun, but 
rather than firing in 4 directions, it only fires in 1, but has infinite range, 
and shoots through enemies. The player is incentivised to line up enemies, to 
efficiently take out several in a single shot.
