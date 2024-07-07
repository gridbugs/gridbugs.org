+++
title = "Fixing bugs in sample code"
date = 2020-08-26
slug = "fixing-bugs-in-sample-code"
+++

In the last day I've found bugs in two different kernel code samples I've been using
as a reference for my own hobby OS. I've done by best to correct them.

The first was in [this blog post](https://blog.llandsmeer.com/tech/2019/07/21/uefi-x64-userland.html)
which contains (among other things) an example of how to set up a Global Descriptor Table (GDT)
and Task State Segment (TSS), but it mixed up the code and data segments when installing the GDT,
and forgot to set the most-significant 16 bits of the TSS address in its GDT descriptor.
I've emailed the author with details.

Second issue was in [bootboot](https://gitlab.com/bztsrc/bootboot) which is the bootloader
I'm using to boot my hobby OS. It includes a sample "hello world" c kernel which declares a
`extern char* environment` pointing to a string containing kernel arguments, whose _address_ is specified
in a linker script, but treats `environment` as if its _value_ was the address of the argument string
(it should have been a `char` array). I made a pull request to address this.
