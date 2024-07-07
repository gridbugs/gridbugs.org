+++
title = "Disk image tool progress - directory hierarchies"
date = 2020-11-12
slug = "disk-image-tool-progress-directory-hierarchies"
+++

I finally mustered to motivation to get some work done on my
[disk image creation tool](https://github.com/gridbugs/gpt-fat-disk-image).
Tonight I prepared for writing the FAT partition to the image by constructing
a representation of the directory hierarchy implied by the list of paths
to all files that will be created in the disk image.
Currently the hierarchy is only used to determine the partition size.
The next step will be to also use it to populate the FAT table and clusters
that make up a FAT partition.
