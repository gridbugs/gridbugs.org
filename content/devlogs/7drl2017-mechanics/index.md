+++
title = "7 Day Roguelike 2017: Mechanics and Descriptions"
date = 2017-03-08T01:44:00+10:00
path = "7drl2017-mechanics"

[taxonomies]
+++

Today I implemented lots of small mechanics to add some depth to gameplay. I
also added descriptions to many actions which are printed in the message log.

![screenshot.png](screenshot.png)
<!-- more -->

Health is now broken up into hit points, engine health, tyres and armour.
When getting shot, if there is armour, there is a 1/(armour + 1) chance for the
armour to deflect the damage. If this check fails, the armour value is
decremented. If there's no armour, either the hit points, engine health, or
tyres will be decremented. The choice of which of these to decrease is random,
with the chance of a stat being decreased depending on the current value of that
stat (ie. higher stats are more likely to be decreased than lower stats).

Driving through acid now has a chance to destroy a tyre. When steering (moving
up and down the screen), there's now a chance that it will fail. The more tyres
you have, the greater chance of success. If the van has all its tyres, success
is guaranteed.

The maximum speed is half the engine health (rounding up).
I'm yet to implement damaging collisions with obstacles. I plan to make these
damage the engine. It's possible for your engine to be destroyed and get stuck.
To reconcile this I plan on allowing the player to repair the van while it's
stopped, and making take several turns, so it won't be done lightly.

The van can collect letters from the level. Currently this just increments a
counter. The plan is for these to increase the reward received upon completing a
level.

I added barrels, but am yet to make them explosive.

For all combat actions (being shot or rammed by vehicles, or clawed by zombies),
I added descriptions which are printed on the message log when the action takes
place. I also added some messages when failing to turn, failing to accelerate,
and when a tyre is dissolved by acid.
