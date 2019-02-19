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

The banner at the top of this page was generated from the following image including all
rotations and reflections:

![flowers](/images/wave-function-collapse/flowers.png)

Here's a miniature version:

![small-flower-banner](/images/wave-function-collapse/small-flower-banner.png)

Notice that the ground is missing? Since the input image is wrapped, there are
no tiles generated in which the ground ends or changes direction. This means
that if the ground is present in the output, it must form a solid line from one
side of the output to the other. This is a fairly restrictive constraint, so in
*most* output, there is no ground at all.

There *is* a small chance of the output containing ground:

![ground-flower-banner1](/images/wave-function-collapse/ground-flower-banner1.png)

It's not on the bottom of the screen, because the input image is wrapped.

![ground-flower-banner2](/images/wave-function-collapse/ground-flower-banner2.png)

Since this was generating with rotations and reflections included, there's
nothing to stop the ground from being vertical.

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
example. Here's a zoomed-in section of the banner:

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

A convenient fiction to help picture this, is to imagine that whenever
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

My goal for this section is to impart a deep understanding of how and *why* the core
algorithm works. This is the guide I wish I had during my implementation of WFC.
Maybe it can guide you through yours!

### Sudoku

Imagine you're solving a sudoku.

![sudoku](/images/wave-function-collapse/sudoku.png)

Your goal is to place a number from 1-9 in each empty cell, such that each
row, column, and 3x3 square, contains each number from 1-9 exactly once.

Suppose you're not super-confident in you're sudoku-solving abilities, and your
pencil comes equipped with an eraser. You could cheat, by writing in each cell
(in tiny writing) all the possible values for that cell. Once all the cells are
enumerated in this fashion, hopefully there will be some cells with a single
possible value. For each of these cells, you erase the tiny pencil number, and
rewrite the number in permanent marker, "locking in" your solution for that
cell.

After locking in a cell, you want to update your enumerated possibilities for
other cells in the same row, column, and 3x3 square, erasing all instances of
the number you just locked in. You hope that by doing this, you'll eliminate enough
possibilities that the next choice becomes obvious, and so on until you've
solved the entire sudoku in the least fun way possible! (This algorithm doesn't
actually work in all cases, so you may occasionally have to employ some actual thought!)

Now, imagine you wanted to solve an empty sudoku in the same way as just
described:
![sudoku-empty](/images/wave-function-collapse/sudoku-empty.png)

You're goal is still to end up with the numbers from 1-9 in every row, column,
and 3x3, but this time you're searching for 1 of a large number of possible
solutions. You start by writing in tiny pencil digits, the numbers from 1-9 in
each cell. Now you have a conundrum! Which cell do you lock in first? What
number to you write first?

Say you make your first choice arbitrarily, and write a big 3 in pen in the
top-left corner. Now you can propagate the effect of this choice by
scanning along the top-most row, left-most column, and
top-left 3x3 square, and erasing all the 3s.

What next?

If you keep choosing arbitrarily, it's very likely that at some point, you'll
lock in a number, propagate the effect, and end up erasing the last
penciled-in
number in a cell. That would be bad, as then there would be no way to complete
the soduku!

Maybe we're ok with screwing up occasionally, as long as there's a reasonable
chance that you'll end up with a valid solution each time. Then if you get into
a bad state (ie. a cell with no possibilities), you can just give up and start
over.

Intuitively, when choosing which cell to lock in next, you might want to always
choose the cell with the *fewest remaining possibilities*. If there are several
cells tied for the fewest remaining possibilities, choose arbitrarily between
them.

Concretely, your strategy is to repeat the following until all cells are locked
in:
1. Choose a cell at random, considering only the cells with the fewest possible values.
2. Choose a random value to lock in for that cell, considering only the possible
   values for that cell.
3. Propagate the effects of locking in the cell, removing the locked-in value
   from the possibilities of cells sharing the cell's row, column, and 3x3
   square.
4. If during propagation, you removed the final possibility of a cell, give up
   and start again.

The core algorithm looks very similar to this. In place of the rules of sudoku,
there are the **adjacency rules**. The **frequency hints** mean that when
choosing a value to lock in, you no longer make a uniformly random choice, but
instead choose from a *probability distribution* of the possible **tile indices**,
weighted by **frequency hints**. The fact that some tiles are more likely to
appear than others means the choice of which cell to lock in next is a little more complicated
than just choosing from the cells with the fewest possibilities. Finally,
we're going to be more clever about propagation than in the sudoku example; you
don't have to wait until a cell is locked in to eliminate possibilities from
surrounding cells.

### Rough Sketch

