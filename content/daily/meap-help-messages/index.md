+++
title = "Meap Help Messages"
date = 2020-09-17
slug = "meap-help-messages"
+++

My command-line parsing library - [meap](https://github.com/gridbugs/meap) -
can now generate help messages such as this:
```
$ cargo run --example macro -- -h
    Finished dev [unoptimized + debuginfo] target(s) in 0.02s
     Running `target/debug/examples/macro -h`
Usage: target/debug/examples/macro [OPTIONS] STRING [DURATION ...]

Args:
    STRING           a string
    [DURATION ...]

Options:
    [-i INT]
    [-f, --flag-with-a-really-long-name]
                flag with a really long name
    [-c ...]
    [-h, --help]                     print help message

```

This completes the minimal viable set of features for this library, so I did
an [initial release](https://crates.io/crates/meap) on crates.io.
Feature-wise, I still need to add default values for optional arguments.
I also want to spend some time writing documentation and tests.
