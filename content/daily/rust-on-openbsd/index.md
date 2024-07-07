+++
title = "Rust on OpenBSD"
date = 2020-08-10
slug = "rust-on-openbsd"
+++

Rust projects tend to start using new language features as soon as they land in the stable compiler.
The rust compiler gets an update once per month, often adding new language features.
OpenBSD releases a new version every six months, and packages do not gain feature updates outside
of this release schedule (only security updates and bug fixes).
The implication of this is that most of the time, the rust compiler from OpenBSD's package repository
is too out-of-date to build most rust packages.

On pretty much any other system, the solution would be to just install rust with [rustup](https://rustup.rs/),
but rust doesn't make binaries available for OpenBSD, so that won't work here.
I could compile the rust compiler from source, but as the rust compiler is written in rust, and like most
rust projects, depends on recently-added language features, I'll need a fairly up-to-date rust compiler
to bootstrap the compiler from source, and the one in the package repo is till too old.

I sought help on the OpenBSD subreddit, and the advice I got was to switch to the "-current" branch
of OpenBSD, which takes the base system and packages from developer snapshots, rather than the biannual
stable release. I ran archlinux for the better part of a decade, so I'm not phased by this!
I followed the advice and everything has worked fine so far.

This means that the only issue preventing me from running OpenBSD on my personal laptop is a
lack of support for OpenBSD's audio system in the [cpal](https://crates.io/crates/cpal) rust
library. I need this because I make games in rust, and cpal appears to be the de-facto standard
way to play audio in rust, and I used it for audio in my game engine.
Now that I have a working rust compiler, I can start working on
adding OpenBSD support to cpal myself.
