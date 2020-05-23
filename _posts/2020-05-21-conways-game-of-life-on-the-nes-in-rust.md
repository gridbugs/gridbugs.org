---
layout: post
title: "Conway's Game of Life on the NES in Rust"
date: 2020-05-21 16:00:00 +1000
categories: procgen emulation
permalink: /conways-game-of-life-on-the-nes-in-rust/
excerpt_separator: <!--more-->
---

<style>
.nes-screenshot img {
    width: 512px;
    height: 480px;
    image-rendering: crisp-edges;
    image-rendering: pixelated;
}
.short-table tr {
    line-height: 0px;
}
</style>

This post is about a Rust program...

```bash
$ cargo install conway-nes
```

...that prints out a NES binary...

```bash
$ conway-nes > life.nes
```

...that runs Conway's Game of Life!

```bash
$ fceux life.nes    # fceux is a NES emulator
```
<div class="nes-screenshot">
{% image demo.webp %}
</div>

<!--more-->

Press any button on your controller to restart the demo from a randomized state.

## NES Rendering

The NES displays 2 types of graphics:

{% image sprites-and-background.webp %}

_Sprites_ are 8x8 pixel tiles which can be positioned at specific pixel coordinates,
usually used for game characters and objects:

{% image only-sprites.webp %}

The _background_ is a 2D grid of 8x8 pixel tiles, called a _nametable_. Individual tiles can be replaced, and the
entire background can be smoothly scrolled. It's typically used for mostly-static backgrounds
and user-interface elements:

{% image only-background.webp %}

For Conway's Game of Life, I only render the background, and replace nametable entries to keep the grid of tiles
up to date with the state of the cell automata.

## Rust

About a year ago I made a [NES emulator](https://gitlab.com/stevebob/mos6502) in rust, and wanted to write some small NES programs
to test it. I made a small rust library [mos6502\_assembler](https://crates.io/crates/mos6502_assembler)
for writing assembly programs for the MOS6502 (the processor in the NES). Another small rust
library I made as part of my emulator, [ines](https://crates.io/crates/ines), allows reading
and _writing_ NES ROM files in the [INES](https://wiki.nesdev.com/w/index.php/INES) format, which
is the standard file format understood by all NES emulators.

```rust
// Read the state of the controller into address 0x00FF
b.label("controller-to-255");
const CONTROLLER_REG: Addr = Addr(0x4016);

// toggle the controller strobe bit to copy its current value into shift register
b.inst(Lda(Immediate), 1);
b.inst(Sta(Absolute), CONTROLLER_REG); // set controller strobe
b.inst(Sta(ZeroPage), 255); // store a 1 at 255 - used to check when all bits are read
b.inst(Lsr(Accumulator), ()); // clear accumulator
b.inst(Sta(Absolute), CONTROLLER_REG); // clear controller strobe

// shift each of the 8 bits of controller state from the shift register into address 255
b.label("controller-to-255-loop");
b.inst(Lda(Absolute), CONTROLLER_REG); // load single bit into LBS of acculumator
b.inst(Lsr(Accumulator), ()); // shift bit into carry flag
b.inst(Rol(ZeroPage), 255); // shift carry flag into 255, and MSB of 255 into carry flag

// if that set the carry flag, this was the 8th iteration
b.inst(Bcc, LabelRelativeOffset("controller-to-255-loop"));

b.inst(Rts, ());
```

In order for an emulator to decode and emulate instructions, it needs to know the opcode and argument layout of each instruction.
The same information is needed by the assembler to generate binary code corresponding to a 6502 program.
The definitions of instructions are taken straight from the core of my emulator, _another_ rust library: [mos6502\_model](https://crates.io/crates/mos6502_model).
It took a little extra work per instruction when making that library to allow it to be used in both my emulator and assembler,
but it means that all the information for any given instruction is in the same place.

### Pre-Processing

Embedding an assembler in a general-purpose programming language means you get to use the host language as a powerful pre-processor.

In the code example above, the address of the controller register, `0x4016`, is assigned to a rust constant `CONTROLLER_REG`.
The ability to assign values to names is a stable in most assemblers, but when your assembler is embedded in a general purpose language
it's as simple as a variable/constant assignment!

Another benefit is using host language loops instead of loops in assembly. For loops iterating a small constant number of times,
unrolling the loop by repeatedly emitting the code within is easier than writing the loop in assembly.

```rust
// zero-out first 8 bytes of memory
b.inst(Lda(Immediate), 0);
for i in 0..8 {
    b.inst(Sta(ZeroPage), i);
}
```

The 6502 only has 3 registers, so in code with nested loops, it's common to run out of registers to store loop counters.
This isn't the end of the world - loop counters can be stored in memory, but this is a bit of a pain and
incurs a runtime cost, so I frequently use this technique to
relieve some of the pressure. Of course this comes at the cost of increased code size. On more modern architectures
I'd mention how this hurts code and will lead to more cache misses, but the 6502 has no cache.

### Validation

Another benefit of embedding is the ability to leverage the host type system to validate some properties of the guest program.

Consider the `STA` instruction, which STores the value of the Accumulator in memory. On the 6502, instructions that take
memory addresses as arguments are parameterized by an "addressing mode", which determines how the argument is mapped to
an address.

In the example above, there is a line...
```rust
const CONTROLLER_REG: Addr = Addr(0x4016);
b.inst(Sta(Absolute), CONTROLLER_REG);
```
...which has the addressing mode "Absolute", and an argument of 0x4016. The Absolute addressing mode reads the next 2 bytes after
the instruction opcode in memory and treats it as an address (6502 addresses are 16-bit). This line stores the current accumulator
value in 0x4016.

The next line is...
```rust
b.inst(Sta(ZeroPage), 255);
```
...which has the addressing mode "Zero Page", and an argument of 255 (0xFF in hex). The Zero Page addressing mode reads
the _single_ byte after the instruction opcode, and treats it
as an index into the first 256 bytes of memory (ie. the "zero page" in 6502 parlance).
This line stores the current accumulator value at address 0x00FF.

A third addressing mode, "Immediate", reads the single byte after the instruction opcode and treats it as a literal value rather
than an address.

```rust
b.inst(Lda(Immediate), 42); // Load the accumulator with the value 42
```

It's only meaningful when the instruction would read from memory. Using the Immediate addressing mode with the STA
is impossible, as it doesn't make sense to store the current accumulator value at a literal value.

Rather than writing a check to prevent illegal instructions from being compiled, I encode the valid addressing
modes for each instruction in the type system.

If I tried to write this...

```rust
b.inst(Sta(Immediate), 42); // Store the accumulator with the value 42
```

...it would be a type error:


```
error[E0277]: the trait bound
  `mos6502_model::addressing_mode::Immediate: mos6502_model::instruction::sta::AddressingMode`
  is not satisfied
   --> conway/src/main.rs:609:5
    |
609 |     b.inst(Sta(Immediate), 42); // Store the accumulator with the value 42
    |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^ the trait `mos6502_model::instruction::sta::AddressingMode`
    |                                 is not implemented for
    |                                 `mos6502_model::addressing_mode::Immediate`
    |
    = note: required by `mos6502_model::instruction::sta::Inst`

```
