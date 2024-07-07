+++
title = "Planning to make a simple disk image creator"
date = 2020-08-28
slug = "planning-to-make-a-simple-disk-image-creator"
+++

Several times in the past few weeks I've been frustrated by the lack of a tool
for generating a disk image containing a partition with a filesystem containing
a set of given files. Such a tool would be very useful in OS development.
Bootboot's `mkbootimg` tool, and grubs `grub-mkrescue` do something similar to
what I want, but both with some pretty major caveats, and  there doesn't seem to be a
standard, general purpose, platform independent way of doing this.
I want to spend some time this weekend working out whether it would be feasible
to make this tool myself, targeting GPT partition tables, and the FAT32 filesystem,
as that's what's required to make a disk image that's bootable by a UEFI system,
which is the use case I have in mind.
