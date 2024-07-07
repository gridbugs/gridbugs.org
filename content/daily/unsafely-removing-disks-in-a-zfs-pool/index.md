+++
title = "Unsafely removing disks in a ZFS pool"
date = 2020-10-16
slug = "unsafely-removing-disks-in-a-zfs-pool"
+++
Here's a little experiment I did to familiarise myself with ZFS on FreeBSD 12.1.
Start with a mirror ("foo") made up of 2 disks (some spare external hard drives I had lying around):
```
+root@fontaine ~ # zpool status foo
  pool: foo
 state: ONLINE
  scan: resilvered 80K in 0 days 00:00:01 with 0 errors on Sat Oct 17 00:34:15 2020
config:

        NAME        STATE     READ WRITE CKSUM
        foo         ONLINE       0     0     0
          mirror-0  ONLINE       0     0     0
            da1     ONLINE       0     0     0
            da2     ONLINE       0     0     0

errors: No known data errors
```
Now yank out the cable attaching `da1`!
```
+root@fontaine ~ # zpool status foo
  pool: foo
 state: DEGRADED
status: One or more devices has been removed by the administrator.
        Sufficient replicas exist for the pool to continue functioning in a
        degraded state.
action: Online the device using 'zpool online' or replace the device with
        'zpool replace'.
  scan: resilvered 80K in 0 days 00:00:01 with 0 errors on Sat Oct 17 00:34:15 2020
config:

        NAME                      STATE     READ WRITE CKSUM
        foo                       DEGRADED     0     0     0
          mirror-0                DEGRADED     0     0     0
            10400537847491037026  REMOVED      0     0     0  was /dev/da1
            da2                   ONLINE       0     0     0

errors: No known data errors
```

The data on all datasets of the zpool "foo" is still accessible. You can continue using
the pool in this state, and any changes made to its contents will be applied to the
unplugged disk when we re-attach it.

The point of unplugging the disk was to simulate a disk failure, but when we plug the
disk back in, ZFS is smart enough to notice that it belongs in the "foo" pool. Try as
I might, I couldn't convince ZFS to `replace` the disk with itself. Nor could I wipe
the disk (with `gpart`, say), because something (I presume ZFS) starts using the disk
the second I plug it back in. That kind of messed up my experiment, but I suppose it's
a convenient feature.

So to complete this scenario, before plugging the disk back in, run:
```
+root@fontaine ~ # zpool offline foo da1
```
This step isn't necessary for this scenario. When we eventually plug the disk back in,
running `zpool online foo da1` will take the disk straight from `REMOVED` to `ONLINE`.
Leaving this step here as in a more realistic disk failure it might be necessary.

Status will now be:
```
+root@fontaine ~ # zpool status foo
  pool: foo
 state: DEGRADED
status: One or more devices has been taken offline by the administrator.
        Sufficient replicas exist for the pool to continue functioning in a
        degraded state.
action: Online the device using 'zpool online' or replace the device with
        'zpool replace'.
  scan: resilvered 80K in 0 days 00:00:01 with 0 errors on Sat Oct 17 00:34:15 2020
config:

        NAME                      STATE     READ WRITE CKSUM
        foo                       DEGRADED     0     0     0
          mirror-0                DEGRADED     0     0     0
            10400537847491037026  OFFLINE      0     0     0  was /dev/da1
            da2                   ONLINE       0     0     0

errors: No known data errors
```

Note the `da1` line has changed `STATE` from `REMOVED` to `OFFLINE`.

Plug the disk back in, and run:
```
+root@fontaine ~ # zpool online foo da1
```

And all is well:
```
+root@fontaine ~ # zpool status foo
  pool: foo
 state: ONLINE
  scan: resilvered 48K in 0 days 00:00:01 with 0 errors on Sat Oct 17 00:49:16 2020
config:

        NAME        STATE     READ WRITE CKSUM
        foo         ONLINE       0     0     0
          mirror-0  ONLINE       0     0     0
            da1     ONLINE       0     0     0
            da2     ONLINE       0     0     0

errors: No known data errors
```
