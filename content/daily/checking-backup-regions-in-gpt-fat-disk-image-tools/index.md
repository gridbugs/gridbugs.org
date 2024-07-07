+++
title = "Checking backup regions in gpt fat disk image tools"
date = 2020-09-22
slug = "checking-backup-regions-in-gpt-fat-disk-image-tools"
+++

The FAT filesystem and GPT partition table both set aside part of the partition and disk for storing a backup
of header information. At the start of the disk, and the start of FAT partitions, there are header data structures
that contain metadata about the data stored in the remainder of the disk/partition. The start of a partition/disk
is more likely to be accidentally overwritten than the end, so to help recover from such accidents, FAT and GPT
both store copies of their headers at the end of the partition/disk as well.

When I first started working on [tools for reading FAT partitions from GPT disk images](https://github.com/gridbugs/gpt-fat-disk-image)
I added support for reading backup structures, as I was focusing
on completeness. At some point, in the interest of building the simplest thing that would do the job, I removed all
the code for dealing with these regions. Now I'm working on writing disk images rather than just reading them, and I need
to generate backup regions of my own.

To test my understanding of backup regions, I'll start by adding support for checking the validity of backup regions back to my
tools that read files from FAT/GPT disk images.
