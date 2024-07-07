+++
title = "7 Day Roguelike 2020: Day 7"
date = 2020-03-06T22:00:00+10:00
path = "7drl2020-day7"

[taxonomies]

[extra]
og_image = "screenshot.png"
+++

It's done! I spent today fleshing out the final boss fight, music, and lots and lots of playtesting and tweaking
until the game felt challenging but winnable (and fun!).

![screenshot.png](screenshot.png)

<!-- more -->

Among the myriad bugs I fixed today, the most visually interesting was this one:

![screenshot-bug.png](screenshot-bug.png)

Not every sludge cell contains a light, as that would be too computationally expensive.
Instead, just the boundary of the sludge pools are lights. This works well until you
get a really big sludge pool - no light from the edges reaches the centre!
The "fix" was to give each internal sludge cell a small chance of containing a light.

A less visually interesting bug I found was that when the desktop (ie. non-web) version
of the game ran for more than a few minutes, changing the currently-playing sound
causes the audio library to crash. I did a little digging and I can't see any easy fix
for this, so I've disabled audio in the desktop versions of the game. This is a shame
because I think the music really fit the aesthetics of the game, but it's not worth
the instability it caused. Also I expect most players to play the web-version of the
game anyway!

I'll do a longer post with a summary of the week and links to download and play the
game in a day or so.
If you can't wait, the source code is here: [https://github.com/gridbugs/slime99](https://github.com/gridbugs/slime99).