Here's a rough outline of the types and methods that the core will use.
I'll fill in details as they become relevant. In the spirit of Wave Function
Collapse, "collapsing" a cell will refer to locking-in the choice of which tile
index will go in the cell.

```rust
// Tile indices are just integers
type TileIndex = usize;

// corresponds to a cell in the output grid
struct CoreCell {
    // possible[tile_index] == true means tile_index may be chosen for this cell.
    // Initially, every element of this vector is `true`.
    possible: Vec<bool>,
    ...
}

struct CoreState {
    // corresponds to the output grid
    grid: Grid2D<CoreCell>,
    // initialised to the number of cells in `grid`
    remaining_uncollapsed_cells: usize,
    // arguments passed from image processor
    adjacency_rules: AdjacencyRules,
    frequency_hints: FrequencyHints,
    ...
}

impl CoreState {

    // return the coordinate of the next cell to collapse
    fn choose_next_cell(&self) -> Coord2D { ... }

    // collapse the cell at a given coordinate
    fn collapse_cell_at(&mut self, coord: Coord2D) { ... }

    // remove possibilities based on collapsed cell
    fn propagate(&mut self) { ... }

    // roughly the same as the empty sudoku solver
    fn run(&mut self) {
        while self.remaining_uncollapsed_cells > 0 {
            let next_coord = self.choose_next_cell();
            self.collapse_cell_at(next_coord);
            self.propagate();
            self.remaining_uncollapsed_cells -= 1;
        }
    }
}
```

The remainder of this chapter will flesh out the details of `choose_next_cell`,
`collapse_cell_at`, and `propagate`.

### Choose Next Cell to Collapse

