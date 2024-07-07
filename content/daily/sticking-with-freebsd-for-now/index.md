+++
title = "Sticking with FreeBSD for now"
date = 2020-08-12
slug = "sticking-with-freebsd-for-now"
+++

I'm going to stop boiling the ocean in an attempt to run OpenBSD on my laptop
and accept that the tools that I need to be productive in my personal projects
currently don't support OpenBSD. The one tool in question is [rustup](https://rustup.rs/),
which makes it _convenient_ to manage multiple concurrent rust insallations (e.g. stable for most things
and nightly for the rest), but it's all but _essential_ to set up cross compilation
toolchains, which I especially need for compiling rust to web assembly.
I _could_ continue down my current path of building the rust compiler and rustup
from source, and convincing rustup to manage toolchains even though the compiler
binaries aren't even available for OpenBSD. After starting down this route, I've decided
that it's more effort than it's worth right now, and my setup wouldn't be as reliable
as it would on (say) FreeBSD, as I'd be using a bunch of tools in a way which doesn't have the
"blessing" of their maintainers, which means I should expect occasional breakages.
Not to mention that the _only_ way to be productive on rust is to run the -current branch
of OpenBSD, (for an up-to-date rust package) which is itself subject to occasional breakages.

In the ideal world, I'd run -stable OpenBSD and use rustup to manage a rust installation.
In the meantime I will keep an eye on rust platform support, and as soon as OpenBSD gains
[tier 2](https://forge.rust-lang.org/release/platform-support.html#tier-2) I'll have another
go at switching to it as a daily driver.

This experiment has taught me a great deal. As a result, my [dotfiles repository](https://github.com/gridbugs/dotfiles)
(a collection of config files I maintain) has become more portable, and I've re-evaluated
my dependencies on language managers and removed most of them (all but rustup!).
OpenBSD is the only OS that I've installed on my laptop (a lenovo thinkpad t470) where the
"out of the box" functionality included a working trackpad, wifi, and lcd backlight (with the exception of windows
which I don't think I ever actually booted up).
