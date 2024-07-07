+++
title = "How I start X"
date = 2020-11-05
slug = "how-i-start-x"
+++

On FreeBSD and Linux I start X with `startx`. I don't use a display manager, instead electing to
login directly to a tty and start X explicitly. Over the years I've tried out a bunch of display
managers. I used SLIM while it existed, and LXDM after that, but at some point I decided that
the complexity of configuring a display manager to start X just the way I like meant more work
than typing `startx` the first time I login to my computer. I maintain a .xinitrc file which
performs some setup and starts my window manager of choice - dwm.

On OpenBSD, which I occasionally experiment with, there is no `startx` command because something
something security. OpenBSD comes with a display manager called "xenodm" (if you select it
during installation), which presents you with a graphical login form, then starts X by running
a file called ".xsession" in your home directory. My .session looks like this:
```
. ~/.profile
. ~/.xinitrc
```
It sources .profile to set environment variables for the window manager, then sources .xinitrc
to start the window manager as per my carefully crafted configuration. Simple!
