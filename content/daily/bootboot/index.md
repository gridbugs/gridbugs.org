+++
title = "BOOTBOOT"
date = 2020-08-13
slug = "bootboot"
+++

A month or so ago I started following [the first edition of writing an OS in rust](https://os.phil-opp.com/first-edition/)
which is a tutorial for writing an OS in rust.
I tried to get it working on my FreeBSD laptop and ran into what I'll call "yet another teething problem
for me as a new FreeBSD user". I'd been using a tool called `grub-mkrescue` to build a bootable cdrom image
containing the grub bootloader and an image of the kernel we build in the tutorial.
Grub is not available on FreeBSD (though hunting for help on this issue indicates that it _used_ to be).

There is a pure rust bootloader in a crate called [bootloader](https://crates.io/crates/bootloader).
The _second_ edition of the tutorial I'm following uses it (in fact it was written just for the tutorial).
I've avoided it thus far as I want a more general - not rust-specific - understanding of the boot process.

An alternative that I just discovered is [BOOTBOOT](https://wiki.osdev.org/BOOTBOOT) which is a
bootloader protocol and reference implementation. It does a little more setup than grub.
Kernels begin executing in long mode, and the bootloader initializes a framebuffer and serial console.
I'd honestly rather it didn't, preferring to work out that myself, but it seems I'm out of options.
Initial setup isn't the most interesting part of OS dev.
I've gone through the [ritualistic process](https://github.com/gridbugs/writing-an-os-in-rust/blob/master/src/boot.asm)
of transitioning from protected mode to long mode on x86. I'm glad to have done that once, and once is probably enough.

Grub is large and complicated and does far more than I need it to do. BOOTBOOT comes with a tool `mkbootimg`
which performs a similar function to `grub-mkrescue` - making a bootable disk image containing a bootloader
and a kernel. What I love about this tool is that's _all_ it does.
