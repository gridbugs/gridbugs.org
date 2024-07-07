+++
title = "Winit makes windows the wrong size in some cases I think"
date = 2020-11-03
slug = "winit-makes-windows-the-wrong-size-in-some-cases-i-think"
+++

I want to find some time to debug a problem with [chargrid_graphical](https://crates.io/crates/chargrid_graphical)
where new windows spend a couple of frames at their specified size before shrinking. It seems related to hi-dpi
scaling. In particular, when a program starts, I observe the hi-dpi scaling factor starting as 1, then briefly changing
to 1.6667, then back to 1 again after several milliseconds. My hypothesis is that there is a race condition in
[winit](https://crates.io/crates/winit) - the de-facto standard windows creation library for rust.
The scaling factor change from 1 to 1.6667 should have caused the window to get larger, but logging the size of the
window on each frame reveals that this never happens. The change from 1.6667 back to 1 does cause it to get smaller,
but it ends up 1/1.6667 of its original size. This suggests that winit is telling X11 (in my case) to resize the window,
and also querying X11 for windows sizes, and that there is a delay between telling X11 to resize and the change being
affected, during which X11 still reports the old size.

As to why new windows briefly have their scaling factor set to 1.6667, I have no idea! It's possibly related to
my multi-monitor setup, where one monitor is hi-dpi and the other is not. This behaviour only exhibits on the
non-hi-dpi monitor.
