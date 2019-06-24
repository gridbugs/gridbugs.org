---
layout: post
title: "Zelda Screen Transitions are Undefined Behaviour"
date: 2019-06-20 21:30 +1000
categories: emulation
permalink: /zelda-screen-transitions-are-undefined-behaviour
excerpt_separator: <!--more-->
---
<style>
.nes-screenshot img {
    width: 512px;
    height: 512px;
    image-rendering: crisp-edges;
}
</style>

The vertical-scrolling effect in the original "The Legend of Zelda" relies on
manipulating the NES graphics hardware in a manor likely unintended by its
designers.

<div class="nes-screenshot">
<img src="/images/zelda-screen-transitions-are-undefined-behaviour/title.png">
</div>

Not having access to any official documentation for the NES Picture Processing Unit
(PPU), this is somewhat speculative. I've been relying on the
[NesDev Wiki](https://wiki.nesdev.com/w/index.php/PPU) for a specification of how
the graphics hardware behaves. The PPU is controlled by writing to a series of memory-mapped
registers, and using these registers for their (seemingly!) intended purpose,
the following effect should not be possible:

<!--more-->

<div class="nes-screenshot">
<img src="/images/zelda-screen-transitions-are-undefined-behaviour/example.gif">
</div>

Specifically, scrolling part of the background vertically, while another part of the background
(the heads up display in the upper quarter of the screen) remains stationary, can't be done by
interacting with the PPU in the expected way.

In contrast, keeping part of the screen stationary and scrolling the rest of the screen *horizontally* is
completely well-defined, as long as the stationary part is above the scrolling part.

<div class="nes-screenshot">
<img src="/images/zelda-screen-transitions-are-undefined-behaviour/horizontal-scrolling.gif">
</div>

## Types of Graphics

Graphics on the NES are split into 2 types:
 - sprites, which are tiles that can be placed at arbitrary positions on the screen and independently move around
 - the background, which is a grid of tiles which can be scrolled smoothly as a single image

To highlight the different, here's a scene made up of sprites and background:
<div class="nes-screenshot">
<img src="/images/zelda-screen-transitions-are-undefined-behaviour/sprites-and-background.gif">
</div>

Here's the same scene with only the sprites visible:
<div class="nes-screenshot">
<img src="/images/zelda-screen-transitions-are-undefined-behaviour/only-sprites.gif">
</div>

And here's the scene with only the background visible:
<div class="nes-screenshot">
<img src="/images/zelda-screen-transitions-are-undefined-behaviour/only-background.gif">
</div>


This post will only focus on background graphics.

## Scrolling

The NES Picture Processor supported smoothly (1 pixel at a time) scrolling background graphics.
To achieve this, video memory contains a grid of tiles 4 times the size of the screen.
The screen displays a screen-sized window into this grid, and the position of the window can
be precisely controlled. Moving this window 1 pixel each frame produces a smooth scrolling effect.

The video output from the NES is 256x240 pixels. The in-memory tile grid represents a 512x480
pixel area, and is broken up into 4 quadrants called "name tables", each the size of the screen. By configuring the
Picture Processing Unit (PPU), games can specify the position of the visible screen-sized window
by selecting a pixel coordinate within the in-memory tile grid.

Choosing the coordinate (0, 0) will display the entire top-left name table:

<img src="/images/zelda-screen-transitions-are-undefined-behaviour/0,0.png" style="width:50%">

Scrolling to (125, 181) shows a bit of each name table:

<img src="/images/zelda-screen-transitions-are-undefined-behaviour/125,181.png" style="width:50%">

The visible window wraps around to the far side of the in-memory tile grid.
Scrolling to (342, 290) will place the top-left corner of the visible screen inside the
bottom-right name table, and parts of each name table will be visible due to wrapping:

<img src="/images/zelda-screen-transitions-are-undefined-behaviour/342,290.png" style="width:50%">

### The Catch

Each name table is 1kb in size, but the NES only dedicates 2kb of its video memory to name tables,
so there are only 2 name tables worth of memory.

How does it hold 4 screens worth of tile grid?

Video memory is connected to the PPU in such a way that when the PPU renders a tile from one of the 4
apparent name tables, one of the 2 real name tables is selected, and read from instead. The effect of
this is that the 4 apparent name tables are made up of 2 identical pairs of name tables.

Why not just have 2 name tables then?

Fortunately, the precise mapping between apparent name table and real name table can be configured
at runtime. If a game wants to scroll horizontally, it will configure graphics hardware such that
the top-left and top-right name tables are different, so it can scroll between them without any duplication being
visible. In this configuration, the top-left and bottom-left name tables will refer to the same
real name table, and likewise the top-right and bottom-right. This configuration is named "Vertical Mirroring",
as the top 2 name tables match the bottom 2.

<img src="/images/zelda-screen-transitions-are-undefined-behaviour/vertical-mirroring.png" style="width:50%">

The other possible configuration is "Horizontal Mirroring", which games use when they want to scroll vertically.

<img src="/images/zelda-screen-transitions-are-undefined-behaviour/horizontal-mirroring.png" style="width:50%">

### Cartridges

The hardware for configuring name table mirroring doesn't actually live inside the NES console at all.
It lives in the cartridge.

<img src="/images/zelda-screen-transitions-are-undefined-behaviour/cart.jpg" style="width:50%">

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
<img src="/images/zelda-screen-transitions-are-undefined-behaviour/scroll-demo.gif" style="width:50%;height:50%;float:left">
<img src="/images/zelda-screen-transitions-are-undefined-behaviour/scroll-demo-name-table.gif" style="width:50%;height:50%">
</div>

## Screen Splitting

Each frame of video produced by the NES is drawn from top to bottom, one row of pixels at a time.
Within each row, pixels are drawn one at a time, left to right.
Mid way through drawing a frame, the game can update the PPU registers, which will affect
the yet-to-be drawn pixels. One common mid-frame change is to update the horizontal scroll position.

<div class="nes-screenshot">
<img src="/images/zelda-screen-transitions-are-undefined-behaviour/horizontal-scroll-demo.gif" style="width:50%;height:50%;float:left">
<img src="/images/zelda-screen-transitions-are-undefined-behaviour/horizontal-scroll-demo-name-table.gif" style="width:50%;height:50%">
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

## Controlling the PPU

Programs running on the NES interact with graphics hardware via memory-mapped registers.
These are special memory addresses, which can be read and written like normal memory,
except instead of storing data, they configure and query properties of the PPU.

The relevant registers for this story are:

<table>
<tr><th>Name</th><th>Address</th><th>Description</th></tr>
<tr><td>foo</td><td>aoeu</td><td>blah</td></tr>
</table>
