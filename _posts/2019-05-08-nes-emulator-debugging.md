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
and necessarily end up intimately familiar with the inner workings of a piece of computing history.

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
When you start the game, it displays a menu for about 30 seconds, then plays a demo of gameplay.
Once I had the CPU and video output working to the point that _something_ not completely unintelligible was being rendered,
I ran the game. I wasn't emulating input yet, so I waited for the demo to play.

<div class="nes-emulator-debugging-screenshot">
<img src="/images/nes-emulator-debugging/demo.gif">
</div>

Hey, it mostly works!

There's no gravity, Mario and Luigi look wrong when they face to the right, and platforms get wider
when you hit them from below. These artifacts are the manifestation of emulator bugs that would take
the better part of a month to find.

## Debugging Printouts

The core of my debugging strategy is logging each instruction that is executed, and printing extra information
when something meaningful happens. In the case of the "no gravity" problem, I identified the address that stores
the vertical position of the first turtle (`0x0368`). The value it holds while the turtle is floating instead of
falling is `0x2C`. I theorised that at some point, the game is writing `0x2C` to `0x0368` when it should be writing
something _else_, so I instrumented the emulator to print a message whenever `0x2C` was read from any address in
memory, and also when address `0x0368` was written to.

Here's a snippet of the output showing the Y position of the turtle being set to `0x2C`.

```
CBDA  Iny(Implied)
CBDB  Inx(Implied)
CBDC  Cpx(Immediate) 20
CBDE  Bne(Relative) F6
CBD6  Lda(ZeroPageXIndexed) B0
reading 2C from B8
CBD8  Sta(IndirectYIndexed) 14
writing 2C to t1 y position
```

The non-human-readable lines are executed instructions. For example:
```
CBD6  Lda(ZeroPageXIndexed) B0
```

 - Address of instruction: `0xCBD6`
 - Instruction: `Lda`
 - Addressing Mode (ie. how to interpret the instruction argument): `ZeroPageXIndexed`
 - Instruction Argument: `0xB0`

The execution trace above is copying the turtle's Y position from `0x00B8` to `0x0368`.
The `Lda` instruction reads a value from memory into a CPU register called the "accumulator".
The `Sta` instruction stores the accumulator in memory. This is part of a loop that transfers
data from the "zero page" - the first 256 bytes of memory - into other parts of memory.
The zero page is fast to access because most instructions have several addressing modes
specifically for offsetting into the zero page. It seems that Mario Bros. uses the zero page
for function arguments and return values, and other temporary intra-frame storage.
The 0xB0 address read from above is, at other points in the execution, used to store the
Y position of other characters. For inter-frame storage of character data, address in
`0x0300` - `0x0400` seem to be used.

So this code is probably transferring the result of some computation into longer-term memory.
This indicates that the problem happened earlier, while the turtle's Y position was still
within the zero page.


