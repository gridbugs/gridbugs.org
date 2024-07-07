+++
title = "7 Day Roguelike 2018: NPCs"
date = 2018-03-08T00:01:00+10:00
path = "7drl2018-npcs"

[taxonomies]
+++

Tonight I added all the NPCs! I've followed an insect theme, and NPCs transform
based on an insect lifecycle. Levels begin populated with eggs and larvae.
Eventually, the eggs hatch into more larvae, and the larvae turn into chrysalises.
The chrysalises hatch into either an arachnoid - a fast enemy, which takes 2 turns
for every turn the player takes - or a beetoid, which acts at normal speed, but
has more health. There's also a super egg which hatches into a queen, which I'll
use for missions.

<!-- more -->

NPCs transforming into tougher enemies after some time passes might be a reasonable way
to incentivise players to not linger on the level for too long after completing the objective.
It is in some ways like a food clock. That said, there's no experience in this game -
the only way to improve the player is to complete objectives and ascend the stairs.
The only benefit that could come from grinding would be to collect more health, ammo and
armour shards. The maximum values for these meters are quite low, and collecting a single
item refills the meter completely, so grinding shouldn't be a problem anyway.

![screenshot1.png](screenshot1.png)

I made some more additions to the game's interface. There's now a bar at the bottom
of the screen showing the game's controls, and a message at the top of the screen
where relevant text is sometimes displayed. For example, when you have an armour
meter, and the armour absorbs some damage, you get the message:

![screenshot2.png](screenshot2.png)

A few turns later, after hitting the queen and aracnoid in in melee combat, your
stamina is completely drained. If you attempt to use melee combat again, time doesn't
progress, and you get the message:

![screenshot3.png](screenshot3.png)

Tomorrow I'll add more diverse missions, and possibly some more meters. The following night
will be the last night of my 7drl, and I hope to spend it playtesting and tweaking balance.
