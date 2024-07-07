+++
title = "Disk image tool no longer reads entire image"
date = 2020-09-02
slug = "disk-image-tool-no-longer-reads-entire-image"
+++

In the original version of [my disk image tool](https://github.com/gridbugs/gpt-fat-disk-image)
I read the entire image file into memory once before processing the image. This was convenient
but for large files it requires a lot of memory and took several seconds. Now I dynamically
seeks the image file and only reads what it needs to. I also deleted a bunch of code in an
attempt to keep things as simple as possible. Currently the tool just lists the files in the
root directory. Next step is to list the files at a specified directory.
