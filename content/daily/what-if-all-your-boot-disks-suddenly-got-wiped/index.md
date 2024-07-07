+++
title = "What if all your boot disks suddenly got wiped?"
date = 2020-10-14
slug = "what-if-all-your-boot-disks-suddenly-got-wiped"
+++

The other night, by a string of coincidences, I had an experience where
every hard drive I tried to use would fail. I've since recovered most of
them, but it got me thinking about how I would recover if all the unix
boot disks in my house were mysteriously wiped.

In at least the last 5 years, I've barely spared a thought for CDs, let alone use
one to install an operating system. Thus all my recent unix installs have involved `dd`-ing
a disk image file onto a USB stick, booting off it, and installing from there.
But `dd` is a unix program, so unix needs to be bootstrapped from something else.

My first ever unix install was in 2009 and it
involved using PowerISO running on Windows 7 to burn a Ubuntu (Karmic Koala I think)
install CD. At some point shortly after this, I started using Linux as a daily driver,
and a few years later optical disks faded into irrelevance. From that point onwards,
there's an unbroken chain of using an existing unix installation to `dd` an install
environment for my next unix installation, though I suppose it's
possible this chain was interrupted
by a mac with pre-installed MacOS at some point.

In practice, at some point, probably around 2013, I stopped distro-hopping and
settled on archlinux. I `dd`-ed myself an arch install thumb drive which I've
carried on my keyring ever since, and I used it for all subsequent installs.
If everything were wiped, and a situation were contrived that prevented me from
using a computer at work, or a friend's computer to download and `dd` an install image?
Well I think I have an old DVD drive lying around, and a case of old CDs which I
think includes a Ubuntu Karmic Koala boot disk.
