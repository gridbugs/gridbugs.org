+++
title = "7 Day Roguelike 2021: NPCs, Pathfinding, First Level, Final Level, Projectiles, Destructible Terrain"
date = 2021-03-07
path = "7drl2021-day2"

[taxonomies]

[extra]
og_image = "intro.png"
+++

I got through a good amount of core gameplay mechanics today including NPCs, projectiles and destructible terrain.
I also spent some time focussing on flair, such as special first and last levels, animations in the game menu,
death screens, and smoke trails on bullets.

![intro.png](intro.png)

<!-- more -->

## NPCs and Melee Combat

I added a simple enemy that patrols until it finds the player and then chases them.

![npcs.png](npcs.png)

There's melee bump combat. The player can kill zombies and zombies can kill the player.

![dead.png](dead.png)

## NPCs in the Menu

Rather than just running the renderer in the menu screen, the whole game engine now runs, with NPCs taking their turns
every couple of seconds in real time _because it's cool_.

![menu-zombies.png](menu-zombies.png)

## Render from player memories

The game will eventually feature destructible terrain.
When rendering the region of the map that the player has previously seen, but can't currently see, I
need to account for the fact that the terrain may have been destroyed since it was last visible.
I do this by storing the last-seen tile at each location.

Here's how it looks when you forget to clear tiles when the entity moves to a new location:

![vision-system-bug.png](vision-system-bug.png)

## Intro Level

The first level of the game is short with no combat to set the scene.

![intro.png](intro.png)

## Final Level

The stairs on the final floor are replaced with a "fuel bay", and walking over it ends the game.

![final-level.png](final-level.png)

## Projectiles

It's now possible to fire bullets in cardinal directions. When a projectile hits an enemy with lower armour
than the projectiles PEN, the enemy is damaged and the projectile's PEN is reduced by the enemy's armour.
If the PEN is positive after this, the projectile continues along its trajectory until it collides with another
enemy or the hull.

I pulled the particle system out of an [old project](https://github.com/gridbugs/rip) so the bullets leave smoke trails
which dissipate in real time.

![bullet.png](bullet.png)

## Destructible Terrain

Certain entities (generally all the walls) can be destroyed by shooting them. Each weapon will have
a certain chance of penetrating the hull. I haven't implemented the decompression mechanic yet.

![destructible.png](destructible.png)

## You lose if you step into the void

No explanation needed!

![adrift.png](adrift.png)

I forgot to prevent NPCs from walking into the void, so they escaped the ship to explore the heads up display!

![space-zombies.png](space-zombies.png)
