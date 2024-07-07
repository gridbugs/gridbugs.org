+++
title = "Move semantics and argument parsing"
date = 2020-09-20
slug = "move-semantics-and-argument-parsing"
+++

In my initial design for [meap](https://crates.io/crates/meap), the `Parser` trait contained this
method which extracts typed values from an untyped low-level parser output:

```rust
fn parse_low_level(
    self,
    ll: &mut low_level::LowLevelParserOutput,
) -> Result<Self::Item, Box<dyn error::Error>>;
```

Note that the parser is consumed by this method; After calling this method on a parser, the parser
is destroyed. This allows the parser to contain values which move into its parsed output.
Two examples:
 - a parser wrapping another parser, giving it a default value. The default value stored in the parser can
   be moved into the result in the case where it's needed, preventing the need to copy the data from the
   parser into its output.
 - the `Map` combinator, which wraps a parser, and calls a function on its output. I want to make the function
   a `FnOnce` - the most permissive of rust's function traits - but calling a `FnOnce` consumes it. If the
   mapped function was in a field of the `Map` combinator, the entire combinator would need to be consumed
   in order to call the `FnOnce`.

This worked perfectly fine up until I added help messages. If the argument parser finds that its input is
invalid, it stops parsing and prints a help message, including details on arguments that it accepts.
E.g.
```
Usage: sand [OPTIONS] PERIOD

Args:
    PERIOD     how long to wait

Options:
    [-i, --interval DURATION]     how frequently to update the display (Default: 1s)
    [-h, --help]                  print help message
```

The problem is that if we're part-way through parsing, and encounter an error, part of the
parser has already been consumed by the parsing process, and so can't be re-traversed to
generate a help message.

This requirement led to me changing the type of the method above:

```rust
fn parse_low_level(
    &mut self,
    ll: &mut low_level::LowLevelParserOutput,
) -> Result<Self::Item, Box<dyn error::Error>>;
```

Now the parser is mutably borrowed, so it remains in scope after parsing.
This is slightly unfortunate as now some errors that were previously caught at compile-time
are now caught at runtime. In particular, for parsers that contain some value that is moved
out during parsing, running the parser twice will panic as the necessary values are gone.
Previously it was not possible to run the parser twice, as it was destroyed by running.

Note that running the parser twice is a mistake, but now it's possible (though still not easy!)
to make this mistake.

The `Map` combinator is now defined as:
```rust
pub struct Map<T, U, F: FnOnce(T) -> U, PT: Parser<Item = T>> {
    f: Option<F>,
    parser_t: PT,
}
```

Its implementation of `parse_low_level`:
```rust
fn parse_low_level(
    &mut self,
    ll: &mut low_level::LowLevelParserOutput,
) -> Result<Self::Item, Box<dyn error::Error>> {
    Ok((self.f.take().expect("function has already been called"))(
        self.parser_t.parse_low_level(ll)?,
    ))
}
```

A similar technique is employed for default combinators.
Put the "moving out" data inside an `Option`, and move the data out of the `Option`
when needed, setting the `Option` to `None` in the process, and crashing if it was
already `None`.
