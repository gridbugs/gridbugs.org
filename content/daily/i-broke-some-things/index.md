+++
title = "I broke some things"
date = 2020-10-13
slug = "i-broke-some-things"
+++

Last night I tried to set up a media server and managed to break just about
everything I touched. To start with the obvious, I got some hard drives mixed
up and accidentally wiped out the start of the disk where I store all my media.
That's recoverable - I have some stuff backed up and it can all be downloaded
again with little time and effort.

Next up, I tried installing an old hard drive I had lying around, in the old
PC that I was attempting to set up as a media server. After plugging in the drive,
and getting half-way through the FreeBSD installation, the drive appeared to fail.
I went to restart, and the PC wouldn't power on at all.
I tried all the obvious things and nothing worked. About an hour later it appeared
to recover on its own.

Finally I managed to get FreeBSD installed on an external hard drive. I booted it
up and started installing the packages I need for my media server. I attached a
brand new disk that I intended to fill with media, but my attempt to create and
format a partition failed, and then the disk stopped showing up at all in subsequent
reboots or in the Windows dual-boot that I maintain (on a separate disk).

Shortly afterwards the external hard drive I was running FreeBSD off stopped showing
up as a boot option. I haven't dug too deeply into this yet.

The most worrying thing about this whole experience is the hour when the machine
didn't turn on at all, and the fact that it recovered on its own. I suspect its
power supply is on the way out - it is about 8 years old, and the advise is to
replace power supplies after about 5 years.

[Gratuitous xkcd:](https://xkcd.com/349/)

![success.png](success.png)
