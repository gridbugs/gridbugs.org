+++
title = "Fixing a Five Year Old Lighting Bug in my Game Engine"
date = 2024-11-04
path = "fixing-a-five-year-old-lighting-bug-in-my-game-engine"

[taxonomies]
tags = ["gamedev", "lighting", "roguelikes"]
+++

In late 2019 I returned to Australia after living abroad for two years and had
a few months to myself before starting my next job. I spent some of this
time consolidating my roguelike development side projects into a collection of Rust
libraries and a template that comprises the ad-hoc game engine that I've
been using ever since. These include libraries for path-finding, rendering grids
of text with WebGPU, a real-time particle system, a database for organizing
entities, and a lighting system which is the subject of this post.

There are two tasks the lighting system needs to do. The first is to determine
which parts of the map are illuminated by each light. This is the same problem
as detecting which parts of the map the player can see and is solved by a
library I made called [shadowcast](https://github.com/gridbugs/shadowcast).
This library knows how to compute which parts of the map are visible, and which
parts of the map are lit by each light, and combine this information to
determine what the player should see.

For example this screenshot shows a player (the @-sign) standing in a room lit with white
light, and to their south there is a doorway leading into a room lit with red
light. Note the wall to their right is illuminated with white light, as the
player can see the side of the wall facing the white light.

![A square grid map showing the player in a room lit with white light next to a
doorway leading south into a second room lit with red light](shadowcast-demo1.png)

Now look what happens when the player walks through the door into the room lit
with red light:

![A square grid map showing the player in a room lit with red light next to a
doorway leading north into a second room lit with white light](shadowcast-demo2.png)

That same piece of wall now appears as red, because the side of the wall visible
to the player is now illuminated by red light. It's the same wall, and as far as
game logic is concerned it's just a row of wall tiles, but the lighting system
takes edges and corners of walls into account so tiles are rendered in colours
according to the colours of only the lights that illuminate the parts of walls
that the player can see.

This library is rock solid and I haven't had to think about it in years; it's so
reliable that I've started taking it for granted. It's
not the source of today's bug. I just wanted to show off a bit.

The second task performed by the lighting system is determining the intensity of
the light at each point of the map. Notice in the images above that there are
parts of the map that are well-lit, and others that appear in shadow. The lights
themselves aren't visible in those images, but the further a point is from a
light source, the dimmer the effect of the light will be at that point. The
relationship between brightness and distance is some fairly simple arithmetic -
much much simpler than computing the lit area of the map - but I got the maths
wrong and didn't notice for almost five years!

Well I did suspect something was wrong with it a couple of times. The brightness
of the lights seemed to drop off with distance in an unnatural-looking way. Too
slowly up to a point and then too quickly. I checked and double checked the
maths and managed to convince myself that it was correct, and then I'd just
compensate for it by messing with the brightness of the lights in whatever game
I was working on. Pretty much all the roguelike development I've done over the
past five years has been in a game jam setting and I was always too busy with
the jam to properly investigate. That is until this year's 7DRL when I finally
relented and sat down with a pen and paper to conclude once and for all that
the maths was wrong and had been wrong this whole time, and when I fixed it my
game went from looking like this:

![Gameplay from the traditional roguelike "Electric Organ" from before this bug
was fixed](electric-organ-bad.png)

To this:

![The same screenshot as above, but with the lighting fixed. There's a much
bigger visual difference between the dark areas and let areas of the map.](electric-organ-good.png)

Obviously it's not a fair comparison because most of the aesthetic decisions
about the game were made after fixing this bug. But getting the lighting right
was crucial to the visuals I was trying to create, with
lots of dark places and flickering fire light and it's important that the
dynamic changes to the lighting were accurately reflected in the environment.

So now that the bug is fixed I thought it might be interesting to dig through the
history of how this code was written and to try to understand why I implemented such a simple piece
of arithmetic incorrectly, and why the bug was so hard to spot from looking at
the code. I'll also backport the fix to all the games I've made since 2019 that
suffer from this bug and share some before and after pics.

## The Inverse Square Rule

![](plot1.png)
![](plot2.png)
![](plot3.png)
![](plot5.png)
![](plot4.png)
![](plot6.png)
![](plot7.png)