In the sudoku example, we just chose randomly between the cells with the fewest
valid choices. The intuition behind this is to lock in one of the cells with the
least uncertainty. In information theory, this uncertainty is known as
[entropy](https://en.wikipedia.org/wiki/Entropy_(information_theory)). The goal
of this step is to choose randomly between the cells whose entropy is lowest.
The `possible` field of `CoreCell` can tell us which tiles are allowed in a
given cell, and the `FrequencyHints` can tell us how likely a given tile is to
appear in any cell.

#### Entropy Primer

If you have an unknown value with `n` possibilities: `x1`, `x2`, ..., `xn`,
and the probability of a given value x is expressed as `P(x)`, then the
entropy of your unknown value is:

`- P(x1) log(P(x1))  -  P(x2) log(P(x2))  -  ...  -  P(xn) log(P(xn))`

...where the base of the logarithm is arbitrary. Let's use 2 as our base since
it's efficient to compute log base 2.

To help build an intuition for this, first note that `P(x)` for all
possibilities will be between 0 and 1, and the sum:

`P(x1) + P(x2) + ... + P(xn)`

...is equal to 1. This is because `x1`...`xn` covers all possible outcomes, and one of the
outcomes will end up happening.

Each term in the entropy equation is negated. This is because `P(x)` is between
0 and 1, and regardless of the base, the logarithm of values between (exclusive)
0 and 1 is negative. Here's a graph of log base 2:

![log2](/images/wave-function-collapse/log2.png)

Since each term contains `log(P(x))`, which is always negative, we negate each
term to make the resulting entropy positive, as otherwise it would always be
negative.

#### A special case

We can simplify the entropy equation for the purposes of this algorithm.

If you have an unknown value with `n` possibilities: `x1`, `x2`, ..., `xn`,
and each probability `P(x)` can be represented by `w1 / (w1 + w2 + ... + wn)`
(`w` stands for "weight"), then the above entropy equation can be simplified.
In practical terms, this is the case when you have a discrete probability
distribution - that is, you associate a weight `wk` with each possibility `xk`.
The probability of an outcome is its weight divided by the sum of all weights.

Let `W = w1 + w2 + ... + wn` be the sum of all weights.

Then the entropy of the unknown value is:

`log(W)  -  (w1 log(w1)  +  w2 log(w2)  +  ...  +  wn log(wn))  /  W`

You can derive this equation from the original entropy equation and log
identities. It's super fun. Try it!

#### Relative Tile Frequencies

This simplified entropy definition is relevant to choosing the next cell, as
the frequency hint describes the relative probabilities of a tile appearing in
any cell.

Let's declare some methods of `FrequencyHints` and `CoreCell`:

```rust
impl FrequencyHints {
    // Returns the number of times the corresponding tile appears in the input.
    // This corresponds to the weight of a possibility in the simplified entropy
    // equation.
    fn relative_frequency(&self, tile_index: TileIndex) -> usize { ... }
}

impl CoreCell {
    // Add up the relative frequencies of all possible tiles.
    // This corresponds to the total weight (W) in the simplified entropy
    // equation.
    fn total_possible_tile_frequency(&self, freq_hint: &FrequencyHints) -> usize {
        let mut total = 0;
        for (tile_index, &is_possible) in self.possible.iter().enumerate() {
            if is_possible {
                total += freq_hint.relative_frequency(tile_index);
            }
        }
        return total;
    }
}
```

Armed with these definitions, we can compute the entropy of a cell!

```rust
impl CoreCell {
    fn entropy(&self, freq_hint: &FrequencyHints) -> f32 {

        let total_weight = self.total_possible_tile_frequency(freq_hint) as f32;

        let sum_of_weight_log_weight =
            self.possible.iter().enumerate().map(|(tile_index, &is_possible)| {
                if is_possible {
                    let rf = freq_hint.relative_frequency(tile_index) as f32;
                    return rf * rf.log2();
                } else {
                    return 0 as f32;
                }
            })
            .sum();

        return total_weight.log2() - (sum_of_weight_log_weight / total_weight);
    }
}
```

#### Caching

The `CoreCell::entropy` method currently iterates over all the tiles. It can be
made constant time with caching. Throughout the course of this algorithm,
possible tiles will be removed from cells. The only time a cell's entropy
changes is when a possible tile is removed. The caching strategy will be to keep
a running total of:
 - `w1 log(w1)  +  w2 log(w2)  +  ...  +  wn log(wn)` of the possible tiles
 - `W = w1  +  w2  +  ...  +  wn` of the possible tiles


Adding to the definition of `CoreCell`:

```rust
struct CoreCell {
    possible: Vec<bool>,

    // new fields:

    sum_of_possible_tile_weights: usize,

    sum_of_possible_tile_weight_log_weights: f32,
    ...
}
```

Keep these fields up to date:

```rust
impl CoreCell {
    fn remove_tile(&mut self, tile_index: TileIndex, freq_hint: &FrequencyHints) {
        self.possible[tile_index] = false;

        let freq = freq_hint.relative_frequency(tile_index);

        self.sum_of_possible_tile_weights -= freq;

        self.sum_of_possible_tile_weight_log_weights -=
            (freq as f32) * (freq as f32).log2();
    }
}
```

And now our entropy calculation becomes much simpler:

```rust
impl CoreCell {
    fn entropy(&self) -> f32 {
        return (self.sum_of_possible_tile_weights as f32).log2()
            - (self.sum_of_possible_weight_log_weights /
                self.sum_of_possible_tile_weights as f32)
    }
}
```

It may also be worth it to cache `(freq as f32) * (freq as f32).log2()` for
each relative frequency, inside the `FrequencyHints` type, as it would then only
need to be computed once for each tile rather than each time a tile is removed
from a cell.

#### Choosing Randomly

The goal of this step is to choose randomly between the minimum entropy cells.
So far we can compute the entropy of a cell, but if there's a tie, how do we
randomly break it. We *could* maintain a list of all the minimum entropy cells
and then choose randomly from it, but this sounds like a lot of work.
Instead, let's
just added a small amount of noise to each entropy calculation! We can save
needing to invoke a random number generator for each entropy calculation by
caching the noise:

```rust
struct CoreCell {
    possible: Vec<bool>,
    sum_of_possible_tile_weights: usize,
    sum_of_possible_tile_weight_log_weights: f32,

    // new fields:

    // initialise to a tiny random value:
    entropy_noise: f32,
    ...
}
```

In the entropy calculation, just add `entropy_noise` to the previously
calculated value to get a noisy value. If all the entropy calculations are
noisy, there won't be any ties to break!

#### Choosing the Minimum Entropy Cell

We can now compute a noisy entropy for each cell, so now we just need to iterate
over all the cells and keep track of the cell with the lowest entropy, right?

Well we *could*, but remember there's one cell per output image pixel, and
200x200 pixel output images are not unheard of. Do we really want to iterate
over 40,000 cells at *every* step of the algorithm? The definition of
`CoreState::run` above invokes `choose_next_cell` once for each collapsed cell,
which is effectively once per cell again. 40,000x40,000 is not a nice number!

Rather than iterating over all the cells each time we need to choose the minimum
entropy cell, maintain a
[heap](https://en.wikipedia.org/wiki/Heap_(data_structure)) of cells, keyed by
their entropy. Whenever the entropy of a cell changes, push it to the heap.
To find the minimum entropy cell, pop from the heap until you get a cell which
hasn't been collapsed yet. If a cell's entropy changes multiple times, you'll
end up inserting it into the heap multiple times too. When popping from the
heap, you need a way of knowing whether each cell that you pop has been
collapsed yet so you can skip it.

```rust
struct CoreCell {
    possible: Vec<bool>,
    sum_of_possible_tile_weights: usize,
    sum_of_possible_tile_weight_log_weights: f32,
    entropy_noise: f32,

    // new fields:

    // initialise to false, set to true after collapsing
    is_collapsed: bool,
    ...
}
```

### Collapse Cell

```rust
impl CoreState {
    // collapse the cell at a given coordinate
    fn collapse_cell_at(&mut self, coord: Coord2D) { ... }
}
```

The previous section explained how to choose which cell to collapse next.
Now we need a way of choosing which tile to lock in. This method will select
randomly between all possible tiles for the chosen cell, assigning probabilities
based on `FrequencyHints`.

We'll now choose from a probability distribution, where possible values are the
tile indices yielded by this iterator, and weights come from
`FrequencyHints::relative_frequency`.

Say for a given cell, the remaining possible tile indices are 2, 4, 7, and 8,
and their relative frequencies are indicated by the width of their section of
the strip below.

![probdist](/images/wave-function-collapse/probdist.png)

We want to choose a random position within this strip, and see which section we
ended up in. Naturally, we're more likely to end up in one of the wider
sections.

![probdist-choice](/images/wave-function-collapse/probdist-choice.png)

Here we landed on 7, so we lock in 7 for this cell.

Translating this diagram into code, we'll choose a random number between `0` and
`cell.sum_of_possible_tile_weights` (which we conveniently introduced in the
"Caching" section). This is analogous to choosing a random position within the
strip. To determine the tile index, we'll decrease
the chosen number by each weight (the width of strips) until doing so would make
it negative.

```rust
impl CoreCell {

    // it will be convenient to be able to iterate over all possible tile indices
    fn possible_tile_iter(&self) -> impl Iterator<Item=TileIndex> { ... }

    fn choose_tile_index(&self, frequency_hints: &FrequencyHints) -> TileIndex {
        // the random position in the strip
        let mut remaining =
            random_int_between(0, self.sum_of_possible_tile_weights);

        for possible_tile_index in self.possible_tile_iter() {

            // the width of the section of strip
            let weight =
                frequency_hints.relative_frequency(possible_tile_index);

            if remaining >= weight {
                remaining -= weight;
            } else {
                return possible_tile_index;
            }
        }

        // should not end up here
        unreachable!("sum_of_possible_weights was inconsistent with \
            possible_tile_iter and FrequencyHints::relative_frequency");
    }
}
```

It's now fairly straightforward to implement `collapse_cell_at`:

```rust
impl CoreState {
    // collapse the cell at a given coordinate
    fn collapse_cell_at(&mut self, coord: Coord2D) {
        let mut cell = self.grid.get(coord);
        let tile_index_to_lock_in = cell.choose_tile_index(&self.frequency_hints);

        cell.is_collapsed = true;

        // remove all other possibilities
        for (tile_index, possible) in cell.possible.iter_mut().enumerate() {
            if tile_index != tile_index_to_lock_in {
                *possible = false;
                // We _could_ call
                // `cell.remove_tile(tile_index, &self.frequency_hints)` here
                // instead of explicitly setting `possible` to false, however
                // there's no need to update the cached sums of weights for this
                // cell. It's collapsed now, so we no longer care about its
                // entropy.
            }
        }
    }
}
```

### Propagate

## Further Reading

### My Rust Libraries

Shameless plug!
My rust libraries which implement this algorithm are here: [github.com/stevebob/wfc](https://github.com/stevebob/wfc)

It's split into 2 crates:

 - [wfc](https://crates.io/crates/wfc) is the image processor and core, which
   works with any grid of comparable values
 - [wfc_image](https://crates.io/crates/wfc_image) is a wrapper of wfc
   specifically for working with image files

It also contains some example applications and interesting input images.

### WaveFunctionCollaspe Repo

My inspiration to make this library, came from this repo:
[github.com/mxgmn/WaveFunctionCollapse](https://github.com/mxgmn/WaveFunctionCollapse),
There are many great WFC resources listed in the [Notable ports, forks and
spinoffs](https://github.com/mxgmn/WaveFunctionCollapse#notable-ports-forks-and-spinoffs)
section.

### fast-wfc

One such port is [fast-wfc](https://github.com/math-fehr/fast-wfc), which I
found to be particularly helpful as a reference for understanding how the
algorithm works. Most of my knowledge of WFC came from reverse
engineering this library.

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
