+++
title = "7 Day Roguelike 2016: Plan"
date = 2016-03-05T10:06:00+10:00
path = "7drl2016-plan"

[taxonomies]
+++

The 7 Day Roguelike Challenge is a game jam where participants make a roguelike in 7 days.
This year I'm making a game called "Skeleton Crew" where you fight undead things
on a spaceship. I'll post updates to this site as I make progress.

## The Plan
I'm going to start with the [glacial
codebase](https://github.com/gridbugs/glacial).
I plan to implement the following features:
- guns
- shooting the hull can cause a breach and vent the atmosphere from connected
  parts of the ship
- you need oxygen in your suit to survive in vacuum
- oxygen drains while
  you're in vacuum, and recharges while you're in atmosphere.
- as atmosphere is vented, characters and items are sucked towards, and possibly
  out of, the breach
- flamethrower that doesn't penetrate the hull but only works in atmosphere
