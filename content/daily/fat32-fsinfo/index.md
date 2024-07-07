+++
title = "FAT32 FSInfo"
date = 2020-09-29
slug = "fat32-fsinfo"
+++

The "FSInfo" sector is the second sector of a FAT32-formatted partition.
It contains a count of the number of free clusters in the partition, and
the index of the next free cluster. I added a FSInfo parser to my disk
image tools, and a new tool `info` for printing metadata about the disk
and partition to help me understand the header contents of the disk images
I'm analysing.

The next step is to start generating disk images with files inside them.
