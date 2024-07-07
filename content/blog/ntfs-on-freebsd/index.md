+++
title = "NTFS on FreeBSD"
date = 2020-12-18
path = "ntfs-on-freebsd"

[taxonomies]
tags = ["unix"]
+++

Here's a guide for myself on how to format and mount an NTFS partition on FreeBSD.
These examples were run on FreeBSD 12.2-RELEASE.

List disks:
```
# geom disk list
...
Geom name: da1
Providers:
1. Name: da1
   Mediasize: 1000204886016 (932G)
   Sectorsize: 512
   Stripesize: 4096
   Stripeoffset: 0
   Mode: r0w0e0
   descr: HGST TOURO S
   lunid: 5000000000000001
   ident: 21001410170002100173
   rotationrate: unknown
   fwsectors: 63
   fwheads: 255
```

<!-- more -->

This guide will create a single giant NTFS partition taking up the entirety of da1.

Destroy the existing partition table if necessary:
```
# gpart destroy -F da1
da1 destroyed
```

Create the (GPT) partition table if you don't already have one.
```
# gpart create -s GPT da1
da1 created
```

Create a partition:
```
# gpart add -t ms-basic-data da1
da1p1 added
```

A common mistake when trying to create an NTFS partition is to run:
```
# gpart add -t ntfs da1
gpart: Invalid argument
```
This is one of the least helpful error messages I can imagine.
`gpart` doesn't let you create a partition with type "ntfs" on a disk with a GPT
partition table. You'd need to make a MBR partition table instead.

Format the partition:
```
# NTFS_USE_UBLIO=0 mkntfs -vf /dev/da1p1
```
The `mkntfs` command is part of the `sysutils/fusefs-ntfs` package.
`-v` prints verbose output, `-f` skips zeroing out the partition and elides some checks to speed up
creating the partition. Setting `NTFS_USE_UBLIO` is a workaround for a bug in `mkntfs` which causes
the command to hang.
- [bug report](https://bugs.freebsd.org/bugzilla/show_bug.cgi?id=206978)
- [stack exchange post about the problem](https://unix.stackexchange.com/questions/513732/why-is-mkntfs-taking-such-a-long-time)
- [blog post where I first read about this issue and the workaround](https://chieflemming.wordpress.com/tag/freebsd/)

Mount the partition:
```
# ntfs-3g /dev/da1p1 /mnt/
```
The `ntfs-3g` program is also part of the `sysutils/fusefs-ntfs` package.

Should this fail with the error `fuse: failed to open fuse device: No such file or directory`,
the `fuse` kernel module is likely not loaded. Load it with:
```
# kldload fuse
```
Set it to load on boot by adding the following to /boot/loader.conf:
```
fuse_load="YES"
```

To unmount the partition:
```
# umount /mnt
```
