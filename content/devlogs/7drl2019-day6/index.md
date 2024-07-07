+++
title = "7 Day Roguelike 2019: More Enemies, More Upgrades, More Cards"
date = 2019-03-08T23:00:00+10:00
path = "7drl2019-day6"

[taxonomies]
+++

I added 2 new upgrades: the Cursed Altar, and the Plentiful Fountain.

The altar lets you take character upgrades, increasing max health, max power,
hand size, and vision distance. The altar also adds one negative card to your
deck. Negative cards take up precious space in your hand.

The fountain lets you add additional cards to your deck.

![eod.png](eod.png)

<!-- more -->

There are 2 more types of enemy: the Healer and the Caster.

The healer heals nearby wounded enemies after displaying a brief, 3-turn countdown.
To make the healer more interesting, the two other enemy types, the Caster and Bumper,
both now start with wounds, 1/2 and 2/3 hit points respectively. The healer has a single
hit point, and starts at full health.

The caster is a ranged unit. Whenever it shares an axis with the player and is within range, it starts warming
up a ranged attack, telegraphing the direction of the attack. It fires the attack on the following turn,
so you better get out of the way! This screenshot demonstrates
the warning you get before being zapped.

![range.png](range.png)

This concludes all the engine features I intend to add. Tomorrow is the last day of my 7drl,
and I will spend it adding an ending, more cards, a "view" command, and possibly more NPCs
and more terrain types. Then I will playtest, balance, and submit!
