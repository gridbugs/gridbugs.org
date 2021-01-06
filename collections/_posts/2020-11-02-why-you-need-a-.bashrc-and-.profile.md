---
layout: post
title: Why you need a .bashrc and .profile
date: 2020-11-02
categories: unix
permalink: /why-you-need-a-.bashrc-and-.profile/
excerpt_separator: <!--more-->
---

I've been doing this wrong my whole life.

For as long as I can remember I've included some version of the following line in my .bashrc:
```bash
export PATH="$HOME/bin:$HOME/.bin:$HOME/.local/bin:$HOME/.local/sbin:$PATH"
```
<!--more-->

This line defines a few directories inside my home directory where I can place executable
files which can be run without their full path. The problem this causes is when starting
a terminal from an existing terminal session (launching `tmux`, or launching a graphical
terminal from an X11 session started with `startx`), I end up with an unfortunate-looking `PATH`:

/home/steve/bin:/home/steve/.bin:/home/steve/.local/bin:/home/steve/.local/sbin:/home/steve/bin:/home/steve/.bin:/home/steve/.local/bin:/home/steve/.local/sbin:/home/steve/.local/bin:/home/steve/.bin:/home/steve/bin:/home/steve/bin:/home/steve/.bin:/home/steve/.local/bin:/home/steve/.local/sbin:/sbin:/bin:/usr/sbin:/usr/bin:/usr/local/sbin:/usr/local/bin

That was from a tmux session that had been launched from a graphical terminal emulator launched by dmenu running
in an X11 session that I started by running `startx` from a tty. Each time bash started, it would prepend `$HOME/bin/:...`
to the `PATH` variable, causing it to build up to the monstrosity above.

The solution: login shells and .profile.

Shells like bash can be run as "login shells", which causes them to behave a little differently to usual.
Of note, the .bashrc file is not sourced when bash is run as a login shell (other shells behave similarly with their respective rc files).
In lieu of .bashrc, the shell will source .profile (or .bash_profile).

The first shell you encounter when beginning a session will typically be a login shell.
When logging in to a tty, or ssh-ing into a machine, you'll find yourself in a login shell.
Subsequently started shells will generally not be login shells unless this is explicitly specified.
Thus the .profile file is the place for all per-session configuration, such as setting `PATH` and other environment variables.
All the per _shell_ configurations, such as aliases, functions, or the prompt, belong in .bashrc.
This is because unlike environment variables, these objects aren't inherited by nested shells; they must be defined again
in each new shell.

Since login shells are still shells, they should behave the same way as a regular shell from the user's point of
view. This means all the settings from .bashrc should still be applied. This it is typical to place the following the
start of .profile:
```bash
if [ -n "$BASH_VERSION" ]; then
    if [ -f "$HOME/.bashrc" ]; then
        . ~/.bashrc
    fi
fi
```
