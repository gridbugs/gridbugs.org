+++
title = "Rust stacktraces are <unknown> on FreeBSD"
date = 2020-10-21
slug = "rust-stacktraces-are-unknown-on-freebsd"
+++

Tonight I ran into an issue where when a rust program panics on my FreeBSD
laptop, the stacktrace doesn't contain code locations, and instead shows
`<unknown>` on every line:

```
$ RUST_BACKTRACE=full cargo run --bin gpt-fat-disk-image-create -- -l README.md -d /foo/bar/baz.md -o /tmp/a
    Finished dev [unoptimized + debuginfo] target(s) in 0.06s
     Running `target/debug/gpt-fat-disk-image-create -l README.md -d /foo/bar/baz.md -o /tmp/a`
thread 'main' panicked at 'source slice length (92) does not match destination slice length (512)', /rustc/31530e5d132ebcc3654baf2e5460599681520af0/library/core/src/slice/mod.rs:2673:13
stack backtrace:
   0:          0x11298b1 - <unknown>
   1:          0x1141d60 - <unknown>
   2:          0x11277df - <unknown>
   3:          0x112b59d - <unknown>
   4:          0x112b24c - <unknown>
   5:          0x112bc45 - <unknown>
   6:          0x112b80d - <unknown>
   7:          0x1129d70 - <unknown>
   8:          0x112b7cc - <unknown>
   9:          0x1141040 - <unknown>
  10:          0x11437f7 - <unknown>
  11:          0x10a0864 - <unknown>
  12:          0x1096c59 - <unknown>
  13:          0x1096095 - <unknown>
  14:          0x108351d - <unknown>
  15:          0x1073e66 - <unknown>
  16:          0x108af2e - <unknown>
  17:          0x107bad1 - <unknown>
  18:          0x106a3c4 - <unknown>
  19:          0x112c0ae - <unknown>
  20:          0x106a3a2 - <unknown>
  21:          0x1073f0b - <unknown>
  22:          0x106a10b - <unknown>
```

Sounds at least related to a
[known issue](https://github.com/rust-lang/rust/issues/54434), but that issue is already
closed and not necessarily the same problem so I raised a new one.
It's not clear whether the problem lies with rust or FreeBSD (or elsewhere).

But this is a major hindrance to my productivity!
Rust development is the main thing I use this computer for.
There are a couple of Linux distros I've been meaning to check out, namely [void](https://voidlinux.org/)
and [crux](https://crux.nu), and I can always go crawling back to archlinux if they don't work out.
