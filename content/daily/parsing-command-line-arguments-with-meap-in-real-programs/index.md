+++
title = "Parsing command-line arguments with meap in real programs"
date = 2020-09-19
slug = "parsing-command-line-arguments-with-meap-in-real-programs"
+++

Now that [meap](https://crates.io/crates/meap) is feature complete, I've started
adding it to some personal projects as a replacement for my previous command-line
argument parser - [simon](https://crates.io/crates/simon).
Meap is intentionally more conservative in its features than simon, so switching
was not always straightforward.

The first program I adapted was [sand](https://crates.io/crates/sand), which is a
replacement for `sleep` that waits for a given amount of time, but gives you a running
update of the amount of time left. It doesn't have very complicated arguments, so
this was not super interesting.

The second program I changed was [slime99](https://github.com/gridbugs/slime99), which
is a game I made for the "7 Day Roguelike" gamejam earlier this year.
This was a little more involved. In particular, it revealed a use case I hadn't planned for:
choosing at most one of a set of possibilities. When run in a terminal, slime99 accepts an
argument telling what colour space to run in (24-bit rgb, 256 colours, greyscale).
This seemed like a common enough use case, so I added some combinators and a macro to
make this simpler. The code in slime99 that parses this argument now looks like this:
```rust
enum ColEncodeChoice {
    TrueColour,
    Rgb,
    Greyscale,
    Ansi,
}

impl ColEncodeChoice {
    fn parser() -> impl meap::Parser<Item = Self> {
        use meap::Parser;
        use ColEncodeChoice::*;
        meap::choose_at_most_one!(
            flag("true-colour").some_if(TrueColour),
            flag("rgb").some_if(Rgb),
            flag("greyscale").some_if(Greyscale),
            flag("ansi").some_if(Ansi),
        )
        .with_default_general(TrueColour)
    }
}
```
