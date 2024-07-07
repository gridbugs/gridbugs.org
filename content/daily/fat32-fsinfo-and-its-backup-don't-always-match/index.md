+++
title = "FAT32 FSInfo and its backup don't always match"
date = 2020-10-06
slug = "fat32-fsinfo-and-its-backup-don't-always-match"
+++

FAT32 defines a section named FSInfo at the start of the partition where the number of free
clusters, and the index of the next free clusters, are stored.
The spec stresses that this section is meant as a hint only, and implementations
must not rely on this information being accurate.
A second section contains a backup of FSInfo.

To learn more about FAT32, I formatted a partition on a USB stick on Linux using `mkfs.vfat`
and then `dd`'d the disk into a file. I did the same thing with another USB stick on FreeBSD
using `newfs_msdos`, and the FSInfo and backup FSInfo sections contain different values.
They are otherwise valid FSInfo sections; all the signatures are valid. But the data fields
differ.

I've updated my disk image parsing tool to not care if the FSInfo sections don't match.
I'm hoping this doesn't mean that I've overlooked an important detail in the FAT32 spec.
