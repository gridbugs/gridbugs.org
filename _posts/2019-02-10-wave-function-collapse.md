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

A pair of `SIZE` x `SIZE`
squares of pixels are adjacent if the coordinates of their top-left pixels
differ by 1 in a single axis, and 0 in the other axis. That is, one
square is exactly 1 pixel up, down, left, or right from the other square.
The squares will overlap unless `SIZE = 1`..
Below are some examples where `SIZE = 3`.

In the image below, the red and blue squares are adjacent because their positions
differ by 1 in the x axis, and 0 in the y axis:

![adjacent-example1](/images/wave-function-collapse/adjacent-example1.png)

In the image below, the red and blue squares are adjacent because their positions
differ by 1 in the y axis, and 0 in the x axis:

![adjacent-example2](/images/wave-function-collapse/adjacent-example2.png)

In the image below, the red and blue squares are **not** adjacent because their positions
differ by 1 in the y axis, and 1 in the x axis. The positions of adjacent tiles must differ
in one axis only, and the positions of the squares below are different in both axes.

![not-adjacent-example1](/images/wave-function-collapse/not-adjacent-example1.png)

In the image below, the red and blue squares are **not** adjacent because their positions
differ by 3 in the x axis. The positions of adjacent tiles must differ
by exactly 1.

![not-adjacent-example2](/images/wave-function-collapse/not-adjacent-example2.png)

### Compatible Tiles

As per the definition of adjacency above, adjacent tiles in the output image overlap.
Since tiles in the output image are adjacent only if their adjacency is
explicitly allowed by the adjacency rules, this implies that if the adjacency
rules permit a pair of tiles to adjacent in a given direction, the pixels in
common between the two tiles when they overlap must be the same.

A tile `A` is **compatible** with a tile `B` in a direction `DIR` if you can
overlay `B` on top of `A` shifted 1 pixel in `DIR`, and for each pixel of `A`,
the pixel of `B` which overlaps it is the same colour, ignoring pixels with
no overlapping pixel.

In the diagram below, `A` is compatible with `B` in the `LEFT` direction.
The overlapping region is highlighted.

![compatible-example](/images/wave-function-collapse/compatible-example.png)

## Using a sample output image as input

If you're goal is to produce a particular aesthetic with this algorithm, or to
just experiment and search for interesting patterns, chances are that manually
crafting a tile set, adjacency rules, and frequency rules will be too difficult. Instead, you can
craft an image with the desired aesthetic, and derive from it the inputs to the
WFC algorithm.

The banner at the top of this page was generated from the following image
(credit to [mxgmn](https://github.com/mxgmn/WaveFunctionCollapse)).

![flowers](/images/wave-function-collapse/flowers.png)

The process of deriving a tile set, adjacency rules, and frequency rules from an
image is the following.

### Tile Set

Manually choose a `SIZE`. The example above uses `SIZE = 3`. Larger numbers
tend to produce more structured output, but also place more constraints on the
output which WFC may be unlikely to satisfy. Experiment
to find one that produces the desired effect.

Each unique `SIZE` x `SIZE` square of pixels in the input image is one of your
tiles. Depending on your desired results, you might consider two tiles, where
one is a rotation or reflection of the other, to be the same.

Every 3x3 pixel square in the banner image appears in the above image at least once,
though it may be rotated or reflected.

### Adjacency Rules

These are derived from compatible tiles. Recall that adjacency rules are a set
of mappings from tiles to (tile, direction) tuples. Each tile will map to all
the tiles and directions it is compatible with.

In other words, if a tile `A` is compatible with another tile `B` in direction
`DIR`, then the adjacency rules will allow `A` and `B` to be adjacent in
direction `DIR`.

### Frequency Rules

The goal is for the distribution of tiles in the output to be the same in the
distribution of tiles in the sample image. Recall that the frequency rules are a
mapping from each tile to a number indicating the relative frequency with which
that tile should occur in the output. Each tile will map to the number of times
it occurs in the sample.

### Where is the ground?

![small-flower-banner](/images/wave-function-collapse/small-flower-banner.png)

The sample image contains a strip of ground, but the banner doesn't. What gives?

This question brings up some interesting points about running WFC with a sample
image as input.

#### Some tiles may never appear

It's entirely
possible that a tile with a non-zero input frequency in the frequency rules
won't appear at all in the output.
Remember that frequency rules are enforced probabilistically, and the adjacency
rules have a higher priority, so WFC may never get a chance to use a particular
tile, because the adjacency rules never permit it.

If I run WFC on this sample enough times, eventually I'll get an
output image with ground in it.

![ground-flower-banner1](/images/wave-function-collapse/ground-flower-banner1.png)

#### The input image is wrapped

Why is the ground in the sky?

When generating tiles from the input image, the question arises: What should
we do with `SIZE` x `SIZE` squares which go off the edge of the image?
The simplest choice is to wrap around to the other side of the sample.

This means that one of the generated tiles looks like this:

![sky-ground](/images/wave-function-collapse/sky-ground.png)

So the ground can happily be in the sky!

You can avoid behaviour like this by manually configuring the generator in
between initialising it and running it to make certain choices impossible in
certain cells.

#### You only get out what you put in

WFC will not invent new tiles for you. I ran WFC additional times in search of
more ground. In all the outputs with ground, it occupied an image-wide strip.

![ground-flower-banner2](/images/wave-function-collapse/ground-flower-banner2.png)

The ground can be vertical, since I allow rotations and reflections when
generating the tile set.

The ground in the sample is 2 pixels wide, and my `SIZE = 3`, so every tile
containing ground also contains some sky. The border between ground and sky
determines the direction of the ground. There are no tiles in the tile set in
which the ground changes direction or stops, so once the ground begins, it must
continue to both edges of the output image.

This is the reason the ground is so uncommon! There must be an empty strip
across the entire width or height of the image which the ground can fit inside,
or no ground tiles will be chosen.

#### There are no global constraints

Every decision WFC makes is local - choosing tiles based purely on the tiles
around it and hints about tile frequency. Macroscopic effects, such as "stalks
may only be terminated by a flower" emerge from a carefully crafted set of
tiles and rules.

Nothing says that the ground can't appear twice, thought it is very unlikely.

![double-ground](/images/wave-function-collapse/double-ground.png)

# The WFC Algorithm

