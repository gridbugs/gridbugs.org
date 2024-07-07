+++
title = "Simple Wolfenstein-3D-esque renderer"
date = 2020-10-28
path = "simple-wolfenstein-3D-esque-renderer"
+++

Just for fun I implemented a simple 3D renderer using the technique employed in Wolfenstein 3D.
The world is procedurally generated using the technique described
[here](@/blog/cellular-automata-cave-generation/index.md).
The renderer works by finding the depth of walls for each row of pixels on the screen, and
drawing a vertically-centered vertical wall-coloured strip whose length is inversely proportional
to the wall depth at that point. Wall colour has brightness inversely proportional to the
square of the straight-line distance from the eye to the wall in the direction of the pixel row.

![screenshot.png](screenshot.png)

<!-- more -->

Code: [https://github.com/gridbugs/small-wolf](https://github.com/gridbugs/small-wolf)

Demo: [https://gridbugs.github.io/small-wolf](https://gridbugs.github.io/small-wolf)
