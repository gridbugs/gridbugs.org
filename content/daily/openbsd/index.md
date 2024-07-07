+++
title = "OpenBSD"
date = 2020-08-07
slug = "openbsd"
+++

I've been toying around with OpenBSD in a virtual machine to see whether I could
switch to it as a daily driver. I'm attracted to the project because of its
emphasis on minimalism and security. There's a few things I need to figure out
before I can be as productive in OpenBSD as I am in Linux (which I use in most places)
or FreeBSD (which I recently switched to on my personal laptop).

- the rust compiler tools aren't available from the rust project (via [rustup](https://rustup.rs/))
  compiled for OpenBSD (but rustc and cargo are in the package repository, just several versions out of date)
- the popular rust audio library [cpal](https://crates.io/crates/cpal) doesn't appear to support OpenBSD.
  Currently it depends on alsa on unixes, which works on Linux, and FreeBSD (which emulates alsa) but
  OpenBSD has no interest in Linux compatibility (which is fair enough!).
- nodejs doesn't compile in its default configuration as it depends on libdl which doesn't exist in OpenBSD.
  The only reason it exists in FreeBSD for (again) compatibility with Linux.
  I use [nvm](https://github.com/nvm-sh/nvm)
  to manage multiple versions of nodejs, and it builds nodejs from source when no binary distribution is
  available. You can pass configuration flags to nvm which it passes on to
  nodejs's build system. Just got to work out the right ones to get it to build on OpenBSD.

I can live without rustup. It also wouldn't surprise me if it got support for OpenBSD at some point.
I'll probably have to add OpenBSD support to cpal as alsa isn't (and shouldn't) be available on OpenBSD.
There's got to be a way to configure nodejs to build on OpenBSD. Need to do some more reading.
These aren't problems on FreeBSD because FreeBSD tries to be compatible with Linux.
The lack of this on OpenBSD is a selling point, but it does come at a cost of convenience.
There's a few things I still need to learn before I can live with this inconvenience.
