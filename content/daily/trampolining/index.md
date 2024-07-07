+++
title = "Trampolining"
date = 2020-08-22
slug = "trampolining"
+++

Today I solved an os-dev problem I'd been stuck on for a few days.
In my hobby OS project, I want the bootable image to contain both the kernel code, and the code of the
initial user-level application, packed into a single ELF file, which the bootloader loads before
starting the kernel. In order for the kernel to (eventually) hand control over to the user program,
it needs to know the user program's entry point. I have linker script that describes the (virtual)
address space layout of the user and kernel memory, which the bootloader instantiates.
My original plan was to use the linker to make a symbol available in the kernel code which refers
to the entry point of the user program (ie. it's `_start` function's address), but since user and
kernel virtual addresses are conventionally very far apart, this turned out to be non-trivial.

I think I have a solution, though I'm yet to fully test it out (some other things have got in the way).
The plan is the following: Add a new section to the ELF with a tiny bit of code at the start that just
jumps to the user program's entry point. Something like

```asm
; the user "_start" function is renamed to "__user__start" to avoid name conflicts with kernel code
extern __user__start

bits 64

section .user.trampoline

jmp __user__start
```
This solves the problem because unlike the user's `_start` function, which could be located anywhere
within the user program's `.text` section, we can tell the linker to put the above code at the beginning
of a brand new section dedicated just for it:
```ld
. = user_base;
.user.trampoline : ALIGN(0x1000) {
    *(.user.trampoline)
} :user
```

This introduces a `user_base` symbol which can be `extern`-ed in kernel code, so when the kernel is
ready, it can switch to user mode and move execution to the address referred to by the symbol `user_base`.
Execution will then _bounce_ to the actual user entry point by means of the `jmp __user__start` instruction.

This technique is known as "trampolining".
