+++
title = "Time to stop using language managers"
date = 2020-08-09
slug = "time-to-stop-using-language-managers"
+++

A few days ago I listed some problems I need to solve before I consider switching to OpenBSD in earnest.
Getting nodejs to compile with [the nodejs version manager](https://github.com/nvm-sh/nvm) was one such problem.
NVM is a tool for managing the concurrent installation of multiple different versions of nodejs.
When possible it downloads binary distributions of nodejs, but in uncommon environments such as OpenBSD
it builds nodejs from source.

Without modifications to its source code, nodejs does not build on OpenBSD.
Last night I figured out how to get nodejs to build.
There's a couple of places where it assumes that FreeBSD is the only BSD.
Only after getting it working did it occur to
me to just look in the [ports tree](https://github.com/openbsd/ports/tree/master/lang/node)
which contains the patches necessary to get nodejs to build on OpenBSD.

I don't want to let language vendors dictate my choice of operating system.
The port maintainers go to the trouble of patching language implementations for OpenBSD,
and I don't want to duplicate their efforts. If I'm not going to use nvm I may as well just use
the binary nodejs package for OpenBSD.

That leaves the question of what to do about projects
that depend on old versions old nodejs. I only have a handful of these ([such as this one](https://github.com/gridbugs/roguelike-lighting-demo/)),
and I'm not actively working on any of them. It would just be nice if they continued to compile.
That said, I don't expect to need to build them very often, so going out of my way to make the process easy
by using a version manager is not worth it. _If_ I ever need to build these projects again,
I can just compile the correct version of nodejs myself (possibly using patches from the ports tree as a reference),
or just run a different OS in a virtual machine.

I also use [the ruby version manager](http://rvm.io/) to manage installations of ruby.
The only reason I started using this was to get around some long forgotten problem I had
years ago installing ruby with apt on ubuntu.
The only purpose I have for ruby is this website. It's very simple and easy to keep up to date, so
managing multiple ruby versions is not something I need. The ruby packages in FreeBSD and OpenBSD both
work perfectly fine, so bye bye rvm.

Finally there's [rustup](https://rustup.rs/). This one's a little harder to live without.
On OpenBSD this decision is made for me, as the rust project doesn't have binaries available
anyway. The problem is that people who use rust (myself included) get really excited about
new language features, and start using them in their projects right away.
OpenBSD has binary rust packages available, but at the time of writing they're several
versions out of date (at the time of writing 1.42 compared to 1.45).
The rust language server [rust-analyser](https://github.com/rust-analyzer/rust-analyzer)
requires 1.43 of the compiler. I also occasionally rely on the ability to switch back and
forth between the stable and nightly versions of the rust compiler to enable experimental features.

I'll stop using nvm and rvm which will greatly simplify my setup. I'll continue to use rustup, and look forward to it becoming
available on OpenBSD.
