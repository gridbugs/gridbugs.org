---
layout: post
title: "Zelda Screen Transitions are Undefined Behaviour"
date: 2019-06-20 21:30 +1000
categories: emulation
permalink: /zelda-screen-transitions-are-undefined-behaviour/
excerpt_separator: <!--more-->
og_image: example.gif
---
<style>
.nes-screenshot img {
    width: 512px;
    height: 480px;
    image-rendering: crisp-edges;
}
.short-table tr {
    line-height: 0px;
}
</style>

The vertical scrolling effect in the original "The Legend of Zelda" relies on
manipulating the NES graphics hardware in a manor likely that was unintended by its
designers.

<div class="nes-screenshot">
{% image title.png %}
</div>

Since I don't have access
to any official documentation for the NES Picture Processing Unit
(PPU - the graphics chip), my claim of "undefined behaviour" is somewhat speculative.
I've been relying on the
[NesDev Wiki](https://wiki.nesdev.com/w/index.php/PPU) for a specification of how
the graphics hardware behaves. The PPU is controlled by writing to memory-mapped
registers. Using these registers for their (seemingly!) intended purposes,
the following effect should not be possible:

<!--more-->

<div class="nes-screenshot">
{% image example.gif %}
</div>

When scrolling the screen vertically, the entire screen has to scroll together.
The above video is an example of Partial Vertical Scrolling.
Part of the screen remains stationary (the Heads Up Display)
while another part (the game area) scrolls vertically.
Partial vertical scrolling, can't be done by
interacting with the PPU in the "normal" way.

Partial *horizontal* scrolling, on the other hand, is
completely well-defined.

<div class="nes-screenshot">
{% image horizontal-scrolling.gif %}
</div>

Writing to a particular PPU register while a frame is being drawn can result in graphical artefacts.
The Legend of Zelda intentionally causes an artefact which manifests itself as partial vertical scrolling.
This post gives some background on NES graphics hardware, and explains how the partial vertical scrolling trick works.

## Types of Graphics

The NES has 2 types of graphics:
 - sprites, which are tiles that can be placed at arbitrary positions on the screen and independently move around
 - the background, which is a grid of tiles that can be scrolled smoothly as a single image

To highlight the difference, here's a scene made up of sprites and background:
<div class="nes-screenshot">
{% image sprites-and-background.gif %}
</div>

Here's the same scene with only the sprites visible:
<div class="nes-screenshot">
{% image only-sprites.gif %}
</div>

And here's the scene with only the background visible:
<div class="nes-screenshot">
{% image only-background.gif %}
</div>

## Scrolling

The NES Picture Processor supports scrolling background graphics.
In video memory, the background graphics are stored as a 2D grid of tiles,
covering an area twice the width and twice the height of the screen.
The screen displays a screen-sized window into this grid, and the position of the window can
be finely controlled. Gradually moving the visible window within the grid produces a smooth scrolling effect.

The video output from the NES is 256x240 pixels. The in-memory tile grid represents a 512x480
pixel area, and is broken up into 4 screen-sized quadrants called "name tables". Games can configure the
Picture Processing Unit (PPU), to specify the position of the visible screen-sized window
by selecting a pixel coordinate within the grid of name tables.

Choosing the coordinate (0, 0) will display the entire top-left name table:

{% image 0,0.png style="width:50%" %}

Scrolling to (125, 181) shows a bit of each name table:

{% image 125,181.png style="width:50%" %}

The visible window wraps around to the far side of the in-memory tile grid.
Scrolling to (342, 290) will place the top-left corner of the visible screen inside the
bottom-right name table, and parts of each name table will be visible due to wrapping:

{% image 342,290.png style="width:50%" %}

### Not Enough Memory!

Each name table is 1kb in size, but the NES only dedicates 2kb of its video memory to name tables,
so only 2 name tables can fit in memory.

How can there be 4 name tables?

#### Name Table Mirroring

Video memory is connected to the PPU in such a way that when the PPU renders a tile from one of the 4
apparent name tables, one of the 2 real name tables is selected, and read from instead. This effectively
means that the 4 apparent name tables are made up of 2 identical pairs of name tables.

This image shows a snapshot of the contents of all 4 name tables. The top-left and top-right are identical,
as are the bottom-left and bottom-right.

<div class="nes-screenshot">
{% image name-table-mirroring.png %}
</div>

Why not just have 2 name tables then?

Fortunately, the precise mapping between apparent name table and real name table can be configured
at runtime. If a game wants to scroll horizontally, it will configure graphics hardware such that
the top-left and top-right name tables are different, so it can scroll between them without any visible duplication.
In this configuration, the top-left and bottom-left name tables will refer to the same
real name table, and likewise the top-right and bottom-right. This configuration is named "Vertical Mirroring".

{% image vertical-mirroring.png style="width:50%" %}

The other possible configuration is "Horizontal Mirroring", which games use when they want to scroll vertically.

{% image horizontal-mirroring.png style="width:50%" %}

Games usually don't scroll diagonally, as it produces artifacts around the edge of the screen due to name table
mirroring.

### Cartridges

Each game's cartridge contains hardware which allows name table mirroring to be configured.

{% image cart.jpg style="width:50%" %}

Some games don't ever need to change mirroring, so their cartridges are hardwired to either horizontal
or vertical mirroring. Other games need to dynamically switch between the two modes, so their cartridge
can be configured by software to mirror horizontally or vertically. The Legend of Zelda falls into this
category. Finally, some really fancy games come with
extra video memory in the cartridge, which means they don't need to mirror at all, and can scroll
horizontally and vertically at the same time without any visible duplication.

### A real example

On the left is an example of vertical scrolling as it would appear on the screen.
On the right is a recording of the name tables, with horizontal mirroring, and the currently-visible
window highlighted.

<div class="nes-screenshot">
{% image scroll-demo.gif style="width:50%;height:50%;float:left" %}
{% image scroll-demo-name-table.gif style="width:50%;height:50%" %}
</div>

Remember, vertical scrolling itself isn't unusual at all - just *split screen* vertical scrolling.

## Screen Splitting

Each frame of video produced by the NES is drawn from top to bottom, one row of pixels at a time.
Within each row, pixels are drawn one at a time, left to right.
Mid way through drawing a frame, the game can reconfigure the PPU, which effects how the yet-to-be
drawn pixels will be displayed. One common mid-frame change is to update the horizontal scroll position.

<div class="nes-screenshot">
{% image horizontal-scroll-demo.gif style="width:50%;height:50%;float:left" %}
{% image horizontal-scroll-demo-name-table.gif style="width:50%;height:50%" %}
</div>

When scrolling horizontally between rooms, The Legend of Zelda always starts with scroll set
to (0, 0), and renders the heads up display at the top of the screen.
After the final row of pixels of the heads up display has been drawn to the screen,
the horizontal scroll is changed by a value which increases slightly each frame,
causing the camera to pan smoothly.

The name table view shows how the game is changing from horizontal mirroring to vertical mirroring before
it starts scrolling, then back to horizontal mirroring once the transition is complete. Also, while the scroll
is in progress, the top-left (and bottom-left) name table is updated to contain a copy of the room being entered.
Once the scroll is finished, the game stops splitting the screen, and renders entirely from the top-left name table
again.

### Measuring Draw Progress

In order to split the screen at the correct position, the game needs a way of finding out how much of the
current frame has been drawn.
Pixel rows are rendered at a known rate, so it's possible to tell which row of pixels is currently being
drawn by counting the number of CPU cycles that have passed since the start of the frame.

There is another, more accurate technique, called "Sprite Zero Hit".

The NES can draw 64 sprites at a time. The first sprite in video memory is referred to as "Sprite Zero".
Each frame, the first time an opaque pixel of sprite zero overlaps with an opaque pixel of the background,
an event called "Sprite Zero Hit" occurs. This has the effect of setting a bit in one of the memory-mapped
PPU registers, which can be checked by the CPU.

To use Sprite Zero Hit to split the screen, games place sprite zero at a vertical position near the boundary
of the split, and during rendering, repeatedly check whether a Sprite Zero Hit has occurred.
When Sprite Zero Hit occurs, the game changes the horizontal scroll to effect the split.

This shows a horizontal room transition with and without the background.

<div class="nes-screenshot">
{% image horizontal-scroll-demo-fast.gif style="width:50%;height:50%;float:left" %}
{% image horizontal-scroll-demo-sprites.gif style="width:50%;height:50%" %}
</div>

The brown circle
which appears at the start of the transition, and vanishes at the end, is sprite zero.
Looking closer at the HUD with and without the background:

{% image hud.png style="width:512px;image-rendering:crisp-edges" %}
{% image hud-sprites.png style="width:512px;image-rendering:crisp-edges" %}

Sprite zero is a discoloured bomb sprite, lined up exactly with the regular bomb sprite in the game's HUD.
Sprite zero is configured to appear behind the background, but since the black pixels in the HUD are considered
transparent, the sprite zero bomb would be visible if it wasn't strategically positioned behind the HUD bomb.

Note that the sprite zero hit occurs several pixel rows before the bottom row of the HUD.
It occurs at the top pixel of the fuse of the bomb, which is 16 pixels from the bottom of the HUD.
When sprite zero hit happens, the game starts counting CPU cycles, and sets the horizontal scroll
after a specific number of cycles have passed.

## Vertical Blanking

The majority of the time, the NES PPU is drawing pixels to the screen.
There is a brief period of "downtime" in between frames during which no drawing
is taking place. This is known as the "Vertical Blank" or "vblank".
Some types of PPU configuration changes can only be made during vblank.

## The Scroll Register

Games change the scroll position by writing to a PPU register named `PPUSCROLL`,
which is mapped at address `0x2005`. The first write to `PPUSCROLL` sets the X component
of the scroll position, and the second write sets the Y component. Writes continue to
alternate in this fashion.

This lists all the non-zero writes to `PPUSCROLL` during this (slow motion) 16 frame recording of
the story screen. The Y component of the scroll position is incremented once every 2 frames.
All `PPUSCROLL` writes occur during vblank in this example, which causes the entire background
to scroll together.

<div class="nes-screenshot">
{% image short-text-scroll.gif style="width:50%;height:50%;float:left" %}
{% image short-text-scroll-name-table.gif style="width:50%;height:50%" %}
</div>

<table class="short-table">
<tr><th>Frame</th><th>Sub-Frame</th><th>Component</th><th>Value</th></tr>
<tr><td>0</td><td>VBlank</td><td>Y</td><td>110</td></tr>
<tr><td>1</td><td>VBlank</td><td>Y</td><td>110</td></tr>
<tr><td>2</td><td>VBlank</td><td>Y</td><td>111</td></tr>
<tr><td>3</td><td>VBlank</td><td>Y</td><td>111</td></tr>
<tr><td>4</td><td>VBlank</td><td>Y</td><td>112</td></tr>
<tr><td>5</td><td>VBlank</td><td>Y</td><td>112</td></tr>
<tr><td>6</td><td>VBlank</td><td>Y</td><td>113</td></tr>
<tr><td>7</td><td>VBlank</td><td>Y</td><td>113</td></tr>
<tr><td>8</td><td>VBlank</td><td>Y</td><td>114</td></tr>
<tr><td>9</td><td>VBlank</td><td>Y</td><td>114</td></tr>
<tr><td>10</td><td>VBlank</td><td>Y</td><td>115</td></tr>
<tr><td>11</td><td>VBlank</td><td>Y</td><td>115</td></tr>
<tr><td>12</td><td>VBlank</td><td>Y</td><td>116</td></tr>
<tr><td>13</td><td>VBlank</td><td>Y</td><td>116</td></tr>
<tr><td>14</td><td>VBlank</td><td>Y</td><td>117</td></tr>
<tr><td>15</td><td>VBlank</td><td>Y</td><td>117</td></tr>
</table>

### Split Screen Scrolling

Writes to `PPUSCROLL` during vblank take effect at the beginning of frame drawn immediately
after the vblank.
If the scroll position is changed while a frame is being drawn (ie. outside of vblank), it takes effect when drawing
reaches the next row of pixels. Partial horizontal scrolling works by writing to `PPUSCROLL`
while the PPU is drawing the last line of pixels before the scroll should happen.

<div class="nes-screenshot">
{% image short-horizontal-scroll.gif style="width:50%;height:50%;float:left" %}
{% image short-horizontal-scroll-name-table.gif style="width:50%;height:50%" %}
</div>

<table class="short-table">
<tr><th>Frame</th><th>Sub-Frame</th><th>Component</th><th>Value</th></tr>
<tr><td>0</td><td>Pixel Row 63</td><td>X</td><td>72</td></tr>
<tr><td>1</td><td>Pixel Row 63</td><td>X</td><td>76</td></tr>
<tr><td>2</td><td>Pixel Row 63</td><td>X</td><td>80</td></tr>
<tr><td>3</td><td>Pixel Row 63</td><td>X</td><td>84</td></tr>
<tr><td>4</td><td>Pixel Row 63</td><td>X</td><td>88</td></tr>
<tr><td>5</td><td>Pixel Row 63</td><td>X</td><td>92</td></tr>
<tr><td>6</td><td>Pixel Row 63</td><td>X</td><td>96</td></tr>
<tr><td>7</td><td>Pixel Row 63</td><td>X</td><td>100</td></tr>
<tr><td>8</td><td>Pixel Row 63</td><td>X</td><td>104</td></tr>
<tr><td>9</td><td>Pixel Row 63</td><td>X</td><td>108</td></tr>
<tr><td>10</td><td>Pixel Row 63</td><td>X</td><td>112</td></tr>
<tr><td>11</td><td>Pixel Row 63</td><td>X</td><td>116</td></tr>
<tr><td>12</td><td>Pixel Row 63</td><td>X</td><td>120</td></tr>
<tr><td>13</td><td>Pixel Row 63</td><td>X</td><td>124</td></tr>
<tr><td>14</td><td>Pixel Row 63</td><td>X</td><td>128</td></tr>
<tr><td>15</td><td>Pixel Row 63</td><td>X</td><td>132</td></tr>
</table>


When the scroll position is updated mid-frame, only the X component of the scroll position
is applied. That is, the Y component
of scroll positions set mid-frame are ignored. Thus, if a game wants to
split the screen, and change the scroll position of part of the frame, it may only scroll horizontally.

And yet:

<div class="nes-screenshot">
{% image short-vertical-scroll.gif style="width:50%;height:50%;float:left" %}
{% image short-vertical-scroll-name-table.gif style="width:50%;height:50%" %}
</div>

Believe it or not, the `PPUSCROLL` register is not changed during this transition.

You may notice a 1-pixel high graphical artefact just below the HUD. This is a bug in my emulator
caused by not synchronising CPU clock cycles with per-pixel rendering.

### Interference with Other Registers

A second register, named `PPUADDR`, mapped to `0x2006`, is used to set the current video memory
address. When the game wants to change, for example,
one of the tiles in a name table, it first writes the video memory address of the tile to `PPUADDR`,
then writes the new value of the tile to `PPUDATA` - a third register mapped to `0x2007`.

Writing to `PPUADDR` outside of vblank (ie. while the frame is drawing) can cause graphical
artefacts. This is because the PPU circuitry affected by writing `PPUADDR` is also manipulated
directly by the PPU as it retrieves tiles from video memory for the purposes of drawing them. As
drawing proceeds from the top to the bottom of the screen, and left to right within each
pixel row, the PPU effectively sets `PPUADDR` to the address of the tile containing the pixel
currently being drawn. When drawing moves from one tile to another, the `PPUADDR` is changed
by incrementing its current value.

Thus writing to `PPUADDR` mid-frame can alter the tiles which the PPU would fetch from memory
for the duration of the current frame.

Let's log writes to `PPUADDR` during the vertical transition. Since the name table is also being
updated during the transition, logging _all_ writes to `PPUADDR` would be noisy. In the horizontal
transition, the scroll was set while drawing pixel row 63, so we'll just look at `PPUADDR` writes
during this row.

<div class="nes-screenshot">
{% image short-vertical-scroll.gif style="width:50%;height:50%;float:left" %}
{% image short-vertical-scroll-name-table.gif style="width:50%;height:50%" %}
</div>

<table class="short-table">
<tr><th>Frame</th><th>Sub-Frame</th><th>Address</th></tr>
<tr><td>0</td><td>Pixel Row 63</td><td>0x2280</td></tr>
<tr><td>1</td><td>Pixel Row 63</td><td>0x2280</td></tr>
<tr><td>2</td><td>Pixel Row 63</td><td>0x2260</td></tr>
<tr><td>3</td><td>Pixel Row 63</td><td>0x2260</td></tr>
<tr><td>4</td><td>Pixel Row 63</td><td>0x2240</td></tr>
<tr><td>5</td><td>Pixel Row 63</td><td>0x2240</td></tr>
<tr><td>6</td><td>Pixel Row 63</td><td>0x2220</td></tr>
<tr><td>7</td><td>Pixel Row 63</td><td>0x2220</td></tr>
<tr><td>8</td><td>Pixel Row 63</td><td>0x2200</td></tr>
<tr><td>9</td><td>Pixel Row 63</td><td>0x2200</td></tr>
<tr><td>10</td><td>Pixel Row 63</td><td>0x21E0</td></tr>
<tr><td>11</td><td>Pixel Row 63</td><td>0x21E0</td></tr>
<tr><td>12</td><td>Pixel Row 63</td><td>0x21C0</td></tr>
<tr><td>13</td><td>Pixel Row 63</td><td>0x21C0</td></tr>
<tr><td>14</td><td>Pixel Row 63</td><td>0x21A0</td></tr>
<tr><td>15</td><td>Pixel Row 63</td><td>0x21A0</td></tr>
</table>

There's a clear pattern. Every 2 frames, the address written on pixel row 63 is decreased
by 32 (0x20). But how does this translate into updating the effective scroll position?

### The _Real_ Scroll Register

Internal to the PPU, and not mapped into the CPU's memory, is a 15 bit register which
is used as both the current video memory address to access, and background scroll configuration.

When treating this value as an address, bit 14 is ignored, and bits 0-13 are treated as an
address in video memory.

When treating the register as scroll configuration, different parts of its contents have different
meanings, according to this table.

<style>
.bg-red {
    background-color: #F47C7C;
}
.bg-yellow {
    background-color: #F7F48B;
}
.bg-green {
    background-color: #A1DE93;
}
.bg-blue {
    background-color: #70A1D7;
}
.black-text-table tr td {
    color: black;
}
</style>

<table class="black-text-table">
<tr>
<th>Bit</th>
<td class="bg-red">14</td>
<td class="bg-red">13</td>
<td class="bg-red">12</td>
<td class="bg-yellow">11</td>
<td class="bg-yellow">10</td>
<td class="bg-green">9</td>
<td class="bg-green">8</td>
<td class="bg-green">7</td>
<td class="bg-green">6</td>
<td class="bg-green">5</td>
<td class="bg-blue">4</td>
<td class="bg-blue">3</td>
<td class="bg-blue">2</td>
<td class="bg-blue">1</td>
<td class="bg-blue">0</td>
</tr>
<tr>
<th>Meaning</th>
<td colspan="3" class="bg-red" style="text-align:center">Fine Y Scroll</td>
<td colspan="2" class="bg-yellow" style="text-align:center">Name Table Select</td>
<td colspan="5" class="bg-green" style="text-align:center">Coarse Y Scroll</td>
<td colspan="5" class="bg-blue" style="text-align:center">Coarse X Scroll</td>
</tr>
</table>

<span class="bg-yellow">**Name Table Select**</span> is a value from 0 to 3, and selects the name table currently being drawn from.

<span class="bg-blue">**Coarse X Scroll**</span> and
<span class="bg-green">**Coarse Y Scroll**</span> give the coordinate of a tile within
the selected name table. This is the tile currently being drawn.

<span class="bg-red">**Fine Y Scroll**</span> contains a value from 0 to 7, and specifies the current vertical offset of the row of
pixels within the current tile. Tiles are 8 pixels square.

**Fine X Scroll** is absent from this register. There is a separate register which just contains the
horizontal offset of the current pixel, but it won't be relevant for explaining how The Legend of Zelda
performs vertical scrolling.

What happens to this register when the game writes `PPUADDR`? Here are the first 3 writes from the demo above.

<table class="black-text-table">
<tr>
<th>Bit</th>
<td class="bg-red">14</td>
<td class="bg-red">13</td>
<td class="bg-red">12</td>
<td class="bg-yellow">11</td>
<td class="bg-yellow">10</td>
<td class="bg-green">9</td>
<td class="bg-green">8</td>
<td class="bg-green">7</td>
<td class="bg-green">6</td>
<td class="bg-green">5</td>
<td class="bg-blue">4</td>
<td class="bg-blue">3</td>
<td class="bg-blue">2</td>
<td class="bg-blue">1</td>
<td class="bg-blue">0</td>
</tr>
<tr>
<th>Meaning</th>
<td colspan="3" class="bg-red" style="text-align:center">Fine Y Scroll</td>
<td colspan="2" class="bg-yellow" style="text-align:center">Name Table Select</td>
<td colspan="5" class="bg-green" style="text-align:center">Coarse Y Scroll</td>
<td colspan="5" class="bg-blue" style="text-align:center">Coarse X Scroll</td>
</tr>
<tr>
<th><span style="font-family:monospace">0x2280</span> Bits</th>
<td class="bg-red">0</td>
<td class="bg-red">1</td>
<td class="bg-red">0</td>
<td class="bg-yellow">0</td>
<td class="bg-yellow">0</td>
<td class="bg-green">1</td>
<td class="bg-green">0</td>
<td class="bg-green">1</td>
<td class="bg-green">0</td>
<td class="bg-green">0</td>
<td class="bg-blue">0</td>
<td class="bg-blue">0</td>
<td class="bg-blue">0</td>
<td class="bg-blue">0</td>
<td class="bg-blue">0</td>
</tr>
<tr>
<th><span style="font-family:monospace">0x2280</span> Parts</th>
<td colspan="3" class="bg-red" style="text-align:center">2</td>
<td colspan="2" class="bg-yellow" style="text-align:center">0</td>
<td colspan="5" class="bg-green" style="text-align:center">20</td>
<td colspan="5" class="bg-blue" style="text-align:center">0</td>
</tr>
<tr>
<th><span style="font-family:monospace">0x2260</span> Bits</th>
<td class="bg-red">0</td>
<td class="bg-red">1</td>
<td class="bg-red">0</td>
<td class="bg-yellow">0</td>
<td class="bg-yellow">0</td>
<td class="bg-green">1</td>
<td class="bg-green">0</td>
<td class="bg-green">0</td>
<td class="bg-green">1</td>
<td class="bg-green">1</td>
<td class="bg-blue">0</td>
<td class="bg-blue">0</td>
<td class="bg-blue">0</td>
<td class="bg-blue">0</td>
<td class="bg-blue">0</td>
</tr>
<tr>
<th><span style="font-family:monospace">0x2260</span> Parts</th>
<td colspan="3" class="bg-red" style="text-align:center">2</td>
<td colspan="2" class="bg-yellow" style="text-align:center">0</td>
<td colspan="5" class="bg-green" style="text-align:center">19</td>
<td colspan="5" class="bg-blue" style="text-align:center">0</td>
</tr>
<tr>
<th><span style="font-family:monospace">0x2240</span> Bits</th>
<td class="bg-red">0</td>
<td class="bg-red">1</td>
<td class="bg-red">0</td>
<td class="bg-yellow">0</td>
<td class="bg-yellow">0</td>
<td class="bg-green">1</td>
<td class="bg-green">0</td>
<td class="bg-green">0</td>
<td class="bg-green">1</td>
<td class="bg-green">0</td>
<td class="bg-blue">0</td>
<td class="bg-blue">0</td>
<td class="bg-blue">0</td>
<td class="bg-blue">0</td>
<td class="bg-blue">0</td>
</tr>
<tr>
<th><span style="font-family:monospace">0x2240</span> Parts</th>
<td colspan="3" class="bg-red" style="text-align:center">2</td>
<td colspan="2" class="bg-yellow" style="text-align:center">0</td>
<td colspan="5" class="bg-green" style="text-align:center">18</td>
<td colspan="5" class="bg-blue" style="text-align:center">0</td>
</tr>
</table>

Breaking the address writes into their scroll components, it's clear what's going on
here. Every 2 frames, the
<span class="bg-green">**Coarse Y Scroll**</span>
is decremented, effecting a vertical scroll of 1 tile or 8 pixels.

The initial scroll is 0,0 during each frame of the vertical transition, and then
the address is written on pixel row 63.
This means the first 63 rows of pixels are drawn from the top of the selected
name table, which contains the HUD background.
The 64th pixel row and onwards however, are drawn with the vertical scroll
applied from this address.
As that vertical scroll is decremented every second frame, this gives
the impression of vertical scrolling of part of the screen.

### Scroll Down to Scroll Up

The Legend of Zelda can't completely hide this trick from players.
It produces a visible artefact on vertical screen transitions which you can see if you
look closely.
When moving up between rooms, the first frame of the scroll animation scrolls down instead.
Here's the animation in extreme slow motion.

<div class="nes-screenshot">
{% image brief-scroll-down.gif style="width:50%;height:50%;float:left" %}
{% image brief-scroll-down-name-table.gif style="width:50%;height:50%" %}
</div>

The name table view shows what's going on. While to players it may look like the visible area
is smoothly scrolling up, the scroll transition begins by moving the visible area from the top-left
name table to the bottom-left name table, which contains a copy of the room background. This is
necessary, as the HUD at the top of the screen is also part of the name table, so if the visible
area was to scroll up from its original position, it would scroll past the HUD.

The vertical scrolling is implemented by writing to the `PPUADDR` register mid-frame, and the very
first value written is `0x2800`. 2 frames later, `0x23A0` is written, and then starts decrementing
the value by 32 every other frame.

<table class="black-text-table">
<tr>
<th>Bit</th>
<td class="bg-red">14</td>
<td class="bg-red">13</td>
<td class="bg-red">12</td>
<td class="bg-yellow">11</td>
<td class="bg-yellow">10</td>
<td class="bg-green">9</td>
<td class="bg-green">8</td>
<td class="bg-green">7</td>
<td class="bg-green">6</td>
<td class="bg-green">5</td>
<td class="bg-blue">4</td>
<td class="bg-blue">3</td>
<td class="bg-blue">2</td>
<td class="bg-blue">1</td>
<td class="bg-blue">0</td>
</tr>
<tr>
<th>Meaning</th>
<td colspan="3" class="bg-red" style="text-align:center">Fine Y Scroll</td>
<td colspan="2" class="bg-yellow" style="text-align:center">Name Table Select</td>
<td colspan="5" class="bg-green" style="text-align:center">Coarse Y Scroll</td>
<td colspan="5" class="bg-blue" style="text-align:center">Coarse X Scroll</td>
</tr>
<tr>
<th><span style="font-family:monospace">0x2800</span> Bits</th>
<td class="bg-red">0</td>
<td class="bg-red">1</td>
<td class="bg-red">0</td>
<td class="bg-yellow">1</td>
<td class="bg-yellow">0</td>
<td class="bg-green">0</td>
<td class="bg-green">0</td>
<td class="bg-green">0</td>
<td class="bg-green">0</td>
<td class="bg-green">0</td>
<td class="bg-blue">0</td>
<td class="bg-blue">0</td>
<td class="bg-blue">0</td>
<td class="bg-blue">0</td>
<td class="bg-blue">0</td>
</tr>
<tr>
<th><span style="font-family:monospace">0x2800</span> Parts</th>
<td colspan="3" class="bg-red" style="text-align:center">2</td>
<td colspan="2" class="bg-yellow" style="text-align:center">2</td>
<td colspan="5" class="bg-green" style="text-align:center">0</td>
<td colspan="5" class="bg-blue" style="text-align:center">0</td>
</tr>
<tr>
<th><span style="font-family:monospace">0x23A0</span> Bits</th>
<td class="bg-red">0</td>
<td class="bg-red">1</td>
<td class="bg-red">0</td>
<td class="bg-yellow">0</td>
<td class="bg-yellow">0</td>
<td class="bg-green">1</td>
<td class="bg-green">1</td>
<td class="bg-green">1</td>
<td class="bg-green">0</td>
<td class="bg-green">1</td>
<td class="bg-blue">0</td>
<td class="bg-blue">0</td>
<td class="bg-blue">0</td>
<td class="bg-blue">0</td>
<td class="bg-blue">0</td>
</tr>
<tr>
<th><span style="font-family:monospace">0x23A0</span> Parts</th>
<td colspan="3" class="bg-red" style="text-align:center">2</td>
<td colspan="2" class="bg-yellow" style="text-align:center">0</td>
<td colspan="5" class="bg-green" style="text-align:center">29</td>
<td colspan="5" class="bg-blue" style="text-align:center">0</td>
</tr>
</table>

Writing `0x2800` to `PPUADDR` sets the
<span class="bg-yellow">**Name Table Select**</span>
to 2, which will render out of the bottom-left name table.
Since both scroll values are 0, it will start with the top-left
tile of this name table. However, the
<span class="bg-red">**Fine Y Scroll**</span> is 2, so there
is a 2-pixel vertical offset from the top of the bottom-left
name table, which is why on the very first frame of the transition,
you see a 2-pixel high black bar at the bottom of the screen.
The initial scroll setting for the transition animation is 2-pixels
below where it would need to be for the transition to be seamless.

2 frames later, `0x23A0` is written to `PPUADDR`. This brings
us back to the top-left name table, and we're rendering from the 29th
row of tiles, which is the very bottom row. Still, the
<span class="bg-red">**Fine Y Scroll**</span> contains a 2.

Why is it necessary to set the
<span class="bg-red">**Fine Y Scroll**</span> to 2?
Why couldn't the game just write `0x0800` and `0x03A0`
and not have to suffer the 2-pixel offset?

The 4 name tables occupy a 4kb region of the PPU's address space
from `0x2000` to `0x2FFF`.
Each tile in a name table occupies a single byte of video memory (they're really just indices into another table),
and the order of tiles and name tables
in video memory is such that the
<span class="bg-yellow">**Name Table Select**</span>,
<span class="bg-green">**Coarse Y Scroll**</span> and
<span class="bg-blue">**Coarse X Scroll**</span>
comprise the offset of a tile within the name table region of memory.
That is, taking the low 12 bits of the internal PPU register,
and adding it to `0x2000`, you can find the video memory address
of a tile. This is no coincidence! This is precisely what allows
this register to be treated as both an address register, and
a scroll register.

With one caveat.

When treating it as an address register, bits 12 and 13 are treated
as part of the address. During rendering, the PPU is constantly updating
this register with the address of the tile it's currently drawing.
As tiles located in name tables, and name tables are in the region
of memory from `0x2000` to `0x2FFF`, the PPU will be setting the register
to values within this range.

When a game writes to `PPUADDR` mid frame, if it doesn't write the address
of a tile in a name table, the PPU will attempt to read from *somewhere else*
in video memory. Whatever bytes it happens to read will be treated as tiles,
which will likely lead to undesirable outcomes. So every mid-frame write to
`PPUADDR` must lie between `0x2000` and `0x2FFF`. Taking every number
in that range, and considering its scroll components, the value of
<span class="bg-red">**Fine Y Scroll**</span> will always be 2.

This limitation means that you can't change the
<span class="bg-red">**Fine Y Scroll**</span> mid-frame,
which means that when using this trick to implement split-screen
vertical scrolling, you're constrained to scroll 8 pixels at a time, and always with a 2-pixel vertical offset
from a tile boundary.
The Legend of Zelda scrolls 4 pixels per frame when scrolling
horizontally, but scrolls 8 pixels every 2 frames when scrolling
vertically, and this explains why.

The artefact is also visible when scrolling down between rooms, but it occurs
at the end of the animation instead.

<div class="nes-screenshot">
{% image both-scroll-vertical.gif style="width:50%;height:50%;float:left" %}
{% image both-scroll-vertical-name-table.gif style="width:50%;height:50%" %}
</div>

## Further Reading

- The [NesDev Wiki](https://wiki.nesdev.com/) is an invaluable resource for learning about NES hardware.
  Specifically relevant to this post are the pages about [PPU Scrolling](https://wiki.nesdev.com/w/index.php/PPU_scrolling)
  and [PPU Registers](https://wiki.nesdev.com/w/index.php/PPU_registers).
- My still very much incomplete NES emulator is [here](https://github.com/stevebob/mos6502).


## Notes

Before I learnt about the internal PPU register, my emulator would display a wipe
effect on vertical screen transitions in The Legend of Zelda.

<div class="nes-screenshot">
{% image vertical-wipe.gif style="width:50%;height:50%;float:left" %}
{% image vertical-wipe-name-table.gif style="width:50%;height:50%" %}
</div>

The Link sprite would slide down the screen as intended, but the background would not scroll.
The wipe is caused by the game gradually updating the name table to contain the new room's graphics,
but not scrolling to keep the updates off-screen.
