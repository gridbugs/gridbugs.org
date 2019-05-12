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
I've annotated each instruction with a description of what it does.

```
CBDA  Iny(Implied)               increment index register Y
CBDB  Inx(Implied)               intrement index register X
CBDC  Cpx(Immediate) 20          compare index register X to 0x20 (32)
CBDE  Bne(Relative) F6           branch if X != 20 (which is true in this case)
CBD6  Lda(ZeroPageXIndexed) B0   load accumulator with value from address 0xB0 + X
reading 2C from B8
CBD8  Sta(IndirectYIndexed) 14   store accumulator in [addess at 0x14] + Y
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

This code is probably transferring the result of some computation into longer-term memory.
This indicates that the problem happened earlier, while the turtle's Y position was still
within the zero page. To find details of what is done to the Y position while it's in 0x00B8,
we could instrument the emulator to print whenever 0x2C is read from this address.


```
C750  Jsr(Absolute) CC90  call function at 0xCC90
CC90  Lda(ZeroPage) B8    load value at 0xB8 into accumulator
reading 2C from 0xB8
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
is fine! Run it on someone else's emulator, or heaven forbid a real NES, and gravity works.

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

## Fixing a (hopefully!) simpler problem
