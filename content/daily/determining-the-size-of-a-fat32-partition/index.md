+++
title = "Determining the size of a FAT32 partition"
date = 2020-10-01
slug = "determining-the-size-of-a-fat32-partition"
+++

I'm making a program that takes a list of files as an argument and creates a GPT/FAT32 disk
image that contains them. The first step is determining how big the disk image needs to be.
This depends on the size of the files that will occupy it. I take all the files, determine
their size padded to the size of a FAT32 allocation unit (called a "cluster"). For each file,
the user of my program can specify a path within the disk image where the file will be placed.
I determine the number of entries in each directory implied by the path to each file, and how
many clusters each directory will occupy on disk. Then I calculate the size of the FAT table
and partition headers.

Now that I can find out the amount of storage required for the partition, the next steps will be
writing the GPT header and footer on either side of a zeroed-out partition-sized region.
Then I'll write the FAT headers, FAT table, and copy the data for each file into the disk image.
