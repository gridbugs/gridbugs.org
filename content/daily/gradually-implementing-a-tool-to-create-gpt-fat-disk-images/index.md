+++
title = "Gradually implementing a tool to create GPT FAT disk images"
date = 2020-10-10
slug = "gradually-implementing-a-tool-to-create-gpt-fat-disk-images"
+++

I'm slowly getting there. Today I added the ability to write the "Protective MBR"
to a file - the first 512 bytes of any GPT disk image. The only information it
contains is the size of the disk. Next up will be writing the GPT header, and
partition entry array.
