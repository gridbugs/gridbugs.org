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

The OAMDMA register is mapped into the CPU's address space at address 0x4014.
Searching the disassembled program for this address reveals:
```
0xAB63  Lda(Immediate) 0x02       # load accumulator with 2
0xAB65  Sta(Absolute) 0x4014      # write accumulator to 0x4014
```
This writes the value 2 to OAMDMA causing the memory from 0x0200 to 0x02FF to be copied to OAM.
Searching the code for 0x0200, and a particular function appears obviously relevant:
```
0x8A0A  Lda(ZeroPage) 0x40           #
0x8A0C  Asl(Accumulator)             #
0x8A0D  Asl(Accumulator)             #
0x8A0E  Asl(Accumulator)             #
0x8A0F  Adc(Immediate) 0x60          #
0x8A11  Sta(ZeroPage) 0x00AA         #   *(0x00AA) = (*(0x0040) x 8) + 0x60
...
0x8A2D  Lda(ZeroPage) 0x41           #
0x8A2F  Rol(Accumulator)             #
0x8A30  Rol(Accumulator)             #
0x8A31  Rol(Accumulator)             #
0x8A32  Adc(Immediate) 0x2F          #
0x8A34  Sta(ZeroPage) 0xAB           #   *(0x00AB) = (*(0x0041) x 8) + 0x2F
...
0x8A36  Lda(ZeroPage) 0x42           #
0x8A38  Sta(ZeroPage) 0xAC           #
0x8A3A  Clc(Implied)                 #
0x8A3B  Lda(ZeroPage) 0xAC           #
0x8A3D  Rol(Accumulator)             #
0x8A3E  Rol(Accumulator)             #
0x8A3F  Sta(ZeroPage) 0xA8           #
0x8A41  Rol(Accumulator)             #
0x8A42  Adc(ZeroPage) 0xA8           #
0x8A44  Tax(Implied)                 #  IndexRegister_X = *(0x0042) x 12
...
0x8A4B  Lda(AbsoluteXIndexed) 0x8A9C #
0x8A4E  Asl(Accumulator)             #
0x8A4F  Asl(Accumulator)             #
0x8A50  Asl(Accumulator)             #
0x8A51  Clc(Implied)                 #
0x8A52  Adc(ZeroPage) 0xAB           #
0x8A54  Sta(AbsoluteYIndexed) 0x0200 #  *(0x0200 + IndexRegister_Y) =
                                     #    (*(0x8A9C + IndexRegister_X) x 8) + *(0x00AB)
...
                                     #  // several increments to IndexRegister_X
                                     #  //   and IndexRegister_Y
...
0x8A87  Lda(AbsoluteXIndexed) 0x8A9C #
0x8A8A  Asl(Accumulator)             #
0x8A8B  Asl(Accumulator)             #
0x8A8C  Asl(Accumulator)             #
0x8A8D  Clc(Implied)                 #
0x8A8E  Adc(ZeroPage) 0xAA           #
0x8A90  Sta(AbsoluteYIndexed) 0x0200 # *(0x0200 + IndexRegister_Y) =
                                     #    (*(0x8A9C + IndexRegister_X) x 8) + *(0x00AA)
```

Here's how the above code might look translated into c.
This is here purely to help communicate why the above code looks relevant.
At no point during this project did I write a line of c.
The names are my own. There's some more details that
I omitted above in the interest of brevity.

```c
byte* current_piece_tile_x = (byte*)0x0040;
byte* current_piece_tile_y = (byte*)0x0041;

#define TILE_SIZE_IN_PIXELS 8
#define BOARD_LEFT_IN_PIXELS 0x60
#define BOARD_TOP_IN_PIXELS 0x2F

byte* current_piece_pixel_x = (byte*)0x00AA;
byte* current_piece_pixel_y = (byte*)0x00AB;

// This holds a number from 0 to 12 which uniquiely identifies the current piece's shape
// and rotation. Rotational symetry is accounted for. E.g. the L piece has 4 different
// possible values, the S piece has 2, and the O piece has 1.
byte* current_piece_shape_index = (byte*)0x0042;

byte* shape_table = (byte*)0x8A9C;

#define SHAPE_TABLE_ENTRY_NUM_TILES 4      // each piece is made up of 4 tiles
#define SHAPE_TABLE_ENTRY_TILE_BYTES 3     // each tile in the shape takes up 3 bytes
#define SHAPE_TABLE_ENTRY_OFFSET_Y 0       // the first byte of the tile is its y offset
#define SHAPE_TABLE_ENTRY_SPRITE_INDEX 1   // the second is its sprite index
#define SHAPE_TABLE_ENTRY_OFFSET_X 2       // the third is its x offset
#define SHAPE_TABLE_ENTRY_BYTES (SHAPE_TABLE_ENTRY_NUM_TILES * SHAPE_TABLE_ENTRY_TILE_BYTES) // 12

byte* oam_buffer = (byte*)0x0200;

#define OAM_ENTRY_NUM_BYTES 4
#define OAM_ENTRY_PIXEL_COORD_Y 0
#define OAM_ENTRY_SPRITE_INDEX 1
#define OAM_ENTRY_ATTRIBUTES 2
#define OAM_ENTRY_PIXEL_COORD_X 3

void update_oam_buffer() {

    *current_piece_pixel_x = (*current_piece_tile_x * TILE_SIZE_IN_PIXELS) + BOARD_LEFT_IN_PIXELS;
    *current_piece_pixel_y = (*current_piece_tile_y * TILE_SIZE_IN_PIXELS) + BOARD_TOP_IN_PIXELS;

    int shape_table_index_base = *current_piece_shape_index * SHAPE_TABLE_ENTRY_BYTES;

    for (int i = 0; i < SHAPE_TABLE_ENTRY_NUM_TILES; i++) {
        int shape_table_tile_index = shape_table_index_base + (i * SHAPE_TABLE_ENTRY_TILE_BYTES);
        int tile_offset_y = shape_table[shape_table_tile_index + SHAPE_TABLE_ENTRY_OFFSET_Y];
        int sprite_index = shape_table[shape_table_tile_index + SHAPE_TABLE_ENTRY_SPRITE_INDEX];
        int tile_offset_x = shape_table[shape_table_tile_index + SHAPE_TABLE_ENTRY_OFFSET_X];

        oam_buffer[OAM_ENTRY_PIXEL_COORD_Y] =
          *current_piece_pixel_y + (tile_offset_y * TILE_SIZE_IN_PIXELS);
        oam_buffer[OAM_ENTRY_SPRITE_INDEX] = sprite_index;
        oam_buffer[OAM_ENTRY_ATTRIBUTES] = 2; // select palette 2
        oam_buffer[OAM_ENTRY_PIXEL_COORD_X] =
          *current_piece_pixel_x + (tile_offset_x * TILE_SIZE_IN_PIXELS);
    }
}

```
