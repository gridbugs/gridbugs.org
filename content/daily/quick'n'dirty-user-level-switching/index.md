+++
title = "Quick'n'dirty user-level switching"
date = 2020-08-25
slug = "quick'n'dirty-user-level-switching"
+++

My goal for the last couple of days has been getting my hobby OS project to the point where
it can switch into user-mode. I was technically at that point yesterday, but with an
unsatisfying caveat: the instant the processor entered user-mode (by means of the `sysret` instruction)
it would page fault, and for a reasons I still don't understand, my interrupt handler wasn't invoked.

Today I managed to get user-level to (deliberately) infinitely loop. I can use a debugger to verify
that the processor is in-fact in user-mode. To prevent the fault upon entering user-mode, I adjusted
some access flags in the paging hierarchy to permit the processor to access the memory containing
the user program and stack, while the processor is in user-mode.

I was wrong about the bootloader's ELF-loading. I incorrectly assumed that it would set up paging
to match the virtual addresses specified in an ELF-file, but it only loads code/data into a specific
region of virtual memory, and sets up paging for that region. This means in order to have the user
program be loaded at its expected virtual address, I need to identify unused physical memory
and map some of it at this address.

In the interest of just getting something simple working, I'm currently setting access bits
such that user-mode has access to some code from the kernel, and the kernel's stack.
That way I can just write a `while(1);` function in the kernel code, and run the `sysret` instruction
such that it "returns" to user-mode at the beginning of this function.
