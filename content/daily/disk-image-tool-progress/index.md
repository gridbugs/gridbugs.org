+++
title = "Disk image tool progress"
date = 2020-09-01
slug = "disk-image-tool-progress"
+++

I'm making steady progress on my [gpt fat disk image tools](https://github.com/gridbugs/gpt-fat-disk-image) project.
As of tonight I can list the "long names" of files in the root directory of the first partition on the disk image.
The first milestone will be when I have a tool that can list the files under a given path rather than just the root.
The next step will be removing the need to load the entire image into a huge buffer before processing it.
