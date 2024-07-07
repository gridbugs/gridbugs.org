+++
title = "7 Day Roguelike 2023: UI, Night, Loss, Menus"
date = 2023-03-10
path = "7drl2023-day5"

[taxonomies]

[extra]
og_image = "night.png"
+++

I added stats like health, fuel, and daylight and display them in the game's UI.
There's a hinting system that displays hints based on what tiles are currently
on the screen.

![Screenshot showing the game's UI](screenshot.png)

<!-- more -->

If the day meter gets to 0 it becomes night time. A ghost spawns every 20 turns.
Ghost are invincible and unlike the player, they can move diagonally. This is so
that if the player is driving the boat away from a ghost and they move
diagonally the ghost can keep up with them. Night is imbalanced on purpose. If
you get caught on the river at night you're almost certainly going to lose the
game, but if players almost make it to the inn in time I want them to have a
small chance of surviving the few turns of desperately trying to outrun the
ghosts and get inside.

![Screenshot showing night time in the game](night.png)

It's currently possible to lose the game by running out of fuel and getting
killed by ghosts. I plan on adding a very simple combat system tomorrow to add
some tension to exploring islands and gathering junk to trade for fuel, so that
will be a third way you can lose the game.

Finally I added a menu system. Currently I'm just using it to show flavour text
when you interact with the locals in the starting town, but this will be the
basis of interacting with potential passengers and also the shop where you buy
fuel and upgrades.

![Screenshot of a menu](menu.png)

To create the graphics I used a tool I've been working on called
[text-paint](https://github.com/gridbugs/text-paint). It lets you paint with
text. I hacked it to allow exporting
[bincode](https://crates.io/crates/bincode)-encoded grids of character data
which I can deserialize in the game as backgrounds for the menu. If I get time
I'll make backgrounds for the main menu and also for the text that gets
displayed when you win and lose the game.
