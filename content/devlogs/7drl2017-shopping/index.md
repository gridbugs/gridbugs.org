+++
title = "7 Day Roguelike 2017: Shopping"
date = 2017-03-06T02:24:00+10:00
path = "7drl2017-shopping"

[taxonomies]
+++

The main feature I implemented today was a set of menus that are displayed
between levels. These include a shop for buying items (currently just guns),
equipping guns to weapon slots (which can't be done in the field), and
inventory management (just removing items from the inventory to make room for
more items).

![shop.png](shop.png)
<!-- more -->

An interesting consideration was integrating this in-between-level logic with the
entity component system that the game is built on. Each level has a database of
entities, but where is the player when they are between levels? It would make
sense for items in the shop to be represented as entities, but which database do
they belong in?

I ended up adding an additional entity database for use between levels. When the
player gets to the end of a level, all their associated components are moved
into this database. The shop is set up in this database too, and entities in the
shop can be moved between the shop's inventory and the player's inventory.

The most interesting bug I encountered was the logic for switching the player
between levels not understanding that some components (namely the inventory and
weapon slots) depend on the existence of other entities. Both of these
components store a collection of entity ids, which are references into the
current entity database (ie. they can't span multiple entity databases). Thus,
when moving the player between levels, any entities referred to by these
components must also be moved.

![railgun.png](railgun.png)

I added a shotgun, a machine gun and a railgun. The image above shows a
zombie about to get toasted by the railgun. Also visible in the screenshot above
is the current and maximum speed displayed on the heads up display.
