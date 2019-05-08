---
layout: post
title: "NES Emulator Debugging"
date: 2019-05-08 08:00 +1000
categories: emulation
permalink: /nes-emulator-debugging/
excerpt_separator: <!--more-->
---
<style>
.nes-emulator-debugging-screenshot img {
    width: 512px;
    height: 512px;
    image-rendering: crisp-edges;
}
</style>

Making an emulator for a 1980s game console is an exercise in reading and comprehension.
The work is mostly translating documentation into code.
It's oddly satisfying, building a model of an ancient machine,
instruction by instruction, device by device, especially when it can start running real programs.
You end up with an appreciation for the capabilities (or lack thereof) of hardware at the time,
and necessarily end up with in-depth knowledge of the inner workings of a piece of computing history.

This post is not about making an emulator.

It is about the nightmarish, overwhelmingly complex, and at times seemingly hopeless
task of hunting down the parts of your emulator that don't behave exactly
as the real hardware would.

<div class="nes-emulator-debugging-screenshot">
<img src="/images/nes-emulator-debugging/example.png">
</div>

<!--more-->

I'm making an emulator for the [Nintendo Entertainment System (NES)](https://en.wikipedia.org/wiki/Nintendo_Entertainment_System).
To test my emulator, I run the game [Mario Bros.](https://en.wikipedia.org/wiki/Mario_Bros.)
When you start up this game, it displays a menu for about 30 seconds, then plays a demo of gameplay.
Once I had the CPU and video output working to the point that _something_ not completely unintelligible was being rendered,
I ran the game. I wasn't emulating input yet, so I waited for the demo to play.

<div class="nes-emulator-debugging-screenshot">
<img src="/images/nes-emulator-debugging/demo.gif">
</div>

Hey, it mostly works!

There's no gravity, Mario and Luigi look wrong when they face to the right, and platforms get wider
when you hit them from below. These artifacts are the manifestation of emulator bugs that would take
the better part of a month to find.
