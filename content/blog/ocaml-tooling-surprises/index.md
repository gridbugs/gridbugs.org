+++
title = "OCaml Tooling Surprises"
date = 2024-08-12
path = "ocaml-tooling-surprises"
draft = true

[taxonomies]
tags = ["ocaml"]
+++

![A landscape of a rugged mountain range](background.jpg)

<div style="color:gray;font-style:italic">
I wrote the first version of this post a year ago for
<a href="https://tarides.com/blog">my employer's blog</a> but it was never published.
I recently got permission to post it here instead.
</div>

This post is about some frustrating interactions I had with tooling
while developing my first non-trivial OCaml project - [an audio
synthesizer library](https://github.com/gridbugs/llama/). My goal here
is to help normalize the idea that some OCaml dev tools
are rough around the edges. If you're learning OCaml and struggling
with the tools, it's not because you're bad at programming - it's the
tools. I've spent years of my programming career dealing with
imposter syndrome and if someone had told me at the start of my OCaml journey
"Yeh don't worry, everyone has trouble installing packages with Opam,
it's not just you," it would have improved my mental
health a ton. I'll attempt to normalize the idea that OCaml tools can be
hard to use by sharing a bunch of stories where
a tool didn't work the way I expected (as well as the necessary workarounds
and related github issues!).

But first, some disclaimers. I'm
currently employed by Tarides where I work on the team largely
responsible for the Dune build system, but all the opinions in this
post are my own. I've been a user of Dune and Opam for about 2 years (1
year at the point when I first wrote this) and I've worked as a
programmer for over a decade across many different software
ecosystems.

The language I use most is Rust, though I've only used it for personal
projects. I choose Rust for most of my hobby programming specifically
because I find it easy to manage dependencies and build projects with
Cargo. I have limited free time and I'd rather spend it making cool
stuff instead of fighting against the package manager or build
system. Which brings us to...

## All the times an OCaml dev tool or library did something unexpected while I was developing my synthesizer library

