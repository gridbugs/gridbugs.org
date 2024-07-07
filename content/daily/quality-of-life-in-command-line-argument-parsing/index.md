+++
title = "Quality of life in command-line argument parsing"
date = 2020-09-13
slug = "quality-of-life-in-command-line-argument-parsing"
+++

I added a quality-of-life macro to [args_af](https://github.com/gridbugs/args-af)
to make it easier to specify arguments:
```rust
struct Args {
    optional_int: Option<i32>,
    string: String,
    flag: bool,
}

impl Args {
    fn parse() -> Self {
        (args_af::args_map! {
            let {
                optional_int = opt_opt('i');
                string = pos_req("STRING");
                flag = flag('f');
            } in {
                Self {
                    optional_int,
                    string,
                    flag,
                }
            }
        })
        .parse_env()
        .unwrap()
    }
}
```
...which generates code like:
```rust
impl Args {
    fn parse() -> Self {
        opt_opt('i').both(pos_req("STRING")).both(flag('f'))
        .map(|((optional_int, string), flag)| {
            Self {
                optional_int,
                string,
                flag,
            }
        })
        .parse_env()
        .unwrap()
    }
}
```

Note the chained calls to `both`, and the destructured nested pairs in the argument list
to the mapped function. The benefit of the `args_map` macro is it lets you associate the
specification of each argument with the variable it will be assigned to. Also it removes
the need to explicitly unpack the nested tuple created by repeated calls to `both`.
