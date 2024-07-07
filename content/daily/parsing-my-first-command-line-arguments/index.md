+++
title = "Parsing my first command-line arguments"
date = 2020-09-12
slug = "parsing-my-first-command-line-arguments"
+++

Today I got [args_af](https://github.com/gridbugs/args-af) to the point that it can parse
command line arguments.
Here's a simple program that parses arguments with my library:

```rust
fn main() {
    use args_af::prelude::*;
    let (foo, verbosity): (String, _) = opt_req()
        .long("foo")
        .both(flag_multi().short('v').long("verbose"))
        .parse_env()
        .unwrap();
    println!("{} {}", foo, verbosity);
}
```

Here's how it looks in action:
```
$ cargo run --example basic -- --foo=bar -vvvv --verbose
    Finished dev [unoptimized + debuginfo] target(s) in 0.01s
     Running `target/debug/examples/basic --foo=bar -vvvv --verbose`
bar 5
```

The next step is getting the library to generate help messages.
