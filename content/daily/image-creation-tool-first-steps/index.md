+++
title = "Image Creation Tool - First Steps"
date = 2020-08-30
slug = "image-creation-tool-first-steps"
+++

I've started working on a new personal project: [GPT FAT Disk Image Tools](https://github.com/gridbugs/gpt-fat-disk-image).
That's a boring name for a boring (in a good way!) piece of software.
It's going to be a modest collection of simple tools for working with images of hard drives
containing [GPT Partition Tables](https://en.wikipedia.org/wiki/GUID_Partition_Table)
where the first partition is formatted with a [FAT Filesystem](https://en.wikipedia.org/wiki/File_Allocation_Table).

The problem it solves is the following. When doing x86 OS development, I frequently want to run my code in
an emulator/VM such as qemu. In order to boot an operating system on an emulator, one must present a
disk image for the emulator to boot from.
Modern PCs use a firmware interface named [UEFI](https://en.wikipedia.org/wiki/Unified_Extensible_Firmware_Interface).
Compared to its predecessor [BIOS](https://en.wikipedia.org/wiki/BIOS), it presents a higher-level of abstraction
to boot code, and rather than loading and executing code from the
[Master Boot Record](https://en.wikipedia.org/wiki/Master_boot_record)
of your hard drive, it loads a file from one of a handful of pre-defined locations (such as `/EFI/BOOT/BOOTX64.EFI`)
from the first partition of the hard drive. The hard drive must have a GPT partition table, and its first partition
must be formatted with a FAT filesystem (there appears to be some flexibility as to _which_ FAT is used).

The process of creating a disk image containing a GPT partition table with a FAT-formatted partition
is harder than it needs to be.
The [osdev wiki page on UEFI](https://wiki.osdev.org/UEFI)
gives a list of ways to create a UEFI-compatible disk image,
organized by OS and whether or not they require root.
I want my hobby OS to have a `Makefile` rule than builds a bootable disk image,
and running build tools as root is dangerous,
and there's no reason creating or formatting a disk image should require root.
I frequently bounce between linux and freebsd, so I need a platform-independent solution.

GPT and FAT are both fairly simple and well-documented standards.
So far I can decode GPT and FAT headers, and list the files in the root directory of of FAT12 and FAT16 partitions.
