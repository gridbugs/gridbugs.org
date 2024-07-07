+++
title = "7 Day Roguelike 2016: Day 1"
date = 2016-03-06T10:04:00+10:00
path = "7drl2016-day1"

[taxonomies]
+++

It's one day in. Here's my progress so far!

![screenshot.png](screenshot.png)
<!-- more -->

Completed features (from the plan I posted yesterday):
- guns
- shooting the hull can cause a breach and vent the atmosphere from connected
  parts of the ship
- as atmosphere is vented, characters and items are sucked towards, and possibly
  out of, the breach
- flamethrower that doesn't penetrate the hull but only works in atmosphere
    - flamethrower is implemented but it works in a vacuum

Guns have a "spread" parameter that determines how quickly bullets spread out.
This screenshot was taken directly after firing a shotgun at the zombie. You can
see the bullets in flight:
![gun-fired.png](gun-fired.png)

We hit the zombie but we also hit the hull. The red tint indicates that that
section of the ship is currently being vented into space. Venting takes place
over several turns, during which things are sucked towards the hull breach. Note
that items and characters have moved since the first screenshot. This was the
most complicated mechanic to implement. It uses [dijkstra
maps](http://www.roguebasin.com/index.php?title=The_Incredible_Power_of_Dijkstra_Maps)
to determine which way entities move.
![aftermath.png](aftermath.png)

After all the air has vented from a section of the ship, it changes to blue
tinted and things stop getting sucked out. Eventually being it vacuum will drain
oxygen from your suit, but this feature is not implemented yet.
![vacuum.png](vacuum.png)

If you open a door of a pressurized section of the ship that's facing vacuum,
that section starts venting.
![open-door.png](open-door.png)

If you make it inside the venting room and close the door, atmosphere returns.
![closed-door.png](closed-door.png)

Coming soon:
- you need oxygen in your suit to survive in vacuum
- oxygen drains while
  you're in vacuum, and recharges while you're in atmosphere.
- make the flamethrower only work in atmosphere

Additionally, as this needs to be a game and not just a tech demo,
I'm also planning on implementing:
- procedurally generated ship
- different NPCs
    - something that explodes when killed so players have to think about whether
      killing it will breach the hull
    - something that can only be killed by getting sucked into space

The most interesting bug I've encountered so far is when shooting the hull with
a machine gun, if the hull is breached while bullets are still leaving your gun,
there's a chance you will be sucked towards the hull, in front of bullets that
haven't been fired yet, resulting in you getting shot by your own bullets.
