+++
title = "7 Day Roguelike 2024: Applying Items, Equipment"
date = 2024-03-08
path = "7drl2024-day6"

[taxonomies]

[extra]
og_image = "screenshot1.png"
+++

One day left! Tonight I implemented the equipment system. Weapons can be equipped
from the inventory to the hands. Some weapons require both hands while others
require only one. This is important as the "Claw" organ takes up a hand; you
can't use a two-handed weapon if one of your hands is a claw (and you can't use
a one-handed weapon if both of your hands are claws). Getting the logic and
error handling for equipping, unequipping and reloading weapons was trickier
than I expected. Especially since you can hold one pistol in each hand.

It's possible to lose the game:

![death screen](screenshot1.png)

<!-- more -->

I've added lots of information screens to help the player get their bearings.
Here's a list of all the current organs of the player character:

![list of organs](screenshot3.png)

And here's one of 3 help screens that explain the controls and mechanics:

![one of the help screens](screenshot2.png)

I also added two additional enemy types: the poisoner which spreads a trail of
poison, and the divider which splits into two enemies when damaged.

Each item in the game can be applied, including the interaction of filling an
organ container with an organ from a corpse.

And equipped weapons can now be fired. If you have two pistols, they both fire.
Also there are weapon organs which cost health to fire.

It's all coming together nicely but there is still a fair amount of work left
for tomorrow but fortunately it's Friday and I can stay up arbitrarily late.
Notably I still need to connect the organs to the player's stats (e.g. so
having two hearts give you twice as much health) and implement the organ
traits. I need to implement shops and the organ clinic so players can change
their organs. I need to add the final boss fight and make the game winnable.
Finally I need to balance and playtest a bunch.
