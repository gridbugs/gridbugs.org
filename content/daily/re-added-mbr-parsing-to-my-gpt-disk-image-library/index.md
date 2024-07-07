+++
title = "Re-added MBR parsing to my GPT disk image library"
date = 2020-09-08
slug = "re-added-mbr-parsing-to-my-gpt-disk-image-library"
+++

When I first started working on [mini_gpt](https://crates.io/crates/mini_gpt),
the first thing I made was a parser for the disk image's Master Boot Record (MBR).
This felt natural, as the MBR is the first piece of data stored on a hard drive,
regardless of whether it has a GPT partition table. But decoding the MBR isn't
necessary to determine the byte range of the first partition on a GPT disk, which
at the time of writing is the only function exposed by mini_gpt.
Thus, in the interest of aggressive minimalism, I removed MBR parsing from the
library.

That is until today, when I added it back. The next piece of functionality I'll
be adding to the library will be generating disk images, and generated disk
images must include an MBR. It will also be useful to check the validity of
disk images by reading their MBR and asserting it is sane.
