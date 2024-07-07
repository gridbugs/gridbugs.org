+++
title = "Bootstrapping Nightly Rust on OpenBSD"
date = 2020-08-11
slug = "bootstrapping-nightly-rust-on-openbsd"
+++

I underestimated my requirements of a rust compiler:
- I occasionally need to use the nightly compiler rather than the stable compiler to enable experimental features
- I need to be able to install the web assembly target for rust so I can compile my games to web assembly

These two tasks are both handled by [rustup](https://rustup.rs/).
Frustratingly, when researching how to live without this rustup, [the response is often to just use rustup](https://www.reddit.com/r/rust/comments/9skiyi/wasm_without_rustup/).
This is a massive pet peeve of mine.

[But there is hope!](https://github.com/rust-lang/rustup/issues/2168)
Using rustup to add targets (such as web assembly) seems like it's still possible on OpenBSD,
even if rustup can't be used to install the compiler itself.

One of the maintainers of the OpenBSD rust port has made
[this script](https://github.com/semarie/build-rust) for bootstrapping the nightly toolchain
from OpenBSD's rust package (via the beta toolchain).
A caveat is that you must be running OpenBSD -current, as [as I discovered yesterday](@/daily/rust-on-openbsd/index.md),
the rust package on -stable is too out-of-date to build the rust compiler.
I've re-purposed my old gaming PC as a build server, and I'm compiling rust from source now!
