---
layout: post
title: "7 Day Roguelike 2018: Procgen, Visibility, Missions, Colour"
date: 2018-03-04 22:16:00 +1000
categories: gamedev roguelikes 7drl
permalink: procgen-visibility-missions-colour
excerpt_separator: <!--more-->
---

Lots of progress today! It's starting to look like a game.

![screenshot](/images/7drl2018-procgen-visibility-missions-colour/screenshot.png)
<!--more-->

The procedural generation is based on Conway's Game of Life. I wrote [a 
post](/gamedev/roguelikes/2015/09/26/cellular-automata-cave-generation.html) 
about this technique a few years ago. It creates natural-lookin caverns. I then 
place some rooms randomly, and dig tunnels so all the doors are connected to 
the main area.

For visible area detection, I'm using a library:
[shadowcast](https://crates.io/crates/shadowcast).
I implemented recursive shadowcast for an [old 
project](/gamedev/roguelikes/lighting/project/2017/12/10/another-roguelike-lighting-demo.html), 
and extracted it into a library for easy inclusion in other projects.
While adding shadowcast I found a bug in 
[prototty](https://github.com/stevebob/prototty) - my terminal rendering 
library - where foreground-only updates to a cell prevent future background 
updates of a lower depth, which manifested as the floor occasionally 
disappearing from underneath the player. I released a new version of prototty 
which fixed the bug.

I added a mission system. Missions can produce meters (the "Boss" meter on the 
right in the screenshot), and check whether they are completed. Currently the 
only mission is to kill a tough enemy, but I'll implement more missions now 
that the framework is in place.