- [Linking against native libraries with Dune is non-trivial (but possible!)](#linking-against-native-libraries-with-dune-is-non-trivial-but-possible)
- [Dune silently ignores directories starting with a period (by default), breaking Rust interoperability](#dune-silently-ignores-directories-starting-with-a-period-by-default-breaking-rust-interoperability)
- [The obvious choice of package for reading `.wav` files crashes when reading `.wav` files](#the-obvious-choice-of-package-for-reading-wav-files-crashes-when-reading-wav-files)
- [Transferring an array of floats from Rust to OCaml produced a broken array (this is now fixed!)](#transferring-an-array-of-floats-from-rust-to-ocaml-produced-a-broken-array-this-is-now-fixed)
- [Adding inline tests to a library requires adding over 20 (runtime) dependencies](#adding-inline-tests-to-a-library-requires-adding-over-20-runtime-dependencies)
- [If some (but not all) of the interdependent packages in a project are released, Opam cannot automatically install the project's dependencies](#if-some-but-not-all-of-the-interdependent-packages-in-a-project-are-released-opam-cannot-automatically-install-the-project-s-dependencies)
- [Dune can generate `.opam` files but requires a workaround for adding the `available` field](#dune-can-generate-opam-files-but-requires-a-workaround-for-adding-the-available-field)

### Linking against native libraries with Dune is non-trivial (but possible!)

The first thing I needed to do was make a program that plays a simple
sound.  The most reliable cross-platform library I'm aware of for
interfacing with sound drivers is
[`cpal`](https://crates.io/crates/cpal).  One problem: It's a Rust
library. (I've since learned of
[`ocaml-ao`](https://github.com/savonet/ocaml-ao) which provides
bindings for the cross-platform audio library `libao`.)

Calling into Rust from OCaml was easier than I expected
thanks to the [`ocaml-rs`](https://crates.io/crates/ocaml)
library. Using `ocaml-rs` and `cpal`, I made a small Rust library
named `low_level` which accepts a stream of `float`s representing
audio data, and plays them on the computer's speakers. I compiled this
library to an archive file `liblow_level.a`, and wrote a little OCaml
library `llama_low_level` (my synthesizer library is named `llama`) to
wrap it with a higher-level interface.

I'm using Dune to build this project. Dune has a mechanism for linking
against native libraries like `liblow_level.a`, and the
[`ocaml-rs` documentation](https://zshipko.github.io/ocaml-rs/) gives
some advice on how to write your `dune` file (the per-directory build
config files used by Dune). I started with this:

```dune
(library
 (name llama_low_level)
 (foreign_archives low_level)
 (c_library_flags
  (-lpthread -lc -lm)))
```

Building this library gave the error:

```
$ dune build
...
Error: No rule found for dlllow_level.so
```

Dune is looking for the shared library file `dlllow_level.so` for my
`low_level` library, but I only compiled `low_level` to a static
archive `liblow_level.a`. There's no reason the linker needs to be
provided with both of these files, so I took a look through
[dune's (library ...) stanza documentation](https://dune.readthedocs.io/en/stable/dune-files.html#library)
to see if there's a way to only link against the static library and
discovered the `no_dynlink` field:

> `(no_dynlink)` disables dynamic linking of the library. This is for advanced use only. By default, you shouldn’t set this option.

A little intimidating but let's give it a shot:

```dune
(library
 (name llama_low_level)
 (no_dynlink)                 ; <-- the new field
 (foreign_archives low_level)
 (c_library_flags
  (-lpthread -lc -lm)))
```

Running `dune build` on the `llama_low_level` library now works as expected.

Next step is to actually make some noise. I made a little program
simply named `experiment` which uses `llama_low_level` to play a sine
wave. Here's its `dune` file:

```dune
(executable
 (public_name experiment)
 (libraries llama_low_level))
```

Trying to build this program filled my screen with errors. The first error was:

```
$ dune build
File "bin/dune", line 2, characters 14-24:
2 |  (public_name experiment)
                  ^^^^^^^^^^
Undefined symbols for architecture arm64:
  "_AudioComponentFindNext", referenced from:
      cpal::host::coreaudio::macos::audio_unit_from_device::h062e0db473d1abd3 in liblow_level.a...
```

I searched the web for `AudioComponentFindNext` which led me to some
Apple developer docs for the AudioToolbox framework. So the foreign
archive must depend on some frameworks on MacOS for doing audio
stuff and I need to tell the linker about it. Eventually I found the
appropriate linker flags to copy/paste from stack overflow:

```
-framework CoreServices -framework CoreAudio -framework AudioUnit -framework AudioToolbox
```

Now I have to find a way to pass these flags to the linker. If this
was a C program I could pass them via the C compiler. Something like:

```
clang foo.c -Wl,-framework,CoreServices,-framework,CoreAudio,-framework,AudioUnit,-framework,AudioToolbox
```

Dune provides a mechanism for passing additional linker flags when compiling a library:
> `(library_flags (<flags>))` is a list of flags passed to ocamlc and ocamlopt when building the library archive files.

And similar to the C compiler example above, the OCaml compiler also
has a way of passing custom flags along to the linker. From `man
ocamlc`:

>    -cclib -llibname
>
>    Pass the -llibname option to the C linker when linking in "custom
>    runtime" mode (see the -custom option). This causes the given C
>    library to be linked with the program.
>
>    -ccopt option
>
>    Pass the given option to the C compiler and linker, when linking
>    in "custom runtime" mode (see the -custom option). For instance,
>    -ccopt -Ldir causes the C linker to search for C libraries in
>    directory dir.

It's not immediately clear which of those two options I need. After some trial and error `-cclib` turns out to be the winner.

I added a `library_flags` field to the `dune` file for `llama_low_level`:

```dune
(library
 (name llama_low_level)
 (no_dynlink)
 (foreign_archives low_level)
 (c_library_flags
  (-lpthread -lc -lm))
 (library_flags
  (-cclib "-framework CoreServices -framework CoreAudio -framework AudioUnit -framework AudioToolbox")))
```

That's sufficient to get it building on MacOS and the sine wave now
playing through my speakers was music to my ears.

But what about on Linux?

On Linux `cpal` uses the library `libasound` to interface with the
sound driver. You might get away with just passing `-lasound`
to the linker but in general you should probe the current machine for
linker arguments by running `pkg-config --libs alsa`.

For example I run NixOS (by the way) and for me the correct linker arguments are:

```
$ pkg-config --libs alsa
-L/nix/store/g3a56c2y6arvxyr4kxvlg409gzfwyfp0-alsa-lib-1.2.11/lib -lasound
```

As an experiment I modified the `dune` file to have the output of
`pkg-config` hard-coded to see if that was enough for it to work on
Linux:

```dune
(library
 (name llama_low_level)
 (no_dynlink)
 (foreign_archives low_level)
 (c_library_flags
  (-lpthread -lc -lm))
 (library_flags
  (-cclib "-L/nix/store/g3a56c2y6arvxyr4kxvlg409gzfwyfp0-alsa-lib-1.2.11/lib -lasound")))
```

This works. Interestingly passing `-lasound` causes the library to be
linked against the shared library file `libasound.so` despite the
`(no_dynlink)` setting.

Obviously we can't leave the linker arguments hard-coded like
that. Instead we need to get Dune to invoke `pkg-config` at build time
so the correct arguments for the current machine are passed to the
linker. First we'll make it so the linker arguments are loaded from a
file, then we'll have Dune generate that file at build time by running
`pkg-config`.

Dune allows the contents of
[S-expression (sexp)](https://en.wikipedia.org/wiki/S-expression) files to be
included in most fields. I made a file `library_flags.sexp` with the
contents:

```
("-cclib" "-L/nix/store/g3a56c2y6arvxyr4kxvlg409gzfwyfp0-alsa-lib-1.2.11/lib -lasound")
```

The parentheses are necessary to make it a valid sexp file. The quotes
around `-cclib` are necessary as otherwise Dune tries to interpret
`-cclib` as a keyword instead of treating the entire sexp as a list
(similar to the `quote` keyword in some lisp dialects).

Now this file can be included in the `dune` file:

```dune
(library
 (name llama_low_level)
 (no_dynlink)
 (foreign_archives low_level)
 (c_library_flags
  (-lpthread -lc -lm))
 (library_flags
  (:include library_flags.sexp)))
```

Next we'll need to generate `library_flags.sexp` by running
`pkg-config` at build time. This can be done using Dune's custom rule
mechanism. See
[this page](https://dune.readthedocs.io/en/stable/reference/actions/index.html)
for info about the different ways files can be generated by custom
rules. The `dune` file is now:

```dune
(rule
 (action
  (with-stdout-to
   library_flags.sexp
   (progn
    (echo "(\"-cclib\" \"")
    (bash "pkg-config --libs alsa")
    (echo "\")")))))

(library
 (name llama_low_level)
 (no_dynlink)
 (foreign_archives low_level)
 (c_library_flags
  (-lpthread -lc -lm))
 (library_flags
  (:include library_flags.sexp)))
```

This feels a little cumbersome to me. I need to generate a sexp file
in one place only to include it in another place, and Dune doesn't
help at all with emitting sexp syntax, requiring me to explicitly
escape quotes and remember to include the parentheses.

Also this solution is specific to Linux. To add back support for MacOS
we need to conditionally enable the rule and add a second rule for
MacOS that generates a sexp file with the original linker arguments:

```dune
(rule
 (enabled_if
  (= %{system} linux))
 (action
  (with-stdout-to
   library_flags.sexp
   (progn
    (echo "(\"-cclib\" \"")
    (bash "pkg-config --libs alsa")
    (echo "\")")))))

(rule
 (enabled_if
  (= %{system} macosx))
 (action
  (write-file
   library_flags.sexp
   "(\"-ccopt\" \"-framework CoreServices -framework CoreAudio -framework AudioUnit -framework AudioToolbox\")")))

(rule
 (enabled_if
  (and
   (<> %{system} linux)
   (<> %{system} macosx)))
 (action
  (write-file library_flags.sexp "()")))

(library
 ...
```

Note that the third rule is necessary so that the
`library_flags.sexp` file is still generated on machines that are
running neither MacOS nor Linux. Also note that the comparisons `(=
%{system} linux)` and `(= %{system} macosx)` are string comparisons,
so if you accidentally typed `macos` instead of `macosx` then the
condition would be false on MacOS machines.

In this project I found that it was getting out of hand to manage the
conditional rules and to generate sexp files using Dune's built-in
configuration language. Fortunately there is an external library
[`dune-configurator`](https://opam.ocaml.org/packages/dune-configurator)
to help you write ocaml programs that query the current machine and
generate sexp files for inclusion in `dune` files.

In a separate directory, I made a little executable called `discover` with this `dune` file:

```dune
(executable
 (name discover)
 (libraries dune-configurator))
```

Then I rewrote the logic from the custom Dune rules into OCaml:

```ocaml
module C = Configurator.V1

let macos_library_flags =
  let frameworks =
    [ "CoreServices"; "CoreAudio"; "CoreMidi"; "AudioUnit"; "AudioToolbox" ]
  in
  List.map (Printf.sprintf "-framework %s") frameworks

let () =
  C.main ~name:"llama_low_level" (fun c ->
      let linker_args =
        match C.ocaml_config_var_exn c "system" with
        | "macosx" -> macos_library_flags
        | "linux" -> (
            let default = [ "-lasound" ] in
            match C.Pkg_config.get c with
            | None -> default
            | Some pc -> (
                match C.Pkg_config.query pc ~package:"alsa" with
                | None -> default
                | Some conf -> conf.libs))
        | _ -> []
      in
      let cclib_arg = String.concat " " linker_args in
      C.Flags.write_sexp "library_flags.sexp" [ "-cclib"; cclib_arg ]
```

Finally I updated the `dune` file for `llama_low_level` to run `discover`:

```dune
(rule
 (target library_flags.sexp)
 (action
  (run ./config/discover.exe)))

(library
 (name llama_low_level)
 (no_dynlink)
 (foreign_archives low_level)
 (c_library_flags
  (-lpthread -lc -lm))
 (library_flags
  (:include library_flags.sexp)))
```

Now when Dune needs to generate the `library_flags.sexp` file it will
first build the `discover` executable and then run it to generate the
file, before including the contents of that file to set the extra
flags passed to the OCaml compiler to configure the linker.
While this does work, it feels like a Rube Goldberg Machine, and I was
surprised to find that such a complex solution was needed to pass
different linker flags while building on different operating systems.

### Dune silently ignores directories starting with a period (by default), breaking Rust interoperability

In the previous section I mentioned compiling a Rust library `liblow_level.a` and calling into it from OCaml.
Up until now I was running the commands to build it myself, but I'd rather have Dune do this for me.
I added this rule to the `dune` file for `llama_low_level`:
```dune
(rule
 (target liblow_level.a)
 (deps
  (source_tree low-level-rust))
 (action
  (progn
   (chdir
    low-level-rust
    (run cargo build --release))
   (run mv low-level-rust/target/release/%{target} %{target}))))
```

Now if any of the Rust code inside the `low-level-rust` directory
changes, Dune will invoke Cargo to rebuild `liblow_level.a` before
relinking the OCaml library against the new version. One problem with the code above is that running `cargo build --release` will download any Rust dependencies before building the Rust library. This is a problem because when Opam installs a package it doesn't allow build commands to access the network. The solution is to vendor any rust dependencies inside the project so they are already available when `cargo build --release` runs.

To vendor Rust dependencies just run `cargo vendor` in the Rust project, and create the file `.cargo/config.toml` at the top level of the Rust project with the contents:
```toml
[source.crates-io]
replace-with = "vendored-sources"

[source.vendored-sources]
directory = "vendor"
```

Finally, to make sure that `cargo build` doesn't try to access the
network, I updated the `dune` file to call `cargo build --release --offline`.

Testing this out:
```
$ dune build
File "src/low-level/dune", line 1, characters 0-224:
 1 | (rule
 2 |  (target liblow_level.a)
 3 |  (deps
 4 |   (source_tree low-level-rust))
 5 |  (action
 6 |   (progn
 7 |    (chdir
 8 |     low-level-rust
 9 |     (run cargo build --release --offline))
10 |    (run mv low-level-rust/target/release/%{target} %{target}))))
error: no matching package named `cpal` found
location searched: registry `crates-io`
required by package `low_level v0.1.0
(/Users/s/src/llama/_build/default/src/low-level/low-level-rust)`
As a reminder, you're using offline mode (--offline) which can sometimes
cause surprising resolution failures, if this error is too confusing you
may wish to retry without the offline flag.
```

Cargo claims that the `cpal` package can't be found. This is
surprising because the vendored copy of `cpal` has definitely been
copied into the `_build` directory:

```
$ ls _build/default/src/low-level/low-level-rust/vendor/cpal/
examples  CHANGELOG.md  Cargo.toml  Dockerfile  README.md
src       Cargo.lock    Cross.toml  LICENSE     build.rs
```

After poking around a bit I noticed that the `.cargo/config.toml`
wasn't getting copied into the `_build` directory which meant that
Cargo was ignoring the vendored libraries.
It turns out that directories beginning with a `.` or `_` are ignored
when recursively copying directories specified with `source_tree`.
There's even an [issue on Dune's github](https://github.com/ocaml/dune/issues/7135)
where someone else ran into the same problem.

The documentation for `source_tree` doesn't mention this behaviour
because it's just the default behaviour for which files in a directory
are ignored (it affects more that just `source_tree`). This behaviour
can be adjusted by placing a `dune` file inside the rust project with
contents:

```dune
(dirs :standard .cargo)
```
...which adds the `.cargo` directory to the default set of directories not ignore.

I understand wanting to avoid copying some hidden directories, such as
`.git` or `_build`. My issue with this UX is that if you're learning
Dune by using it and reading the docs for the relevant section as you
go, I don't see how a situation like mine could have been
avoided. There's a layer of indirection between specifying a directory
dependency with `source_tree` and configuring which directories are
copied to `_build` with the `(dirs ...)` stanza and unless you're
already well versed in Dune you won't realize that if you need to copy
a file beginning with `.` or `_` you need to configure dune to allow
it. I suspect many people who try to include a Rust library inside a
Dune project run into this problem, then check the docs for
`source_tree` and find no useful information, and get stuck.

As a response to this I've added a [section to Dune's
FAQ](https://dune.readthedocs.io/en/stable/faq.html#files-and-directories-whose-names-begin-with-period-are-ignored-by-source-tree)
about this specific issue so hopefully when people get stuck on this
issue in the future they can find help online.

### The obvious choice of package for reading `.wav` files crashes when reading `.wav` files

I wanted to load drum samples from `.wav` files and decided to try out
[ocaml-mm](https://github.com/savonet/ocaml-mm) which seemed like the
obvious choice for working with media files. To learn its API I wrote
some code that reads a `.wav` file and prints its sample rate:

```ocaml
let () =
  let wav_file = new Mm.Audio.IO.Reader.of_wav_file "./cymbal.wav" in
  let sample_rate = wav_file#sample_rate in
  print_endline (Printf.sprintf "sample_rate: %d" sample_rate)
```

It printed `sample_rate: 44100` as expected. Next let's read those samples from the file:

```ocaml
let () =
  let wav_file = new Mm.Audio.IO.Reader.of_wav_file "./cymbal.wav" in
  let buffer = Mm.Audio.create 2 10000
  let _ = wav_file#read buffer 0 1 in
  ()
```

This didn't work:

```
Fatal error: exception File "src/audio.ml", line 1892, characters 21-27: Assertion failed
```

That failed assertion is:

```ocaml
match sample_size with
  | 16 -> S16LE.to_audio sbuf 0 buf ofs len
  | 8 -> U8.to_audio sbuf 0 buf ofs len
  | _ -> assert false
```

My test file used 24-bit samples but I can probably live with 16-bit samples:

```
$ ffmpeg -i cymbal.wav -af "aformat=s16:sample_rates=44100" cymbal-16bit.wav
$ file cymbal-16bit.wav
cymbal-16bit.wav: RIFF (little-endian) data, WAVE audio, Microsoft PCM, 16 bit, mono 44100 Hz
```

After updating the code to load the new file:

```
Fatal error: exception Mm_audio.Audio.IO.Invalid_file
```

At this point I gave up on `mm` and solved the problem in Rust
instead. I extended my Rust library `low_level` to read `.wav` files
using [hound](https://crates.io/crates/hound).

### Transferring an array of floats from Rust to OCaml produced a broken array (this is now fixed!)

While adding `.wav` support to my Rust library I ran into an
interesting bug in [`ocaml-rs`](https://crates.io/crates/ocaml) - the
Rust library for ergonomically a calling from OCaml into Rust. My
library reads all the samples from a `.wav` file and makes them
available to OCaml as a `float array`, but I was noticing that when
accessing the array in OCaml, all the values were zero.

A simple repro for this bug is this Rust function:

```rust
#[ocaml::func]
pub fn make_float_array() -> Vec<f32> {
    vec![0.0, 1.0, 2.0]
}
```

Thanks to `ocaml-rs` magic this can be referred to in OCaml as:

```ocaml
external make_float_array : unit -> float array = "make_float_array"
```

I found that I could iterate over this array with functions like
`Array.to_list` and it would work as expected but if I directly
accessed an element of the array with `Array.get` the result would
always be zero.

OCaml has a special way of representing arrays of floats in
memory. Usually floats are boxed in OCaml, but when they appear in an
array they are unboxed and packed contiguously in memory. `ocaml-rs`
was handling this correctly for double-precision floats but not for
single-precision floats. I made a
[PR](https://github.com/zshipko/ocaml-rs/pull/144) and the bug is now
fixed.

### Adding inline tests to a library requires adding over 20 (runtime) dependencies

I wanted a MIDI parser so I could [play other people's songs on my
synth](https://www.youtube.com/watch?v=A8a1Dem2eKs) and I elected to
write my own rather than chance the one in `ocaml-mm` (fool me once,
etc). This turned out to be really interesting and I ended up
publishing a [standalone library just for parsing midi
data](https://ocaml.org/p/llama_midi/latest).

MIDI encodes integers in a variable number of bytes with a special
value denoting the final byte of the integer (kind of like strings in
C). This was a little complicated so I wrote some tests:

```ocaml
let parse_midi_int a i = ...

let%test_module _ =
  (module struct
    (* Run the parser on an array of ints. *)
    let make ints =
      run parse_midi_int (Array.map char_of_int (Array.of_list ints))

    let%test _ = Int.equal 0 @@ make [ 0 ]
    let%test _ = Int.equal 0x40 @@ make [ 0x40 ]
    let%test _ = Int.equal 0x2000 @@ make [ 0xC0; 0x00 ]
    let%test _ = Int.equal 0x1FFFFF @@ make [ 0xFF; 0xFF; 0x7F ]
    let%test _ = Int.equal 0x200000 @@ make [ 0x81; 0x80; 0x80; 0x00 ]
    let%test _ = Int.equal 0xFFFFFFF @@ make [ 0xFF; 0xFF; 0xFF; 0x7F ]
  end)
```

These tests were defined right next to the logic for parsing MIDI
ints. I did it this way so that I wouldn't need to expose the int
parser outside this module and to make it easy to look at the code and
the tests at the same time.

I followed
[Dune's documentation](https://dune.readthedocs.io/en/stable/tests.html#inline-tests)
for writing tests with
[`ppx_inline_test`](https://ocaml.org/p/ppx_inline_test/latest)
and it worked well. As I now need the `ppx_inline_test` package to run my tests, I added it to my project's dependencies:

```
 "ppx_inline_test" {with-test}
```

The `{with-test}` tells Opam that this dependency is only needed to
build the package's tests - not to build the package itself.

The next time I tried installing my library I got an unexpected error:

```
File "test/dune", line 6, characters 7-22:
6 |   (pps ppx_inline_test))
           ^^^^^^^^^^^^^^^
Error: Library "ppx_inline_test" not found.
```

The machine I was using didn't have the `ppx_inline_test` package
installed but I wasn't trying to run my tests - just install the
library. It turns out that packages that do pre-processing like
`ppx_inline_test` cannot be marked as with-test; they must be
unconditional dependencies. This is because preprocessor directives
like `let%test` are not valid OCaml syntax, and the OCaml compiler is
unable to parse the files until something has gone through and removed
all the preprocessor directives.

I was hesitant to make `ppx_inline_test` an unconditional dependency
of my MIDI parsing library because it didn't have any
dependencies. From a supply-chain security point of view and also in
my endless pursuit of minimalism it seemed  shame to depend on
`ppx_inline_test` unconditionally, since the transitive dependency
closure of `ppx_inline_test` is:

```
base
csexp
dune-configurator
jane-street-headers
jst-config
ocaml-compiler-libs
ppx_assert
ppx_base
ppx_cold
ppx_compare
ppx_derivers
ppx_enumerate
ppx_globalize
ppx_hash
ppx_here
ppx_inline_test
ppx_optcomp
ppx_sexp_conv
ppxlib
sexplib0
stdio
stdlib-shims
time_now
```

That's a lot to download and build just to get the logic for disabling
~10 lines of tests in a MIDI parser.

In the end I did what many libraries do and just exposed the internals
of my MIDI parser in its public interface inside of a module named
`For_test`, and then added a separate package that depends on both my
MIDI parser and `ppx_inline_test` and moved the tests there.

I'm used to Rust where I could have written:

```rust
fn parse_midi_int(...) { ... }

#[test]
fn test_parse_midi_int () { ... }
```

...and any external libraries used in the test only need to be
installed when running the test.

This is easier to do in Rust than in OCaml because Cargo is a build
system, package manager, _and_ preprocessor, so it can impose a syntax
for denoting test code, remove tests when compiling code normally,
and only require test dependencies when actually running the
tests. This is harder in OCaml because preprocessing is handled by
external programs. Neither Dune nor the OCaml compiler itself know
what to do with preprocessor directives and require external packages
to be installed just to know how to ignore them.

I think there's an opportunity to reduce some of the friction around
testing in OCaml/Dune, especially since security is one of the main selling
points of OCaml. The lower the barrier for writing tests, the more
tests people will write.

### If some (but not all) of the interdependent packages in a project are released, Opam cannot automatically install the project's dependencies

### Dune can generate `.opam` files but requires a workaround for adding the `available` field

## Conclusions

I hear a lot that OCaml tooling works well when you keep to the "Happy
Path" and I tend to agree with this. I've been developing a [CLI
parsing library](https://github.com/gridbugs/climate) for several
months. It's entirely written in OCaml, doesn't link with any external
libraries, only depends on third-party packages for its tests and is available on
all architectures, and I'm having a great time.

Most of the negative experiences from this post happened when I
strayed from the happy path into parts of the ecosystem that are less
polished and battle tested, or that my assumptions ran contrary to the
assumptions made by tools. If you find yourself struggling with the
tools don't beat yourself up about it. Remember it's not you - it's
the tools. Most OCaml users I know struggle. I clearly struggle. The
tooling is always gradually improving and in most cases you can trick
the tools into doing what you want.

As for my synth library, due to the friction I experienced developing
it in OCaml, and the future frustration I anticipated if I continued
the project, I switched to Rust. The Rust rewrite is
[here](https://github.com/gridbugs/caw).
