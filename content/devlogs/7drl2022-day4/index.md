+++
title = "7 Day Roguelike 2022: Time"
date = 2022-03-08
path = "7drl2022-day4"

[taxonomies]
+++

Tonight I added the concept of time to the game.
Each day, as time progresses, the light and visibility systems respond to the passage of time,
simulating a sunrise and sunset, and making it dark at night.
There are three different rain modes (light, medium, heavy) and a randomized (ahem, "procedural")
schedule that makes the rain get heavier over time (on average).

![flood.png](flood.png)

Also each day the flood level rises, and when you walk into the flood water the '@' sign is partially submerged!

<!-- more -->

This what the sunset effect looks like:

![sunset.png](sunset.png)

At night, the vision radius shrinks, the mist is more opaque, and the player's light gets a blueish tint.

![spook.png](spook.png)

Finally, I implemented one of the game's items: a topographic map. This will hopefully help players work out
the best place to dig ditches or place stepping stones to  help navigate the map as the water rises.

![map.png](map.png)
