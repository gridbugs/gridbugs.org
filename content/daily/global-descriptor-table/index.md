+++
title = "Global Descriptor Table"
date = 2020-08-23
slug = "global-descriptor-table"
+++

In x86 processors, the [Global Descriptor Table](https://en.wikipedia.org/wiki/Global_Descriptor_Table)
is a data structure that stores characteristics of regions of memory known as "segments".
Example characteristics are the start address of the segment, the size of the segment, and access flags,
such as whether the segment is writable or executable.
Back in the days of 16-bit addresses, the ability to dynamically switch the current segment
allowed programmers to effectively address more 64k.

Nowadays, in 64-bit mode, a Global Descriptor Table must still be set up, largely for legacy reasons it seems.
Certain instructions, notably those which move control between distant virtual address (such as returning
from a system call), take a segment index as an argument, and change the current _segment_ in addition
to the current _instruction pointer_ address.

Typically the GDT has at least 2 entries (in addition to the
mandatory null entry at index 0) - one for code, and a second for data. I'm not sure whether it's necessary
to have one such pair for the kernel, and a second pair of segments for user-mode. My current goal is to get
the kernel-to-user-mode switch to happen _at all_, then go over everything I'm doing and make sure I'm doing
it "right". Once I have a basic user-mode "thread" running, I'll do a longer write-up explaining how to get
from zero to this point.

A page that turned out to be of great practical use:
[Builing a UEFI x64 kernel from scratch: A long trip to userspace](https://blog.llandsmeer.com/tech/2019/07/21/uefi-x64-userland.html)
