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


