---
layout: post
title: "Wave Function Collapse"
date: 2019-02-10
permalink: /wave-function-collapse/ 
categories: algorithms gamedev procgen
excerpt_separator: <!--more-->
---

![flower-banner](/images/wave-function-collapse/flower-banner-scaled.png)
Wave Function Collapse is a procedural generation algorithm which produces
images by arranging a collection of tiles according to rules about which tiles
may be adjacent to each tile, and relatively how frequently each tile should appear.
The algorithm maintains, for each pixel of the output image, a probability
distribution of the tiles which may be placed there. It repeatedly chooses a
pixel to "collapse" - choosing a pattern to use for that pixel based on its
distribution. WFC gets its name from
[quantum physics](https://en.wikipedia.org/wiki/Wave_function_collapse).

<!--more-->

## Interface

### Input

 - **dimensions**: the width and height of the output image
 - **tiles**: a collection of unique tiles, each represented by a square pattern of pixels. Each tile
   must be the same size, which I'll refer to later as `SIZE`.
 - **adjacency rules**: a mapping from each tile to a collection of (tile, direction) tuples,
   representing adjacency rules, where "direction" is one of UP, DOWN, LEFT,
   RIGHT. If tile `A` maps to `[(B, UP), ...]`, it indicates that tile `B` may
   appear above tile `A` in the output. Adjacencies must be symmetrical. For
   example, if `A` maps to `([(B, UP), ....])`, then `B` must map to `[(A, DOWN),...]`,
   since if `B` may appear *above* `A`, then `A` may also appear *below* `B`.
   More on adjacency [below](#adjacency_).
 - **freqeuncy rules**: a mapping from each tile to a number representing the relative frequency with
   which it should appear in the output (e.g. in the output, a tile with frequency 6 will
   appear (approximately) twice as frequently as a tile with frequency 3)

### Output

WFC produces as output, an image with the following properties:
 - it has the specified **dimensions**
 - each `SIZE` x `SIZE` square of pixels in the image is one of the input **tiles**
 - **adjacency rules** are always respected. That is, for each pair of `SIZE` x `SIZE` pixels `A` and `B` where
   `A` is adjacent to `B` in direction `DIR`, the adjacency rules contain
   mappings from `A` to `(B, DIR)`, and from `B` to `(A, OPPOSITE(DIR))`.
 - **frequency rules** are respected probabilistically. Each time a tile is chosen for part of the output, its
   frequency is used as a weight in a probability distribution made up of all
   tiles which are legal, according to the **adjacency rules**.

<!-- ublock origin hides elements with id="adjacency"? -->
<h3 id="adjacency_">Adjacency</h3>

### Using an example output as input
