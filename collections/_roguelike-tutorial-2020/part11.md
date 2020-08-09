---
layout: series-part
series: roguelike-tutorial-2020
index: 11
date: 2020-08-09 21:00:00 +1000
title: "Part 11 - Descending the Stairs"
permalink: /roguelike-tutorial-2020-part-11/
og_image: screenshot-end.png
published: false
---

In this part we'll add stairs, and multiple dungeon levels, as well as the ability to upgrade the
player character as they descend the stairs.

{% image screenshot-end.png %}

This part is loosely based on [this part](http://rogueliketutorials.com/tutorials/tcod/part-11/) of the
python tcod tutorial.

Reference implementation branch for starting point: [part-10-end](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-10-end)

In this post:
 - [Placing Stairs](#placing-stairs)
 - [Descending Stairs](#descending-stairs)
 - [Add Combat Stats](#add-combat-stats)
 - [Use Combat Stats](#use-combat-stats)
 - [Upgrade when Descending Stairs](#upgrade-when-descending-stairs)

## {% anchor placing-stairs | Placing Stairs %}
## {% anchor descending-stairs | Descending Stairs %}
## {% anchor add-combat-stats | Add Combat Stats %}
## {% anchor use-combat-stats | Use Combat Stats %}
## {% anchor upgrade-when-descending-stairs | Upgrade when Descending Stairs %}
