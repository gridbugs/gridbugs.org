+++
title = "7 Day Roguelike 2024: Items"
date = 2024-03-07
path = "7drl2024-day5"

[taxonomies]

[extra]
og_image = "apply-item.png"
+++

Tonight I added items. This includes the logic for picking up and dropping
objects, the UI control flow for displaying menus allowing the playing to drop
or use an item, and the item descriptions.

![Apply item menu](apply-item.png)

The most complicated part is dealing with what happens when a user drops an item
while standing in a cell that already contains an item. The game engine does not
allow multiple items to exist at the same location, so when a collision would
occur the game searches for the nearest cell that doesn't contain an item
(without traversing wall, etc) and puts the item there.

<!-- more -->

![Room with several items on the floor](screenshot.png)

Part of the game will involve harvesting organs from corpses. In preparation for
that I made it so that when enemies die they leave a corpse. I changed the
zombie enemy so that its corpse resurrects after some number of turns unless its
corpse is destroyed.

I also added a new enemy type - the "snatcher" - which
picks up items from the ground and drops them all when it dies. I ran into an
interesting bug where snatcher corpses were immediately disappearing. The
problem was that the game treats corpses as items, and the snatcher's corpse was
picking itself up as soon as it died.

There are two days left in the jam. The main focus for tomorrow will be allowing
items to be applied, and implementing all the interactions with the world that
affect the player's stats. I also need to add some shops where you can buy items
and have organs installed.

This leaves the final day for implementing the win condition which I think will
be getting to the bottom of the dungeon and kill a boss, then escape.
