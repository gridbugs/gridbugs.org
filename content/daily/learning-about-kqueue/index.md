+++
title = "Learning about kqueue"
date = 2020-11-11
slug = "learning-about-kqueue"
+++

I'm trying to fix a bug in the `rb-kqueue` gem which occasionally
[crashes the ruby interpreter](@/daily/building-this-site-sometimes-crashes-ruby/index.md)
when I'm running a file-watching server while working on this site.

The bug seems to be in the `rb-kqueue` gem, which is a thin wrapper around *BSD's kqueue
API, which is an interface for subscribing to notifications when a file changes, similar
to Linux's inotify.

To understand what's wrong with `rb-kqueue`, I'm going to start by learning how to make
the most basic thing that does what `rb-kqueue` does. To start, forget ruby, and makd something
simple in c.

Here's how to get started with kqueue:
```
$ man kqueue
```

...and scroll down to the "EXAMPLES" section.
Copy paste the example code into a c file, compile it, and run it.
It will watch the file specified as an argument and print a message when the watched file changes.

Then read the manual page and modify the code to learn more.
