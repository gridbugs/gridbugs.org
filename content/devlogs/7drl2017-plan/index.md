+++
title = "7 Day Roguelike 2017: Plan"
date = 2017-03-04T09:54:00+10:00
path = "7drl2017-plan"

[taxonomies]
+++

For this year's [7DRL](http://7drl.roguetemple.com/) I'm making a game called
"Apocalypse Post". It will be a [coffeebreak
roguelike](http://www.roguebasin.com/index.php?title=Category:Coffeebreak_roguelikes)
where the player delivers mail in a post-apocalyptic world.

I'm writing the game in rust, using [Howl](https://github.com/gridbugs/howl) as
a starting point. My recent focus for Howl has been adding basic (but
non-trivial) functionality to the engine (menus, saving, configuring controls)
so I can take advantage of it for the 7DRL and focus on the high-level parts of
game development this week.

Features I plan to implement:
 - on each turn the player automatically moves forward
 - gun-based combat
 - various weapons with interesting tactical significance (e.g. rail gun shoots
   through everything in a certain direction, costing you a finite resource)
 - a shop for buying upgrades and equipment
 - procedural terrain generator suitable for automatic side-scrolling

I'll try to post daily updates to this site.

Follow development more closely on
[github](https://github.com/gridbugs/apocalypse-post).
