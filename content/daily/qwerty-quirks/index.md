+++
title = "Qwerty Quirks"
date = 2020-09-04
slug = "qwerty-quirks"
+++

Here are two complications of switching to qwerty that I'm dealing with.

In vim, and many other tools, the HJKL keys are used for navigation in lieu of (or as well as) arrow keys.
To use vim with dvorak, these keys must be remapped. When setting this up, I elected to use the JKL; keys
instead, as this are where your right hand normally rests while typing. In qwerty I want to use the default
navigation keys again, which are one space to the left of where I'm used to placing my hands.
Navigation keys work in "normal" mode, and the "I" key is used to enter "insert" mode. Since "I" is above
HJKL, I use my right hand to press "I" as well as HJKL. After entering insert mode, I move my hand back
to the JKL; keys. Relative to the placement of my right hand, the "I" key is in a different place depending
on whether I'm in insert or normal mode.

The second problem is in tmux. I used to use ctrl-u as the prefix, which in dvorak means I was pressing
the physical f key. I can't change the prefix to ctrl-f as I use ctrl-f to search files in vim.
The default prefix is ctrl-b, but "B" is so far from the control key that I have to press "B" with my
right hand (and control with my left). I've changed the prefix to ctrl-x instead, as that has no use
to me in other terminal-bound programs. Since the tmux prefix is something I use all the time, I frequently
find myself pressing ctrl-f instead.
