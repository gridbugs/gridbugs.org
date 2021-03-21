---
layout: post
title: "Reverse-Engineering NES Tetris to add Hard Drop"
date: 2021-03-21
categories: emulation
permalink: /reverse-engineering-nes-tetris-to-add-hard-drop/
excerpt_separator: <!--more-->
---

<style>
.nes-screenshot img {
    width: 512px;
    height: 480px;
    image-rendering: crisp-edges;
    image-rendering: pixelated;
}
.nes-screenshot-half img {
    width: 256px;
    height: 240px;
    image-rendering: crisp-edges;
    image-rendering: pixelated;
}
.nes-screenshot-quarter img {
    width: 128px;
    height: 120px;
    image-rendering: crisp-edges;
    image-rendering: pixelated;
}
</style>

[Tetris for the NES](https://en.wikipedia.org/wiki/Tetris_(NES_video_game)) is one of my favourite versions of Tetris.
My only complaint is that it lacks the ability to "hard drop" - instantly dropping the current piece and locking it into place.

Let's change that!

This post describes a modification I made to NES Tetris so that pressing the "up" button causes the current piece to hard drop,
and so that the game renders a "ghost piece" - a dotted outline of the current piece showing where it will land.

<div class="nes-screenshot">
{% image screenshot1.png %}
</div>

<!--more-->

## Soft Drop and Hard Drop

The current piece moves down one space each game tick.
Tetris implementations typically provide two ways for speeding this up - soft drop and hard drop.

For soft drop, pressing a button will instantly move the current piece down one space, and holding
the button will cause it to drop faster than it otherwise would.

<div class="nes-screenshot">
{% image soft-drop-animation.webp %}
</div>

Hard drop instantly drops the current piece and locks it into place.
Because it can be difficult for the player
to visually tell whether the piece is lined up with where they want it to land, Tetris implementations with
hard drop usually display a ghost piece showing where the current piece will end up.

<div class="nes-screenshot">
{% image hard-drop-animation.webp %}
</div>

Prior to my changes, NES Tetris only supported soft drop.

## The Artefact

I made a [rust program](https://crates.io/crates/nes-tetris-hard-drop-patcher) which reads a NES ROM file in [INES](https://wiki.nesdev.com/w/index.php/INES)
format. If its input was NES Tetris (usually in a file named something like "Tetris (U) [!].nes"), it will produce as output, a new NES ROM file which
is NES Tetris, patched to have hard drop.

```
$ cargo install nes-tetris-hard-drop-patcher   # install my tool
$ nes-tetris-hard-drop-patcher < 'Tetris (U) [!].nes' > tetris-hd.nes   # patch a NES Tetris ROM
$ fceux tetris-hd.nes   # run the result in an emulator
```

This tool relies on the use to obtain an NES Tetris ROM file. It doesn't have Tetris built-in.
The resulting ROM file is compatible with all NES emulators - it's not specific to fceux.

## Tooling

A couple of years ago I made a [NES Emulator](https://github.com/stevebob/mos6502).
It turns out to be a useful reverse-engineering tool, as it's easy to instrument the emulator
to conduct experiments on the program it's running. In particular, the ability to log every
instruction, interleaved with interesting events such as video memory updates, came in very handy.
Also it can render to gifs, and I used it to generate all the animations in this post!

To test my emulator, I made a [rust library](https://crates.io/crates/mos6502_assembler) for
writing NES assembly programs in a rust embedded domain-specific language. Here's an example that
multiplies the value in the "accumulator" register by 12:
```rust
b.inst(Clc, ());                  // clear carry flag
b.inst(Rol(Accumulator), ());     // rotate accumulator 1 bit to the left (x2)
b.inst(Rol(Accumulator), ());     // rotate accumulator 1 bit to the left (x4)
b.inst(Sta(ZeroPage), 0x20);      // store current accumulator value at address 0x0020
b.inst(Rol(Accumulator), ());     // rotate accumulator 1 bit to the left (x8)
b.inst(Adc(ZeroPage), 0x20);      // add the accumulator with the value at 0x0020 (x12)
```
This lets me use rust as a macro language for NES assembly programs. The flexibility this
affords is essential when tacking custom code onto an existing program written in the 80s.

While {% local nes-emulator-debugging | debugging my emulator %} I made a simple disassembler
that can display per-function assembly of NES programs.

Finally, I used a third party NES emulator named [Mesen](https://mesen.ca/) which boasts a
rich set of debugging tools. This was helpful for getting an understanding of the current
contents of memory, and the current state of the graphics chip.

## Rendering the Ghost Piece

The NES has two different types of graphics:
 - the **background** is a grid of 8x8 pixel tiles
 - **sprites** are tiles which can be drawn at arbitrary positions on the screen

Most games use a combination of both, and Tetris is no exception.

<div class="nes-screenshot-half">
{% image demo-full.webp %}
</div>

Tetris uses sprites to draw the current piece and the next piece, and background graphics for everything else.
The images below isolate the two types of graphics in the scene above, with the background on the left and sprites on the right.

<div class="nes-screenshot-half">
{% image demo-background.webp %}
{% image demo-sprites.webp %}
</div>

The game clearly has logic already for drawing the current piece using sprites, so
the easiest way of rendering the ghost piece seems to be re-using that logic, but using
a ghostly tile rather than the normal tile.

Speaking of ghostly tiles, I added a new tile to the game to use when rendering the ghost piece:

<div class="nes-screenshot-quarter">
{% image ghost-block.png %}
</div>

To reiterate my goal, I'm hunting down the part of Tetris that renders the current piece in order to
reappropriate that code for rendering the ghost piece.

To render sprites on the NES, you populate a region of main memory with sprite metadata (position, tile, etc),
then write the address of the start of this memory region to the [OAMDMA](https://wiki.nesdev.com/w/index.php/PPU_registers#OAMDMA) register.
(Object Attribute Memory Direct Memory Access - OAM is special memory for storing sprite metadata, and DMA
is a general term for devices reading and writing main memory directly.) Writing an address to OAMDMA causes the graphics
hardware on the NES to copy sprite metadata out of the specified region of main memory, and into specialised Object Attribute Memory
which will be consulted during rendering to draw the sprites.

The OAMDMA register is mapped into the CPU's address space at address `0x4014`.
Searching the disassembled program for this address reveals:
```
0xAB63  Lda(Immediate) 0x02       # load accumulator with 2
0xAB65  Sta(Absolute) 0x4014      # write accumulator to 0x4014
```
This writes the value 2 to OAMDMA causing the memory from `0x0200` to `0x02FF` to be copied to OAM.
Searching the code for 0x0200, and one function in particular jumps out as being responsible
for populating the OAM DMA buffer. This function is at `0x8A0A` and can tell us a great deal
about how Tetris works.

It starts by reading values from addresses `0x0040` and `0x0041`, multiplying each by 8, and adding them to some offsets.
On the NES, each tile is 8x8 pixels, so this appears to be translating from a tile coordinate into a pixel coordinate,
where the offsets are the components of the pixel coordinate of the top left corner of the board.
A few minutes poking around in mesen confirms this - `0x40` is the x coordinate, and `0x41` is the y coordinate.

The function then reads from `0x42`. This location always contains a value between 0 and 12 which appears to encode the
shape of the current piece, as well as its rotation. For shapes with rotational symmetry (such as the "S" piece), the
multiple identical rotations get a single value in `0x42`. I'll refer to this value as the "shape index".

Each piece in Tetris is made up of 4 tiles, and one sprite is rendered for each tile.
The coordinate in `0x40` and `0x41` is the position of the piece, but in order to render the
sprites we must find out the position of each tile. To this end, this function consults a table in ROM
at address `0x8A9C` which I'll refer to as the "shape table". Each of the 13 pieces (including unique rotations)
has a 12-byte entry in the shape table. The entry for a piece stores 3 bytes for each of the 4 tiles:
 - the y offset of the tile (relative to `0x41`)
 - the index of the sprite to use when rendering the tile
 - the x offset of the tile (relative to `0x40`)

This function computes the location and sprite index of each tile of the current piece, and populates the
OAM DMA buffer with this information. To render the ghost piece, I need a similar function, except it renders
each tile with the ghost tile rather than the tile from the shape table, and it renders the piece at a vertical
offset so that the piece appears at the location where it would land after a hard drop.
It would be non-trivial to modify this function in-place to be general over the ghost piece and regular piece,
so instead I copy/pasted the code and changed it to do what I need.

I started by using mesen's memory viewer to locate a seemingly unused region of ROM.
I don't know why it's striped with `0x00` and `0xFF`! Also I don't know how to change mesen's font to be monospace!

{% image mesen1.png %}

I claimed 512 bytes of memory starting at address `0xD6D0`. The first code I added to this region was
a function that simply calls the existing OAM DMA buffer update function:

```rust
b.label("oam-dma-buffer-update");

// Call original function
b.inst(Jsr(Absolute), 0x8A0A);

// Return
b.inst(Rts, ());
```


My patching tool replaces all calls to the original function (`0x8A0A`) with calls to this new one.

Next I took the disassembled code from the original OAM DMA buffer update function and hand-translated
it into my rust domain-specific language for NES assembly.

This:
```
0x8A0A  Lda(ZeroPage) 0x40
0x8A0C  Asl(Accumulator)
0x8A0D  Asl(Accumulator)
0x8A0E  Asl(Accumulator)
0x8A0F  Adc(Immediate) 0x60
0x8A11  Sta(ZeroPage) 0xAA
...
```
...becomes:
```rust
b.label("render-ghost-piece"); // function label so it can be called by name later

b.inst(Lda(ZeroPage), 0x40);
b.inst(Asl(Accumulator), ());
b.inst(Asl(Accumulator), ());
b.inst(Asl(Accumulator), ());
b.inst(Adc(Immediate), 0x60);
b.inst(Sta(ZeroPage), 0xAA);
...
```

I modified my copy of the OAM DMA buffer update to use the ghost tile instead of the tile
read from the shape buffer. To test this change, I updated `oam-dma-buffer-update` to call
this function instead of the original:

```rust
b.label("oam-dma-buffer-update");

// Call new function
b.inst(Jsr(Absolute), "render-ghost-piece");

// Return
b.inst(Rts, ());
```

<div class="nes-screenshot">
{% image ghost-piece-test1.webp %}
</div>

Next I made my ghost piece rendering function take an argument specifying the vertical distance
below the current piece at which it should render the ghost piece. Eventually this will be
computed based on how many times the piece could move downwards before colliding, but first
I tried calling it with a constant (6).

```rust
b.label("oam-dma-buffer-update");

// Call original function first
b.inst(Jsr(Absolute), 0x8A0A);

// Render the ghost piece, passing the vertical offset argument in address `0x0028`.
b.inst(Lda(Immediate), 6);
b.inst(Sta(ZeroPage), 0x28);
b.inst(Jsr(Absolute), "render-ghost-piece");

// Return
b.inst(Rts, ());
```

<div class="nes-screenshot">
{% image ghost-piece-test2.webp %}
</div>

Now to compute the true vertical offset from the current piece to the place it would land after
dropping. By watching memory with mesen, I observed that nothing seemed to be using memory from `0x0020` to `0x0028`.
The first 256 bytes of memory is referred to as the "zero page" and affords faster access than the rest of memory.
I wanted 8 zero page bytes to store the X,Y coordinates of each tile of the current piece during collision detection,
and one additional byte to store temporary values during computation.

Start by initializing the values at `0x20` to `0x27` to the X,Y coordinates of each tile of the current piece:
```rust
b.label("compute-hard-drop-distance"); // function label so it can be called by name later

const SHAPE_TABLE: Address = 0x8A9C;
const ZP_PIECE_COORD_X: u8 = 0x40;
const ZP_PIECE_COORD_Y: u8 = 0x41;
const ZP_PIECE_SHAPE: u8 = 0x42;

// Multiply the shape by 12 to make an offset into the shape table,
// storing the result in IndexRegisterX.
b.inst(Lda(ZeroPage), ZP_PIECE_SHAPE);  // read shape index into accumulator
b.inst(Clc, ());               // clear carry flag to prepare for arithmetic
b.inst(Rol(Accumulator), ());  // rotate left: index * 2
b.inst(Rol(Accumulator), ());  // rotate left: index * 4
b.inst(Sta(ZeroPage), 0x20);   // store index * 4 at 0x0020
b.inst(Rol(Accumulator), ());  // rotate left: index * 8
b.inst(Adc(ZeroPage), 0x20);   // add to 0x0020: index * 12
b.inst(Tax, ());               // transfer accumulator to IndexRegisterX

// Store absolute X,Y coords of each tile by reading relative coordinates from shape table
// and adding the piece offset, storing the result in zero page 0x20..=0x27.
for i in 0..4 { // this is a rust loop - the assembly generated inside will be generated 4 times
    b.inst(Lda(AbsoluteXIndexed), Addr(SHAPE_TABLE)); // read Y offset from shape table
    b.inst(Clc, ());                                  // clear carry flag to prepare for addition
    b.inst(Adc(ZeroPage), ZP_PIECE_COORD_Y);          // add to Y coordinate of piece
    b.inst(Sta(ZeroPage), 0x21 + (i * 2));            // store the result in zero page
    b.inst(Inx, ());                                  // increment IndexRegisterX to sprite index
    b.inst(Inx, ());                                  // increment IndexRegisterX to X offset
    b.inst(Lda(AbsoluteXIndexed), Addr(SHAPE_TABLE)); // read X offset from shape table
    b.inst(Clc, ());                                  // clear carry flag to prepare for addition
    b.inst(Adc(ZeroPage), ZP_PIECE_COORD_X);          // add to X coordinate of piece
    b.inst(Sta(ZeroPage), 0x20 + (i * 2));            // store the result in zero page
    b.inst(Inx, ());                                  // increment IndexRegisterX to next tile
}
```

Now for the actual collision detection!
Repeatedly increment the Y component of each tile coordinate in the `0x20` to `0x27` addresses
until one of the tiles either collides with a locked-in tile, or goes off the bottom of the
board.
By examining memory with mesen, I learnt that the board state is stored as a row-major array
of sprite indices beginning at `0x0400`, and that `0xEF` is the index of the "empty space" tile.
The strategy will be to use the coordinate of each tile to construct an index into this
array, and stop if anything other than `0xEF` is found.

A possible point of confusion in the code below is that it implements a loop in assembly,
but there is also a rust for-loop that generates assembly. These two loops are unrelated.
The code in the rust loop is emitted 4 times, and the result makes up the body of the
assembly loop.

```rust
const BOARD_TILES: Address = 0x0400;
const EMPTY_TILE: u8 = 0xEF;
const BOARD_HEIGHT: u8 = 20;

b.inst(Ldx(Immediate), 0);   // Load 0 into IndexRegisterX - this will be our loop counter

b.label("start-ghost-depth-loop"); // This is a label - a target for branch instructions

for i in 0..4 { // the assembly in this rust loop will be emitted 4 times

    // Increment the Y component of the coordinate
    b.inst(Inc(ZeroPage), 0x21 + (i * 2));

    // Break out of the loop if the tile is off the bottom of the board
    b.inst(Lda(ZeroPage), 0x21 + (i * 2));
    b.inst(Cmp(Immediate), BOARD_HEIGHT);
    b.inst(Bpl, LabelRelativeOffset("end-ghost-depth-loop"));

    // Multiply the Y component of the coordinate by 10 (the number of columns)
    b.inst(Asl(Accumulator), ());
    b.inst(Sta(ZeroPage), 0x28); // store Y * 2
    b.inst(Asl(Accumulator), ());
    b.inst(Asl(Accumulator), ()); // accumulator now contains Y * 8
    b.inst(Clc, ());
    b.inst(Adc(ZeroPage), 0x28); // accumulator now contains Y * 10

    // Now add the X component to get the row-major index of the cell
    b.inst(Adc(ZeroPage), 0x20 + (i * 2));

    // Load the tile at that coordinate
    b.inst(Tay, ());
    b.inst(Lda(AbsoluteYIndexed), BOARD_TILES);

    // Test whether the tile is empty, breaking out of the loop if it is not
    b.inst(Cmp(Immediate), EMPTY_TILE);
    b.inst(Bne, LabelRelativeOffset("end-ghost-depth-loop"));
}
// Increment counter and loop
b.inst(Inx, ());
b.inst(Jmp(Absolute), "start-ghost-depth-loop");

b.label("end-ghost-depth-loop");
```

This results with `IndexRegisterX` containing the number of times the loop iterated, which is
also the vertical distance from the current piece to where it will end up after dropping.
For the convenience of callers, this function will return this result via the accumulator register:

```rust
// Return depth via accumulator
b.inst(Txa, ());  // transfer IndexRegisterX to accumulator
b.inst(Rts, ());  // return
```

The full body of the replacement OAM DMA buffer update function is now:

```rust
b.label("oam-dma-buffer-update");

// Call original function first
b.inst(Jsr(Absolute), 0x8A0A);

// Compute distance from current piece to drop destination, placing result in accumulator
b.inst(Jsr(Absolute), "compute-hard-drop-distance");

// Check if the distance is 0, and skip rendering the ghost piece in this case
b.inst(Beq, LabelRelativeOffset("after-render-ghost-piece"));

// Render the ghost piece, passing the vertical offset argument in address `0x0028`.
b.inst(Sta(ZeroPage), 0x28);
b.inst(Jsr(Absolute), "render-ghost-piece");

b.label("after-render-ghost-piece");

// Return
b.inst(Rts, ());
```

The result:
<div class="nes-screenshot">
{% image ghost-piece-test3.webp %}
</div>

## Adding the Hard Drop Control
