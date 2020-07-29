---
layout: series-part
series: roguelike-tutorial-2020
index: 8
date: 2020-07-29 18:00:00 +1000
title: "Part 8 - Items and Inventory"
permalink: /roguelike-tutorial-2020-part-8/
og_image: item-menu.png
---

In this part we'll introduce items, and add an inventory menu.

By the end of this part, the game will look like this:

{% image item-menu.png %}

<!--more-->

This part is loosely based on [this part](http://rogueliketutorials.com/tutorials/tcod/part-8/) of the
python tcod tutorial.

Reference implementation branch for starting point: [part-7-end](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-7-end)

In this post:
 - [Placing Health Potions](#placing-health-potions)
 - [Adding Items to Inventory](#adding-items-to-inventory)
 - [Using and Dropping Items](#using-and-dropping-items)
 - [Event Routine Intro](#event-routine-intro)
 - [State Machine Management with Event Routines](#state-machine-management-with-event-routines)
 - [Death Screen](#death-screen)

## {% anchor placing-health-potions | Placing Health Potions %}

{% image health-potions.png %}

Reference implementation branch: [part-8.0](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-8.0)

## {% anchor adding-items-to-inventory | Adding Items to Inventory %}

{% image get-health-potion.png %}

Reference implementation branch: [part-8.1](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-8.1)

## {% anchor using-and-dropping-items | Using and Dropping Items %}

{% image item-menu.png %}
{% image use-health-potion.png %}
{% image drop-menu.png %}
{% image drop-log.png %}
{% image drop-ground.png %}

Reference implementation branch: [part-8.2](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-8.2)

## {% anchor event-routine-intro | Event Routine Intro %}

Reference implementation branch: [part-8.3](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-8.3)

## {% anchor state-machine-management-with-event-routines | State Machine Management with Event Routines  %}

Reference implementation branch: [part-8.4](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-8.4)

## {% anchor death-screen | Death Screen %}

{% image death-screen.png %}

Reference implementation branch: [part-8.5](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-8.5)

{% local roguelike-tutorial-2020-part-9 | Click here for the next part! %}
