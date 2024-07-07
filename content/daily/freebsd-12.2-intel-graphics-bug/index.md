+++
title = "FreeBSD 12.2 intel graphics bug"
date = 2020-10-30
slug = "freebsd-12.2-intel-graphics-bug"
+++

I updated my laptop to FreeBSD 12.2 and could no longer start X.
My laptop is a Lenovo Thinkpad T470 with intel graphics.

The quick and dirty workaround was to configure X to use the vesa driver
rather than the intel graphics driver.

```
# /usr/local/etc/X11/xorg.conf.d/driver-intel.conf
Section "Device"
    Identifier "Card0"
    Driver     "vesa"
    # Driver     "intel"
    # Option     "DRI" "3"
EndSection
```

After this change I could start X, but the vesa driver is slow.

I found the fix in [a tweet](https://twitter.com/vermaden/status/1321375859429773312).

The problematic package is drm-kmod. The fix is to rebuild it from the ports tree.

Instructions copied from tweet:
```
# svnlite release
# portsnap auto
# make -C /usr/ports/graphics/drm-fbsd12.0-kmod build deinstall install clean
```

Switch the X config to use the intel driver again, and reboot, and X will be working again
with the intel driver.

Here's the contents of my /usr/local/etc/svnup.conf:
```
# $FreeBSD$
#
# Default configuration options for svnup.conf.

[defaults]
work_directory=/var/tmp/svnup
host=svn.freebsd.org
#host=svn0.us-west.freebsd.org
#host=svn0.us-east.freebsd.org
#host=svn0.eu.freebsd.org
protocol=https
verbosity=1
trim_tree=0
extra_files=0
#repository_base=

[release]
branch=base/releng/12.2
target=/usr/src

[ports]
branch=ports/head
target=/usr/ports

[stable]
branch=base/stable/12
target=/usr/src

[current]
branch=base/head
target=/usr/src
```
