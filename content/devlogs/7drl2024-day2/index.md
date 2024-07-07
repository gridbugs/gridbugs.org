+++
title = "7 Day Roguelike 2024: Animation, Music, Level Switching"
date = 2024-03-04
path = "7drl2024-day2"

[taxonomies]

[extra]
og_image = "screenshot.png"
+++

I mostly spent the day working on dynamically-generated synthesizer music. There
are currently two songs - one for the main menu and another that plays during
levels. If I get time I will add more.

![Ascii representation of a city with burning debris and a glowing green blob](screenshot.png)

<!-- more -->

I also spent some time on aesthetics, specifically porting the animation and
particle system from a previous project to add a smoke effect. This system will
eventually be used to implement projectiles for the combat system.

The level generator now generates all the levels connected by stairs. It's
possible to explore the entire "dungeon" though there is nothing to do yet.
Currently the entire dungeon is made up of vertically-connected city blocks in a
cyberpunk-style layered city. If I get time I'll make a second terrain generator
for an underground section.
