+++
title = "The latest rust release broke backtraces on FreeBSD"
date = 2020-10-23
slug = "the-latest-rust-release-broke-backtraces-on-freebsd"
+++

Rust 1.47 broke backtraces on FreeBSD. Backtraces are now handled by [gimli](https://crates.io/crates/gimli)
which does not support meaningful backtraces on FreeBSD at the time of writing. Backtraces now look like:
```
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

On rust 1.46, they looked like this:
```
stack backtrace:
   0: backtrace::backtrace::libunwind::trace
             at /cargo/registry/src/github.com-1ecc6299db9ec823/backtrace-0.3.46/src/backtrace/libunwind.rs:86
   1: backtrace::backtrace::trace_unsynchronized
             at /cargo/registry/src/github.com-1ecc6299db9ec823/backtrace-0.3.46/src/backtrace/mod.rs:66
   2: std::sys_common::backtrace::_print_fmt
             at src/libstd/sys_common/backtrace.rs:78
   3: <std::sys_common::backtrace::_print::DisplayBacktrace as core::fmt::Display>::fmt
             at src/libstd/sys_common/backtrace.rs:59
   4: core::fmt::write
             at src/libcore/fmt/mod.rs:1076
   5: std::io::Write::write_fmt
             at src/libstd/io/mod.rs:1537
   6: std::sys_common::backtrace::_print
             at src/libstd/sys_common/backtrace.rs:62
   7: std::sys_common::backtrace::print
             at src/libstd/sys_common/backtrace.rs:49
   8: std::panicking::default_hook::{{closure}}
             at src/libstd/panicking.rs:198
   9: std::panicking::default_hook
             at src/libstd/panicking.rs:217
  10: std::panicking::rust_panic_with_hook
             at src/libstd/panicking.rs:526
  11: rust_begin_unwind
             at src/libstd/panicking.rs:437
  12: core::panicking::panic_fmt
             at src/libcore/panicking.rs:85
  13: core::slice::<impl [T]>::copy_from_slice
             at /rustc/04488afe34512aa4c33566eb16d8c912a3ae04f9/src/libcore/macros/mod.rs:16
  14: mini_gpt::GptHeader::crc32_from_logical_block
             at mini-gpt/src/lib.rs:166
  15: mini_gpt::GptHeader::parse
             at mini-gpt/src/lib.rs:124
  16: mini_gpt::write_header
             at ./mini-gpt/src/lib.rs:614
  17: gpt_fat_disk_image_create::main
             at tools/src/create.rs:55
  18: std::rt::lang_start::{{closure}}
             at /rustc/04488afe34512aa4c33566eb16d8c912a3ae04f9/src/libstd/rt.rs:67
  19: std::rt::lang_start_internal::{{closure}}
             at src/libstd/rt.rs:52
  20: std::panicking::try::do_call
             at src/libstd/panicking.rs:348
  21: std::panicking::try
             at src/libstd/panicking.rs:325
  22: std::panic::catch_unwind
             at src/libstd/panic.rs:394
  23: std::rt::lang_start_internal
             at src/libstd/rt.rs:51
  24: std::rt::lang_start
             at /rustc/04488afe34512aa4c33566eb16d8c912a3ae04f9/src/libstd/rt.rs:67
  25: main
  26: _start
             at /usr/src/lib/csu/amd64/crt1.c:76
```

This was a regression in the rust compiler and not a problem with FreeBSD as I
[previously thought](@/daily/rust-stacktraces-are-unknown-on-freebsd/index.md),
which is a relief. FreeBSD is a [tier 2](https://doc.rust-lang.org/nightly/rustc/platform-support.html#tier-2)
rust platform, so tests don't necessarily run, and breakages like this one aren't
the end of the world, though this is the first real problem I've run into using rust
on FreeBSD.

The temporary solution is to switch back to rust 1.46. This meant changing back some parts
of my GPT FAT disk tools that were taking advantage of the
[const generic teaser](https://blog.rust-lang.org/2020/10/08/Rust-1.47.html#traits-on-larger-arrays)
included in 1.47.
