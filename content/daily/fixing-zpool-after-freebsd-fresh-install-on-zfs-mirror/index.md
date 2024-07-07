+++
title = "Fixing zpool after FreeBSD fresh install on ZFS mirror"
date = 2020-10-19
slug = "fixing-zpool-after-freebsd-fresh-install-on-zfs-mirror"
+++

I bought some new SSDs to install FreeBSD on a media server I'm setting up.
During install, I elected to install the OS on a ZFS mirror, using a pair
of SSDs. Upon booting up, I checked the zpool status:
```
# zpool status
  pool: zroot
 state: ONLINE
status: One or more devices could not be used because the label is missing or
        invalid.  Sufficient replicas exist for the pool to continue
        functioning in a degraded state.
action: Replace the device using 'zpool replace'.
   see: http://illumos.org/msg/ZFS-8000-4J
  scan: scrub repaired 0 in 0 days 00:00:09 with 0 errors on Mon Oct 19 20:13:49 2020
config:

        NAME                    STATE     READ WRITE CKSUM
        zroot                   ONLINE       0     0     0
          mirror-0              ONLINE       0     0     0
            ada0p4              ONLINE       0     0     0
            213823451083858949  UNAVAIL      0     0     0  was /dev/ada1p4

errors: No known data errors
```

Strange. Stranger still:

```
# zpool list
NAME    SIZE  ALLOC   FREE  CKPOINT  EXPANDSZ   FRAG    CAP  DEDUP  HEALTH  ALTROOT
zroot   230G  2.60G   227G        -         -     0%     1%  1.00x  ONLINE  -
```

Ignoring that apparent inconsistency...

First I tried taking the disk offline, then bringing it back oniline:
```
# zpool offline zroot ada1p4
# zpool online zroot ada1p4
warning: device 'ada1p4' onlined, but remains in faulted state
use 'zpool replace' to replace devices that are no longer present
```

Then according to the instruction, I tried `replace`-ing the drive:
```
# zpool replace zroot 213823451083858949 /dev/ada1p4
invalid vdev specification
use '-f' to override the following errors:
/dev/ada1p4 is part of active pool 'zroot'
```

This didn't help clarify the situation. Next I tried detaching and re-attaching the disk from the pool:
```
# zpool detach zroot 213823451083858949
# zpool status
  pool: zroot
 state: ONLINE
  scan: scrub repaired 0 in 0 days 00:00:11 with 0 errors on Mon Oct 19 21:06:06 2020
config:

        NAME        STATE     READ WRITE CKSUM
        zroot       ONLINE       0     0     0
          ada0p4    ONLINE       0     0     0

errors: No known data errors
# zpool attach zroot ada0p4 /dev/ada1
cannot attach /dev/ada1 to ada0p4: no such pool or dataset
```

I wish that last error message clarified which out of `zroot`, `/dev/ada1` and `ada0p4` it was referring
to by `no such pool or dataset`. Changing either argument to an obviously garbage value produced a
different error message.

Eventually I found a [blog post](https://dan.langille.org/2019/10/15/creating-a-mirror-from-your-zroot/)
by someone trying to do something similar to me, and a [forum post](https://forums.freebsd.org/threads/zpool-attach-no-such-pool-or-dataset.68292/#post-407102)
that suggested "using the full path (/dev/gpt/\<label\>)" which worked:
```
# zpool attach zroot ada0p4 /dev/gpt/zfs1
Make sure to wait until resilver is done before rebooting.

If you boot from pool 'zroot', you may need to update
boot code on newly attached disk '/dev/gpt/zfs1'.

Assuming you use GPT partitioning and 'da0' is your new boot disk
you may use the following command:

        gpart bootcode -b /boot/pmbr -p /boot/gptzfsboot -i 1 da0
```

And for good measure:
```
# gpart bootcode -b /boot/pmbr -p /boot/gptzfsboot -i 1 ada1
partcode written to ada1p1
bootcode written to ada1
```

And now things look ok:
```
# zpool status
  pool: zroot
 state: ONLINE
  scan: resilvered 2.60G in 0 days 00:00:12 with 0 errors on Mon Oct 19 21:28:10 2020
config:

        NAME          STATE     READ WRITE CKSUM
        zroot         ONLINE       0     0     0
          mirror-0    ONLINE       0     0     0
            ada0p4    ONLINE       0     0     0
            gpt/zfs1  ONLINE       0     0     0

errors: No known data errors
```
