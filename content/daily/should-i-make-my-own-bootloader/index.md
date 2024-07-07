+++
title = "Should I make my own bootloader?"
date = 2020-08-27
slug = "should-i-make-my-own-bootloader"
+++

On the road to setting up basic memory-management for my hobby OS, I found that
the bootloader I've elected to use ([bootboot](https://gitlab.com/bztsrc/bootboot))
doesn't tell the booting kernel about all the available physical memory. In particular
it omits the memory regions which it uses to store the initial paging hierarchy which
it sets up before starting the kernel. Looking at its source code, this appears to
be by design, though I don't understand why it's necessary.

I want my project to be easy to build on at least linux and freebsd. With the
exception of the `mkbootimg` tool packaged with bootboot (for generating bootable disk images), the only packages required
to build the OS are GNU binutils, the netwide assembler (though I'm planning on switching
to GNU assembler), and qemu (if you want to run the OS in an emulator/VM).

Dropping bootboot would mean losing `mkbootimg` (unless I implemented a bootboot-compliant bootloader
(bootboot is a _protocol_ as well as a reference implementation)). The specific problem which `mkbootimg`
solves is taking a binary file containing a compiled kernel (an ELF file) as input, and producing as output
a hard disk image with a GPT partition table, whose first partition is FAT32 formatted,
and inside that partition resides a bootloader UEFI file (understood by the system's UEFI firmware),
and the kernel ELF. Every alternative tool I've found for doing this is specific to linux.
The `grub` bootloader comes with a tool `grub-mkrescue` which is a popular way to make bootable disk images
for hobby OS projects, but the grub no longer exists in freebsd. You can also make bootable disk image by
`fdisk`-ing a regular file, `mkvs.vfat`-ing a partition onto it, and mounting the partition to copy
the relevant files to it, but this again is different between linux and bsd, and worse - it requires running
commands as root (mounting/unmounting the partition from the disk image). A sorry state of affairs indeed!

Finally, the whole point of this project was for me to learn more about systems programming,
and a lot of the messy details of booting on x86 are taken care of by bootboot.

So I'm probably going to make a minimal x86 UEFI bootloader and disk image creator,
using bootboot and `mkbootimg` as a reference.
