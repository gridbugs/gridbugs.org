---
layout: post
title: "Roguelike Tutorial 2020: Part 3 - Generating a Dungeon"
date: 2020-06-19 20:00:00 +1000
categories: gamedev roguelikes tutorial
permalink: /roguelike-tutorial-2020-part-3/
excerpt_separator: <!--more-->
og_image: screenshot.png
---

The definition of "roguelike" is [hotly debated](http://www.gamesofgrey.com/blog/?p=403)
but one aspect we can all agree on is that levels must be procedurally generated.
That is, rather than fixed, hand-crafted levels, players will explore levels generated
according to an algorithm; each playthrough will be unique, and it's _highly_ unlikely that
any other player will ever see the same levels as you.

In this part we'll implement an algorithm for procedurally generating a dungeon!

<!--more-->

This part is loosely based on [this part](http://rogueliketutorials.com/tutorials/tcod/part-3/) of the
python tcod tutorial.

Reference implementation branch for starting point: [part-2-end](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-2-end)

Reference implementation branch: [part-3-end](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-3-end)
