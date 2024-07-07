+++
title = "x86 Basic Interrupt Handling Kind of Working"
date = 2020-08-24
slug = "x86-basic-interrupt-handling-kind-of-working"
+++

My hobby OS adventure has led to the need to handle interrupts.
In x86, you set up a data structure called an "Interrupt Descriptor Table" (IDT)
which tells the hardware which function to call in response to different interrupts.
My setup kind of works; I can trigger an interrupt with the `int` instruction, or
cause a page fault in kernel mode by accessing unmapped memory, and see that my interrupt handler is invoked.
For some reason immediately after switching to user mode a page fault is generated (unsurprising as nothing is mapped user-accessible yet),
but my handler is _not_ invoked. No idea why this could be!
