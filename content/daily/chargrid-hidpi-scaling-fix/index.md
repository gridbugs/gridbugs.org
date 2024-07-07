+++
title = "Chargrid HiDPI Scaling Fix"
date = 2020-11-09
slug = "chargrid-hidpi-scaling-fix"
+++

I spent some time over the weekend trying to reproduce a bug where
[winit windows end up the wrong size due to rapid scaling factor changes](@/daily/winit-makes-windows-the-wrong-size-in-some-cases-i-think/index.md).
Ultimately I couldn't reproduce the problem (but I'm keeping an eye out) but what I did learn is that when the
mouse cursor is on the hidpi monitor (I have two - one hidpi and one normal-dpi), and a windows opens on the non-hidip
monitor, it starts with the hidip scaling factor, but soon after starting its scaling factor changes back to 1.
I found that [chargrid_graphical](https://crates.io/crates/chargrid_graphical) wasn't handling the scaling factor change
(only the accompanying window size change), which caused graphics to appear blurry after the resize. It's now fixed.
