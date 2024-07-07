+++
title = "Creating and mounting a FAT32 partition in a GPT disk on FreeBSD"
date = 2020-08-31
slug = "creating-and-mounting-a-fat32-partition-in-a-gpt-disk-on-freebsd"
+++

To test my disk image tool, I set up a spare USB stick with a GPT partition
table and FAT32 partition. Doing this on FreeBSD meant learning about a couple of
new tools. All the necessary tools are part of the base system, so no installation
is necessary. This was written based on FreeBSD 12.1.

Plug in a USB hard drive, and watch the output of `dmesg` to determine its name.
In my case the drive was named `/dev/da1`. The following commands will destroy anything
previously on that drive. Double check that the file passed to these commands is
corresponds to the disk you plugged in!

These commands require root.

Clear any existing partition table.
```
# gpart destroy -F /dev/da1
```
Make a new GPT partition table.
```
gpart create -s GPT /dev/da1
```

Make a new 200mb partition of type "efi".
The new partition will have a device node `/dev/da1p1`.
```
# gpart add -s 200M -t efi /dev/da1
```

Format the new partition with the FAT32 filesystem.
```
# newfs_msdos -F 32 -c 1 /dev/da1p1
```

Mount the partition, at `/mnt` allowing user 1001 (me) access.
```
# mount_msdosfs -u 1001 /dev/da1p1 /mnt/
```

And then as myself (uid 1001), create a file on the disk.
```
$ echo "Hello, World!" > /mnt/hello.txt
```

Finally, to make a disk image for the purpose of testing the tool, run (as root):
```
# dd if=/dev/da1 of=/tmp/test.img bs=1m
```

Beware that the resulting file (`/tmp/test.img`) will be the size of the hard drive!
