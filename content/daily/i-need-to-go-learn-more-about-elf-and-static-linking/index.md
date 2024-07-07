+++
title = "I need to go learn more about ELF and static linking"
date = 2020-08-20
slug = "i-need-to-go-learn-more-about-elf-and-static-linking"
+++

I'm working out the shortest path from a
[kernel-mode program that prints "Hello, World!"](https://github.com/gridbugs/hello-kernel)
and something that could conceivably by called an OS kernel.
The next step is to launch a user-mode program that makes a _system call_ that prints
"Hello, World!" inside the kernel.

The current problem I'm facing is getting a second program (in addition to the kernel)
loaded into memory during boot. I don't want to load it from disk, as that would
require disk drivers and a filesystem. I don't want to load an ELF image from memory,
as that would require an ELF loader.
The bootloader I'm using ([bootboot](https://wiki.osdev.org/BOOTBOOT))
sets up an initial address space for the kernel based on an ELF file, so I'll add a user-level
program directly to the kernel address space, and have the kernel start executing it
in user-mode once the system is brought up.

I can take the kernel code, and the code for a second, user-level program, and combine them into
a single ELF file using a linker script to position the two programs at sensible locations in
memory. When bootboot attempts to make a bootable disk image out of this ELF, it gets confused
and appears to treat the user-level program's entry point as the kernel's entry point.
This is understandable, since the single ELF actually contains two complete programs,
and I've done nothing to specify which one should be started when the ELF is executed.

I need to go learn more about ELF and static linking.
