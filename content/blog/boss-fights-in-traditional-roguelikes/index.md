+++
title = "Boss fights in traditional roguelikes"
date = 2020-10-24
path = "boss-fights-in-traditional-roguelikes"

[taxonomies]
tags = ["roguelikes"]
+++

Today I completed my first successful run of [Jupiter Hell](https://jupiterhell.com/) -
a traditional roguelike which is the spiritual successor to [DOOM the Roguelike](https://drl.chaosforge.org/).
As a traditional roguelike, gameplay is turn-based, and levels are abstracted as 2D square grids of tiles.

Another property that tends to be true of roguelikes is that most turns are uninteresting - walking down a corridor,
or attacking a single standard enemy. There are meaningful _strategic_ decisions to be made from time to time,
such as choosing whether to discard an item from your inventory to make room for a new item or deciding on a skill
to upgrade. Meaningful _tactical_ decisions come about when a situation rapidly becomes dire (Do you stand your ground or flee
when surprised by a difficult enemy?) or the combination of enemies and terrain presents an opportunity (Which enemy do you
attack first? Is there time to run to cover? Should you use a rare/expensive grenade? Should you trigger an explosive barrel?).

Jupiter Hell culminates with a boss fight fairly typical of DOOM-inspired games.
You fight a large enemy that periodically spawns normal enemies and then teleports away.
After a few such iterations my dual-pistol toting marine made short work of it.
As with the boss fight at the end of Doom the Roguelike, I found it to be an anti-climactic
conclusion to an otherwise solid game.

Upon further reflection, I'm not convinced that the roguelike genre supports boss fights at all.

<!-- more -->

In real-time games, or some non-roguelike turn-based games, a typical boss fight
involves the player fighting a single tougher-than-usual enemy in a closed-off arena.
Gameplay during a boss fight should resemble standard gameplay that has been enhanced, or purified in some way.
The boss fight becomes a way for players to prove to the games that they have mastered some aspects of its mechanics.

To defeat Smough and Ornstein
in Dark Souls you must demonstrate your ability to patiently wait for the right time to strike,
and time attacks, dodges, and blocks perfectly, which is what melee combat in Dark Souls is all about.
The Icon of Sin at the end of Doom II (or Doom Eternal) forces you to manage an endless horde of
hell spawn while also shooting the boss itself until it's dead, which is the main mechanic of the
game, only more-so.
In Darkest Dungeon - a turned based game with some roguelike properties, the combat system is entirely based on
abilities, with enough variety and (anti)synergy with one another; unlike traditional roguelikes, _every_ turn
feels like a meaningful decision.
Because of the richness of combat, all 10 or so boss fights feel fresh (except for the part where they re-use
the same boss 3 times for each area - but that's a different issue!).

Which brings us back to traditional roguelikes. The richness of combat in the genre comes from the interactions
between groups of enemies, the terrain, and the player. In a boss arena, where there is only a single enemy (plus
its summons, perhaps), the number of interesting interactions is low, compared to normal, non-boss gameplay.
Boss fights feel repetitive and boring when you win, and an unfair skill-check when you loose.
Rarely does a decision made by the player during a boss fight meaningfully affect its outcome.
Gameplay during a boss fight is not just an amplified version of standard play, but instead a detraction from it.

So how do you conclude your roguelike? Originally, (in Rogue, say) the hero would reach the bottom of the dungeon, and retrieve
an item (traditionally an amulet), and then make it back to the surface, possibly pursued by the item's
guardians. In their flight, the player may still need to fight remnant (or perhaps newly-spawned) enemies on
floors as they ascend, but now they might be under time pressure due to their pursuers, or item pressure as
the floors were already looted by the player on their way down. The game's culmination is the same experience
as normal gameplay, only enhanced in some way.
