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
may be adjacent to each other tile, and relatively how frequently each tile should appear.
The algorithm maintains, for each pixel of the output image, a probability
distribution of the tiles which may be placed there. It repeatedly chooses a
pixel to "collapse" - choosing a pattern to use for that pixel based on its
distribution. WFC gets its name from
[quantum physics](https://en.wikipedia.org/wiki/Wave_function_collapse).

The goal of this post is to build an intuition for how the WFC algorithm works.

<!--more-->

## Interface

WFC takes as input:

 - a collection of equally-sized, square, unique tiles, each represented as a 2d grid of colours
 - a mapping from each tile to the relative frequency with which it should appear in the output
 - the dimensions of the output image

WFC produces as output:

 - an image with the property that every tile-sized square of pixels in the
   image is one of the input tiles, and each tile appears with roughly the
   specified relative frequency

## Mosaic

You're a student in the art of mosaic, and your mysterious master presents you
with a box full of equally-sized, square tiles, and asks you to place them on a
wooden rectangular board to create a picture. Upon each tile, are 9 coloured
cells, arranged into 3 rows and 3 columns.  The top-left corner of each tile is
marked with an "X". Most tiles have some duplicates with the same pattern, and
some tiles have more duplicates than others.  You see that the board is also
divided into rows and columns, with cells the same size as those on the tiles.
Your master explains that because you are such an advanced student, for this
task you must follow some **esoteric and seemingly-arbitrary instructions**:

 1. You must place tiles such that the cells on the tiles are aligned with the
    cells on the board.
 2. You may place a tile so that it partially overlaps with already-placed
    tiles, provided that you only cover coloured cells with cells of matching
    colours (that is, once a board cell contains a colour, it must always
    contain that colour, even as it gets covered by other tiles).
 3. Your master is watching. Each time you want to place a tile, you must first
    declare to your master the 3x3-cell area of the board which it will cover.
    Your master examines this area, and fills a bag with all the tiles that may
    be placed there, according to rule 2.  (Some tiles may be incompatible with
    the chosen position, as they have coloured cells which would overlap with
    different coloured cells of already-placed tiles.) You must then draw a tile
    from the bag at random, and place it on the board in your chosen position.
 4. You must orientate tiles with the "X" in the top-left corner when you place
    them on the board.
 5. After placing a tile, your master obtains an identical tile from somewhere,
    so that placing a tile doesn't affect the odds of drawing an identical tile
    from the bag later.
 6. If, upon examining your chosen tile position, your master finds that no
    tiles may be placed, you must start afresh with an empty board.
 7. Your task is **not** complete when you have covered the entire board. You
    are only finished when every cell of the board contains an "X", possibly
    covered up by another tile.  That is, you have placed the top-left corner of
    a tile in every cell of the board. The bottom 2 rows and right 2 columns may
    be left without an "X".

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

## Using a sample image as input

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

Each unique `SIZE` x `SIZE` square of pixels in the sample image is one of your
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
