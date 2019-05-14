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
.mario-render img {
    width: 328px;
    height: auto;
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
like the real hardware.

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
I've annotated each instruction with a description of what it does.

```
CBDA  Iny(Implied)               increment index register Y
CBDB  Inx(Implied)               intrement index register X
CBDC  Cpx(Immediate) 20          compare index register X to 0x20 (32)
CBDE  Bne(Relative) F6           branch if X != 20 (which is true in this case)
CBD6  Lda(ZeroPageXIndexed) B0   load accumulator with value from address 0xB0 + X
reading 0x2C from 0xB8
CBD8  Sta(IndirectYIndexed) 14   store accumulator in [addess at 0x14] + Y
writing 0x2C to t1 y position
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

This code is probably transferring the result of some computation into longer-term memory.
This indicates that the problem happened earlier, while the turtle's Y position was still
within the zero page. To find details of what is done to the Y position while it's in 0x00B8,
we could instrument the emulator to print whenever 0x2C is read from this address.


```
C750  Jsr(Absolute) CC90  call function at 0xCC90
CC90  Lda(ZeroPage) B8    load value at 0xB8 into accumulator
reading 0x2C from 0xB8
CC92  Clc(Implied)        clear carry flag
CC93  Adc(Immediate) 08   add 8 to the value in accumulator
CC95  Cmp(Immediate) E4   compare accumulator to 0xE4
CC97  Bcc(Relative) 08    branch if accumulator < 0xE4 (true)
CCA1  Sta(ZeroPage) 01    store accumulator at address 0x01
CCA3  Lda(ZeroPage) B9    load accumulator with value from address 0xB9
CCA5  Sta(ZeroPage) 00    store accumulator at address 0x00
CCA7  Jsr(Absolute) CA9A  call function at 0xCA9A

```

This code is reading the turtle Y position from 0xB8, adding 8 to it, and storing the
result in address 0x0001. The Y coordinate increases moving down the screen, so at
first I thought that adding to the turtle's Y position was gravity at work, but
this will turn out to be incorrect.

## What are we searching for?

The debugging process so far has closely resembled how we might debug Mario Bros. -
the program being run on the emulator -
without access to its source code. We're trying to find the part of the program
that applies gravity to characters because it looks like something is wrong with gravity.
Of course, we know that the program we're running
is fine! Run it on someone else's emulator, or real NES, and gravity works.

And this is the crux of why debugging an emulator is hard. The layer of abstraction where
the problem manifests is never the layer of abstraction where we'll find the problem.
The problem "gravity is not working" is a symptom of a problem that has nothing to do
with gravity. One or more instructions is being interpreted incorrectly, and these instructions
happen to be used by the game at some point to apply gravity.

If we were to look at the code that applies gravity in Mario Bros., we would find that
there is nothing wrong with it. Our best bet would be to look at a trace of this
code being run (what we've been doing so far) with enough detail logged such that when
a broken instruction is executed, the update to the machine state won't match our expectations.
Of course the instruction emulation is based on my interpretation of the CPU manual,
so it's likely that my expectations themselves are incorrect.

Since the virtual hardware, and my expectations of how the hardware should behave
may both be faulty, the only real "source of truth" we can rely on is the software
running on the emulator. This is an interesting reversal of the usual assumptions -
one typically assumes that their hardware works as expected and all bugs are problems with
software. We'll trace the execution of Mario Bros., and if it looks like the game
is doing something that doesn't make sense, that might indicate that the emulator is
behaving differently than the real hardware would.

## Fixing a (hopefully!) simpler problem

I spent a few days pouring over execution traces trying to find where gravity was applied
and the bug which prevent it from working. Eventually I decided to take a break
and work on what was hopefully a simpler problem.


<div class="mario-render">
<img src="/images/nes-emulator-debugging/mario-incorrect-render.png">
</div>

The Mario and Luigi sprites are a 2x3 rectangle of 8 pixel square tiles.
When they face to the right, both columns are drawn overlapping instead of
adjacent.

It's supposed to look like this.

<div class="mario-render">
<img src="/images/nes-emulator-debugging/mario-correct-render.png">
</div>

### NES Sprite Rendering

To get to the bottom of this, we need to know a little about how rendering works
on the NES. The NES Picture Processing Unit (PPU) can render up to 64 8x8
pixel foreground sprite tiles at a time. Backgrounds are rendered differently,
but aren't important for finding this bug. To render a sprite tile, the game
writes a 4-byte description of the tile to a special region of memory called the
Object Attribute Memory (OAM). This description contains the position of the
tile on the screen, a tile index specifying which tile to render, and some
attributes to fine-tune rendering.

OAM is not addressable directly by the CPU. Instead, the CPU writes a copy of
what it wants OAM to contain into RAM, starting at a 256-byte aligned address (ie. an
address whose low byte is 0), then writes the high byte of this address to a PPU
register named `OAM DMA`. Writing to `OAM DMA` causes the PPU to directly read the
256 bytes starting at specified address, and upload it to OAM.

### Finding the Mario Sprite

By logging writes to `OAM DMA`, I found that the only value Mario Bros. ever
writes to it is "2". This means that it's storing sprite data in the region of
RAM at `0x0200` - `0x02FF`.

Next we need to find out which part of OAM contains the description of the Mario
tiles. Each sprite tile is described with a 4-byte data structure. The 4th byte
of this structure contains the X coordinate of the tile. By logging the X
coordinate of each tile each frame and watching how they change as Mario moves
on the screen, I identified the 6 OAM entries corresponding to Mario as those
occupying `0x0210` - `0x0227` (24 bytes = 6 tiles * 4 bytes per tile)
prior to uploading.

I instrumented the emulator to log writes to `0x0213` and `0x0217` which
should correspond to the X positions of the top 2 tiles of Mario.
I found a single loop where one iteration wrote to `0x0213`, and another
iteration write to `0x0217`.


```
CC20  Inx(Implied)
CC21  Lda(IndirectYIndexed) 12
CC23  Bit(ZeroPage) B7
CC25  Bvs(Relative) 03     branch if overflow flag is set
CC2A  Eor(Immediate) FF
CC2C  Sec(Implied)
CC2D  Sbc(Immediate) 08    subtract 8 from the accumulator
CC2F  Sec(Implied)
CC30  Adc(ZeroPage) B9
CC32  Iny(Implied)
CC33  Sta(AbsoluteXIndexed) 0200
writing 0x68 to 0x0213
...
CC20  Inx(Implied)
CC21  Lda(IndirectYIndexed) 12
CC23  Bit(ZeroPage) B7
CC25  Bvs(Relative) 03     branch if overflow flag is set
CC27  Clc(Implied)
CC28  Bcc(Relative) 06
CC30  Adc(ZeroPage) B9
CC32  Iny(Implied)
CC33  Sta(AbsoluteXIndexed) 0200
writing 0x68 to 0x0217
```

### A Hunch

These two iterations look slightly different. Notice that in the `0x0213`
iteration (the first iteration) 8 is subtracted from the accumulator (address
0xCC2D), and in
the `0x0217` iteration, this part of the program is skipped. 8 happens to be the
width of a sprite tile in pixels. If this subtraction occurred in the latter
iteration, it would have written `0x60` instead of `0x68` to OAM, and the left
half of the sprite would be shifted 8 pixels to the left and no longer overlap
with the right half (note that this assumes that the former iteration is the
top-right tile, and the latter one is the top-left tile).

The first point where the two iterations differ is the `Bvs` instruction
at address `0xCC25`. This instruction branches by a specified offset if the
"overflow" flag is set. Arithmetic operations set the overflow flag when a
signed integer overflow occurs. This code suggests that the `Bit` instruction
also sets this flag under certain conditions. My emulator was setting the
overflow flag when emulating `Bit`, but I double checked the manual at this
point just to be safe.

The `Bit` instruction computes the bitwise AND of a value from memory and the
accumulator, discarding the result, and setting some status register flags.

Here's what the MOS6502 Programmer's Manual has to say about the status register
flags set by `Bit`:

_The bit instruction affects the N flag with N being set to
the value of bit 7 of the memory being tested, the **V flag with V
being set equal to bit 6 of the memory being tested** and Z being set
by the result of the AND operation between the accumulator and the
memory if the result is Zero, Z is reset otherwise. It does not
affect the accumulator._

The "V" flag refers to the overflow flag. What's unusual about `Bit` is that it
sets the overflow (V) and negative (N) flags based on the operand, instead of
the result. Every other instruction that sets status register flags does so
based on the result of the computation, not one of its arguments.

In my first pass through the manual I did not pick up on this subtlety!

Correcting this instruction in my emulator, and now Mario renders correctly.

<div class="nes-emulator-debugging-screenshot">
<img src="/images/nes-emulator-debugging/gravity-works.gif">
</div>

It seems that fixing this bug also fixed gravity...

_Great!_

## Platforms get wider when you jump into them

Look closely at the previous recording. Luigi jumps and hits the ceiling, and it
seems to grow a little wider as a result. This is not supposed to happen!

Here's a more explicit demonstration of the problem.

<div class="nes-emulator-debugging-screenshot">
<img src="/images/nes-emulator-debugging/floor-extension.gif">
</div>

This only happens if you hit a platform on its bottom-left corner. This fact,
coupled with the turtle falling through the floor suggests that this bug relates
to collision detection. In Mario Bros., when you hit a platform from underneath,
an animation plays where the platform bulges above you, damaging any enemies
standing on that part of the platform. There is an emulator bug with the symptom
that collision detection with platforms has a lateral offset, which means that
if you jump just to the left of a platform, the game thinks you hit the platform
from beneath. Because it thinks you hit a platform from beneath, the game plays
the platform bulge animation, which leaves a fresh platform where there was none
before. This new platform can now be collided with in the same way allowing it
to grow even further to the left.

If collision detection has an erroneous offset, you should be able to move
through the right-hand side of a platform too.

<div class="nes-emulator-debugging-screenshot">
<img src="/images/nes-emulator-debugging/jump-through-floor.gif">
</div>

Turtles also fall through platforms too early on the right-hand side, and too
late on the left-hand side.

### Function Analysis

Collision detection is complicated, and after a few days of blindly staring at
execution traces I elected to take a step back and try to get a better
understanding of how the game works. To that end I wrote a little library for
exploring function definitions in NES programs. The NES CPU has an instruction
named `JSR` (Jump SubRoutine) which pushes current program counter on the
stack, and moves execution to a specified address. A second instruction, `RTS`
(Return from SubRoutine) pops an address from the stack and moves execution to
that address. Respectively, these instructions are used to call and return from
functions.

To find all the functions in the program, my library scans the ROM for all
instances of the `JSR` instruction, looking at its argument to find addresses
where functions begin. To find out where a given function ends, step through the
function instruction by instruction, stopping when a `RTS` instruction is
reached. Upon encountering a conditional branch, we need to account for the case
when the condition is true, and when the condition is false. I use a stack (the
data structure) to keep track of execution paths yet to be explored.
Instructions that unconditionally change the program counter are followed,
with the exception of `JSR` (we're only exploring the current function - not
the functions it calls) and `RTS` (which indicates we should stop exploring the
current branch). Keep track of the addresses that have been explored in this
traversal and stop if an instruction would change the program counter to
somewhere we've already been.
This is effectively a depth-first search through the control flow graph.

Here's a trace of a simple function. I've manually annotated the trace with a
description of each instruction.

```
0xCDD1  Pha(Implied)        save accumulator onto stack
0xCDD2  Clc(Implied)        clear the carry flag
0xCDD3  Lda(ZeroPage) 0x14  load value at address 0x14 into accumulator
0xCDD5  Adc(ZeroPage) 0x12  add value at address 0x12 to accumulator
0xCDD7  Sta(ZeroPage) 0x14  store accumulator at address 0x14
0xCDD9  Lda(ZeroPage) 0x15  load value at address 0x15 into accumulator
0xCDDB  Adc(ZeroPage) 0x13  add value at address 0x13 to accumulator
0xCDDD  Sta(ZeroPage) 0x15  store accumulator at address 0x15
0xCDDF  Pla(Implied)        restore accumulator from stack
0xCDE0  Rts(Implied)        return
```

What's this function doing?

It adds the byte at address `0x14` with the byte at address `0x12`, storing the
result at address `0x14`, then adds the byte at `0x15` with the byte at `0x13`,
storing the result in `0x15`. Notice the carry flag is cleared once at the
start, and then not cleared in between the two additions. The `ADC` instruction
adds the carry flag to its result, and sets the carry flag if the result of the
addition is greater than 255 (the maximum value that fits in a byte).

This function treats the 2 bytes at `0x14` and `0x15` as a single 2-byte
integer, and likewise for the 2 bytes at `0x12` and `0x13`. We can interpret
`0x12` - `0x15` as containing function's arguments. Similarly, we can interpret
`0x14` - `0x15` as containing the function's return value.

Here's how you might write this function in rust:

```rust
fn add16(a: u16, b: u16) -> u16 {
    a + b
}
```
