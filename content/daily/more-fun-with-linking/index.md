+++
title = "More fun with linking"
date = 2020-08-21
slug = "more-fun-with-linking"
+++

I managed to resolve my problem from [yesterday](@/daily/i-need-to-go-learn-more-about-elf-and-static-linking/index.md), though I'm still not
satisfied that I understand why it _now_ works, so it's possible that it just works by accident.
Evidently there's still a lot I need to learn about linking.

A new problem I ran into is working out the entry point of the user program from the kernel linked
into the same ELF (binary).
This is necessary for the kernel to start a user-level thread, whose initial program counter will
be this entry point.
My original plan was to use the `_start` symbol from the user program
(renamed using objcopy), which after relocation will contain the address I want.
This doesn't appear to "just work" the way I expected, so there's clearly even more I still need
to learn about linking!
