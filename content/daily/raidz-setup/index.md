+++
title = "Raidz setup"
date = 2020-10-22
slug = "raidz-setup"
+++

Tonight I set up a raidz zpool on 3 4TB external hard drives.
This is exactly the [ZFS example in the FreeBSD handbook](https://www.freebsd.org/doc/handbook/zfs-quickstart.html),
with the minor variation that one of the disks is _slightly_ smaller
than the other 2, so `-f` must be specified when creating the zpool.

```
# zpool create storage raidz da1 da2 da3
invalid vdev specification
use '-f' to override the following errors:
raidz contains devices of different sizes
# zpool create -f storage raidz da1 da2 da3
```

This will be used in a media center. Create a new filesystem for storing media:
```
# zfs create storage/media
```

I'm trying out the compression feature of ZFS. I doubt it will do much in this case as
all the files I'll be storing in this filesystem will be already compressed, but I'm
interested to see how much of a difference it makes anyway.
```
# zfs set compression=on storage/media
```

The 7TB below (instead of 8TB) is due to the unusual way hard drive sizes are specified.
4TB is more like 3.5TB. One disk size worth of storage is taken up with redundancy, which
is why the total size of the pool is twice that of a single disk (rather than 3 times).
Were one of the disks to fail, no data would be lost and the pool would continue to function
as normal.
```
# df -h storage/media
Filesystem       Size    Used   Avail Capacity  Mounted on
storage/media    7.0T     92G    6.9T     1%    /storage/media
```

The zpool hierarchy showing the 3 disks:
```
# zpool status storage
  pool: storage
 state: ONLINE
  scan: none requested
config:

        NAME        STATE     READ WRITE CKSUM
        storage     ONLINE       0     0     0
          raidz1-0  ONLINE       0     0     0
            da1     ONLINE       0     0     0
            da2     ONLINE       0     0     0
            da3     ONLINE       0     0     0

errors: No known data errors
```
