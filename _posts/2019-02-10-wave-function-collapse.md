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
pixel to "collapse" - choosing a tile to use for that pixel based on its
distribution. WFC gets its name from
[quantum physics](https://en.wikipedia.org/wiki/Wave_function_collapse).

The goal of this post is to build an intuition for how the WFC algorithm works.

<!--more-->

I will break WFC into two separate algorithms and explain them separately. Each
is interesting in its own right, and the interface between the layers is simple.

## Core Interface

```rust
fn wfc_core(
    adjacency_rules: AdjacencyRules,
    frequency_rules: FrequencyHints,
    output_size: (u32, u32),
) -> Grid2D<TileIndex> { ... }
```

This is the low level part of the algorithm which solves the problem of
arranging tiles into a grid according to some specified rules. I'll give a
"black box" description of the core here, and explain how it works internally
below.

### Adjacency Rules

The "core" receives a set of **adjacency rules** describing which tiles may
appear next to other tiles in each cardinal direction.  Some example rules are "Tile 6
may appear in the cell ABOVE a cell containing tile 4", and "Tile 7 map appear in
the cell to the LEFT of a cell containing tile 3.

### Frequency Hints

It also receives a set of
**frequency hints**, which is a mapping from each tile to a number indicating
how frequently the tile should appear in the output, relative to other tiles.
If tile 4 maps to 6, and tile 5 maps to 2, then tile 4 should appear 3 times as
frequently than tile 5.

### Tile Index

The core doesn't actually get to see the tiles
themselves.  Rather, tiles are referred to by integers ranging from 0 to the
number of tiles minus 1, which I'll refer to as **tile indices**. The
**adjacency rules** and **frequency hints** are all specified in terms of
**tile index**.

### Output

The algorithm
populates a grid with **tile indices** in a way which *completely* respects
**adjacency rules**, and *probabilistically* respects **frequency hints**.

## Image Processor

This is the "glue" between the core algorithm, and an input and output image.
Typically WFC is used to generate output images which are "similar" to input
images. There's no requirement that the output image be the same dimensions
as the input image.
Specifically, similar means that for some **tile size**:
 - every **tile sized** square of pixels in the output image appears somewhere in the
   input image
 - the relative frequencies of **tile sized** squares of pixels in the output
   image is roughly the same as in the input image

In other words, the output image will have the same local features as the
input image, but the global structure will be different.

Note that there are some alternative applications of WFC besides generating
similar images, such as arranging hand-crafted tiles with user-specified
**adjacency rules** and **frequency hints**. These applications would still use
the same core algorithm, but the **image processor** would be different.

### Pre Processing

```rust
fn wfc_pre_process_image(
    input_image: Image,
    tile_size: u32,     /* often 2 or 3 */
) -> (AdjacencyRules, FrequencyHints, HashMap<TileIndex, Colour>) { ... }
```

The goal of this step is generating **adjacency rules** and **frequency hints**
to be passed as input to the core algorithm.

First, we need to know what the different tiles are.
Given an **input image** and **tile size**, enumerate all the **tile size** sized
squares of pixels from the **input image**, *including* those squares whose
top-left pixel occurs within **tile size** of the right and bottom edges,
wrapping around to the other side of the input image in such cases.

Consider this 4x4 pixel input image:

![process-example](/images/wave-function-collapse/process-example.png)

With a **tile size** of 3, the first 3 tiles created by looking at squares of
pixels with their top-left corners along the top row of pixels:

![sample1](/images/wave-function-collapse/sample1.png)
![sample2](/images/wave-function-collapse/sample2.png)
![sample3](/images/wave-function-collapse/sample3.png)

In the 3rd tile, we sampled off the edge of the image. In such cases, wrap
around to the other side of the image. Effectively pretend that the image
repeats forever in all directions.

![sample3-infinite](/images/wave-function-collapse/sample3-infinite.png)

Continuing in this fashion, enumerate all the tiles. In this example there are
16, and all are unique.

![all-tiles](/images/wave-function-collapse/all-tiles.png)

Assign each tile a **tile index**. In the example, we would use numbers from 0
to 15 as indices. **Frequency hints** and **adjacency rules** will be given in
terms of **tile indices**.

The next few sections will explain how to construct **frequency hints** and
**adjacency rules** so the core algorithm generates images which are similar to
the input.

Here's an image which is similar to the example image, generated using WFC:

![grid-output](/images/wave-function-collapse/grid-output.png)

#### Reflection and Rotation

When generating tiles from an **input image**, you may want to include tiles which
aren't necessarily present in the **input image**, but are the rotation or
reflection of tiles from the **input image**.

We need a new example image to demonstrate this, as each rotation and reflection
of each tile is also in the tile set. Let's use the following **input image**:

![water-example](/images/wave-function-collapse/water-example.png)

With a **tile size** of 3, the top-left tile we extract will be:

![water1](/images/wave-function-collapse/water1.png)

All rotations and reflections of this tile:

![water1](/images/wave-function-collapse/water1.png)
![water2](/images/wave-function-collapse/water2.png)
![water3](/images/wave-function-collapse/water3.png)
![water4](/images/wave-function-collapse/water4.png)
![water5](/images/wave-function-collapse/water5.png)
![water6](/images/wave-function-collapse/water6.png)
![water7](/images/wave-function-collapse/water7.png)
![water8](/images/wave-function-collapse/water8.png)

Repeat this for all the tiles extracted from the image.

To include these tiles in the output, proceed with the rest of the algorithm as
normal, with these added to the tile set as fully qualified tiles, with their
own unique **tile indices**.

A similar image to the input *without* rotations or reflections included:

![water-orig-orientation](/images/wave-function-collapse/water-orig-orientation.png)

Here's an output with all rotations and reflections included:

![water-all-orientations](/images/wave-function-collapse/water-all-orientations.png)

#### Frequency Hints

The number of occurrences of each tile in the input image is counted, and
mappings from a tile's index to its count make up the **frequency hints**.

Let's modify the first example image:

![tall-grid-input](/images/wave-function-collapse/tall-grid-input.png)

The set of unique 3x3 tiles in this **input image** will be the same as the
first example, however where in the first example each tile appeared exactly
once, here some patterns appear several times.

The following tiles appear 5 times in this image:

![tile1](/images/wave-function-collapse/tile1.png)
![tile2](/images/wave-function-collapse/tile2.png)
![tile3](/images/wave-function-collapse/tile3.png)
![tile4](/images/wave-function-collapse/tile4.png)

The remaining tiles still just appear once.

The frequency hint for the above 4 tiles will be 5, and the hint for the other
tiles will be 1. This means that the above 4 tiles are 5 times as likely to
appear in a given position as the other tiles.

How do you think this will change the output?

![tall-grid](/images/wave-function-collapse/tall-grid.png)

Increasing the odds of vertical lines appearing means there will likely be more vertical
lines. This manifests as the grid cells in the image generally being taller than
they are wide.

#### Adjacency Rules

The core will produce a grid of **tile indices** where each index corresponds to a single pixel in
the output image. The colour of each pixel in the output image will be the
colour of the top-left pixel of the tile indicated by the corresponding **tile
index** in the grid produced by the core. Keep that in mind: *for every tile
placed, only a **single pixel** of the tile (its top-left pixel) is
actually added to the output image.* As the core assigns pixel indices to grid
cells, we can say that the core assigns
the top-left corners of tiles to output image pixels.

Remember that the goal of the **image processor** is to produce an output image
where every **tile sized** square of pixels occurs in the input image.
In order to meet this goal, we must ensure that whenever the core assigns the
top-left pixel of a tile to a pixel of the output image, the rest of the pixels
of the tile end up in the right places as well. This is best explained with an
example.

![adjacent-example1](/images/wave-function-collapse/adjacent-example1.png)

Consider 3x3 pixel tile surrounded by the red square.
It occurs in the input image (rotated anticlockwise 90 degrees, below the
bottom-right flower).
Let's assume it gets **tile index** 7.
The core algorithm decided that the grid cell corresponding to the top-left
pixel in the red square, should contain **tile index** 7.
Even though **tile index** 7 refers to the whole 3x3 tile (but only the **image
processor** knows this),
choosing **tile index** 7 for this cell resulted in only the top-left pixel of
the output image being populated.

But somehow the rest of the red square ended up looking like the tile with
**tile index** 7 as well. That's great! Every time a **tile index** is assigned to a cell,
we want a way to make sure that the entire tile's pixels - not just its top-left
pixel - end up in the right output pixels, relative to the tile's placement.
Since each tile placement just contributes the tile's top-left pixel, we need to
make sure that whenever a tile is placed within **tile size** pixels of an
already-placed tile's top-left pixel, that the newly placed
tile's pixels don't conflict with the pixels of the already-placed tile.

A convenient lie to help picture this, is to imagine that whenever
the core places a tile in a cell, each pixel in the **tile sized** square of pixels whose top-left corner is that cell,
is coloured to match the corresponding pixel of the tile, but only the top-left cell
is marked as "populated". Unpopulated (but possibly coloured) cells can have
tiles placed in them, *as long as all cells in the square filled by the new tile
are either not yet coloured, or contain the same colour as the corresponding pixel of the
new tile*.

Let's generate **adjacency rules** to force the core to never place two tiles
in positions where their overlapping pixels conflict.
Recall that an **adjacency rule** is of the form: "**Tile index** **A** may appear in the
cell 1 space in **DIRECTION** from a cell containing **tile index** **B**".
The rules should only permit **A** to be placed adjacent to **B** in
**DIRECTION** if doing so would not cause a conflict. All non-conflicting
adjacencies should be allowed.

```rust
let mut adjacency_rules = AdjacencyRules::new();
for a in all_tiles {
    for b in all_tiles {
        for direction in [LEFT, RIGHT, UP, DOWN] {
            if compatible(a, b, direction) {
                adjacency_rules.allow(a, b, direction);
            }
        }
    }
}
```

The `compatible(a: Tile, b: Tile, direction: Direction) -> bool` function returns true if and only if overlapping
`a` with `b`, if `b` is offset by 1 pixel in `direction`, the overlapping parts
of the two tiles are identical.

In the example below, `compatible(A, B, RIGHT) == true`.

![compatible-example](/images/wave-function-collapse/compatible-example.png)

In this example tiles are 3x3, but these adjacency rules only ensure that
adjacent tiles are compatible. It's possible for a pair of tiles which are 2
pixels apart to overlap. **What prevents them from conflicting?**

Consider this example:

![2-gap-overlap](/images/wave-function-collapse/2-gap-overlap.png)

The **<span style="color=red">red</span>** and **<span style="color=blue">blue</span>**  squares surround tile placements which are 2 pixels apart.
They aren't adjacent, so the **adjacency rules** don't explicitly forbid the **<span style="color=red">red</span>** 
tile's pixels and **<span style="color=blue">blue</span>**  tile's pixels from being different in the intersecting
area.

However, the existence of the **black** square, which is adjacent to both the red
and blue squares, means that the red and blue tile placements won't conflict.

Because they are adjacent, the **<span style="color:red">red</span>/black**
intersection and the
**<span style="color:blue">blue</span>/black** intersection are conflict-free. That is, the colours of pixels in the intersecting
parts of the tiles are the same in both tiles.
**<span style="color:red">Red</span>/<span style="color:blue">blue</span>** is contained in both **<span style="color:red">red</span>/black**
and **<span style="color:blue">blue</span>/black**.
Since the pixel colours in the **<span style="color:red">red</span>/<span style="color:blue">blue</span>** region of **<span style="color:red">red</span>** are the same as the pixel colours
in the corresponding region of **black**, and the pixel colours in the **<span style="color:red">red</span>/<span style="color:blue">blue</span>** region of
**black** are the same as the pixel colours in the corresponding region of
**<span style="color:blue">blue</span>**,
the pixel colours in the **<span style="color:red">red</span>/<span style="color:blue">blue</span>** region of **<span style="color:red">red</span>** are the same is the pixel colours of the corresponding region of
**<span style="color:blue">blue</span>**. That is, **<span style="color:red">red</span>/<span style="color:blue">blue</span>** is conflict free.

#### Tile/Colour Mappings

After preprocessing, the **frequency hints** and **adjacency rules** will be passed to the core algorithm,
and it will return a grid of **tile indices**. To produce the output image, we will need to know which **tile index**
refers to which colour. To help with this, the preprocessor outputs a map from **tile index** to the colour
of the top-left pixel of the corresponding tile.

### Post Processing

```rust
fn wfc_post_process_image(
    tile_index_grid: Grid2D<TileIndex>,
    top_left_pixel_of_each_tile: HashMap<TileIndex, Colour>,
) -> Image { ... }
```

The final step is trivial. Take the grid of **tile indices** produced by running the core algorithm on the **adjacency rules** and
**frequency hints** from the preprocessor, and the top-left pixel colour map, also returned by the preprocessor,
and create an output image of the same dimensions as the grid.
For each **tile index** in the grid, set the corresponding pixel colour in the output image to be
the colour associated with that **tile index** in the top-left pixel colour map.

### Putting it all together

Composing these pieces gives the full WFC algorithm.

```rust
fn wfc_image(image: Image, tile_size: u32, output_size: (u32, u32)) -> Image {
    let (adjacency_rules, frequency_hints, top_left_pixel_of_each_tile) =
        wfc_pre_process_image(image, tile_size);
    let tile_index_grid = wfc_core(adjacency_rules, frequency_hints, output_size);
    return wfc_post_process_image(tile_index_grid, top_left_pixel_of_each_tile);
}
```

## Core Internals

## Outtakes

### Accidental Procgen

While generating images for this post I accidentally ran WFC on this:

![all-tiles](/images/wave-function-collapse/all-tiles.png)

The output motivated me to add this outtakes section:

![outtake1](/images/wave-function-collapse/outtake1.png)

The gaps between the tiles in the input were transparent, and in the output they
are black, which alerted me to the fact that my WFC implementation currently
throws away transparency.

### Broken Probability Distribution

I was originally planning to use this image as an example:

![outtake2](/images/wave-function-collapse/outtake2.png)

I expected to see a roughly equal number of upwards sloping tiles and downwards
sloping tiles (as the input image is wrapped when sampling tiles):

![outtake3](/images/wave-function-collapse/outtake3.png)

But instead, the output was almost entirely made up of upwards sloping tiles:

![outtake4](/images/wave-function-collapse/outtake4.png)

After much debugging, I traced the problem to a bug in my implementation of
randomly choosing from a probability distribution:

```patch
commit ede0ea4ed4560bdcf85b4dda989937484bfec21e
Author: Stephen Sherratt <sfsherratt@gmail.com>
Date:   Sun Feb 10 21:37:59 2019 +0000

    Fix bug in probability distribution

diff --git a/wfc/src/wfc.rs b/wfc/src/wfc.rs
index 21ac889..03e6cc7 100644
--- a/wfc/src/wfc.rs
+++ b/wfc/src/wfc.rs
@@ -475,7 +475,7 @@ impl WaveCell {
         for (pattern_id, pattern_stats) in
             self.weighted_compatible_stats_enumerate(global_stats)
         {
-            if remaining > pattern_stats.weight() {
+            if remaining >= pattern_stats.weight() {
                 remaining -= pattern_stats.weight();
             } else {
                 assert!(global_stats.pattern_stats(pattern_id).is_some());
```
