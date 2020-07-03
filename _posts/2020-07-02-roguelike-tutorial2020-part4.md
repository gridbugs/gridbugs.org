---
layout: post
title: "Roguelike Tutorial 2020: Part 4 - Field of View"
date: 2020-07-02 22:00:00 +1000
categories: gamedev roguelikes tutorial
permalink: /roguelike-tutorial-2020-part-4/
excerpt_separator: <!--more-->
og_image: screenshot-end.png
---

In this part we'll implement visible area detection, so players can only see what their
character can see, and what they remember seeing.

By the end of this part, the game will look like this:
{% image screenshot-end.png %}

<!--more-->

This part is loosely based on [this part](http://rogueliketutorials.com/tutorials/tcod/part-4/) of the
python tcod tutorial.

Reference implementation branch for starting point: [part-3-end](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-3-end)

In this post:
- [Seperate World Representation from Game State](#seperate-world-representation-from-game-state)
- [Add Field of View](#add-field-of-view)

## {% anchor seperate-world-representation-from-game-state | Seperate World Representation from Game State %}

Reference implementation branch: [part-4.0](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-4.0)

## {% anchor add-field-of-view | Add Field of View %}

{% image screenshot-end.png %}

Reference implementation branch: [part-4.1](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-4.1)

{% local roguelike-tutorial-2020-part-5 | Click here for the next part! %}
