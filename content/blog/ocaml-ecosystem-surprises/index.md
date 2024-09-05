+++
title = "OCaml Ecosystem Surprises"
date = 2024-09-05
path = "ocaml-ecosystem-surprises"

[taxonomies]
tags = ["ocaml"]
+++

![A landscape of a rugged mountain range](background.jpg)

<div style="color:gray;font-style:italic">
At the time of writing I'm employed by Tarides to work on the Dune
build system, but all the opinions in this post are my own.  I wrote
the first version of this post a year ago for the Tarides blog but it
was never published.  I recently got permission to post it here
instead.
</div>

This post is about some frustrating experiences I had while developing
my first non-trivial OCaml project - [an audio synthesizer
library](https://github.com/gridbugs/llama/).  I generally enjoy
programming in OCaml but I often find its development tools to be
counter-intuitive in their UX and surprising-in-a-bad-way in their
behaviour.  Realistic expectations are important for avoiding
disappointment and my expectations were too high when I started the
project. The goal of this post is to communicate my err...updated
expectations of OCaml development tools by listing all the times they
didn't work the way I expected while developing on my synthesizer
library.

This isn't just a cathartic rant (though it's also that).  I'm worried
that people will try out OCaml, encounter friction with its tools, and
bounce off to a more ergonomic ecosystem. Or worse, I'm worried that
users will attribute their negative experiences with OCaml's tooling
as a deficiency in their own programming ability rather than a
deficiency in the tools themselves. I want to reach these people and
convey that if you are struggling with the tools, know that it's not
you - it's the tools. Almost every OCaml programmer I know struggles
to install packages with Opam, and struggles to configure Dune to do
anything non-trivial when building projects. OCaml tools are hard to
use. You are not alone.

My initially high expectations of OCaml tooling is possibly related to
the fact that the language I use for most of my personal programming
projects is Rust. I choose Rust for most of my hobby programming
specifically because I find it easy to manage dependencies and build
projects with Cargo. I have limited free time and I'd rather spend it
making cool stuff instead of fighting against the package manager or
build system. Which brings us to...

## All the times an OCaml dev tool or library wasted my time by doing something unexpected while I was developing my synthesizer library

- [Linking against OS-specific native libraries with Dune is hard](#linking-against-os-specific-native-libraries-with-dune-is-hard)
- [Dune silently ignores directories starting with a period, breaking Rust interoperability](#dune-silently-ignores-directories-starting-with-a-period-breaking-rust-interoperability)
- [The obvious choice of package for reading `.wav` files crashes when reading `.wav` files](#the-obvious-choice-of-package-for-reading-wav-files-crashes-when-reading-wav-files)
- [Transferring an array of floats from Rust to OCaml produced a broken array (this is now fixed!)](#transferring-an-array-of-floats-from-rust-to-ocaml-produced-a-broken-array-this-is-now-fixed)
- [Adding inline tests to a library requires adding over 20 (runtime) dependencies](#adding-inline-tests-to-a-library-requires-adding-over-20-runtime-dependencies)
- [Dune can generate `.opam` files but requires a workaround for adding the `available` field](#dune-can-generate-opam-files-but-requires-a-workaround-for-adding-the-available-field)
- [If some (but not all) of the interdependent packages in a project are released, Opam can't solve the project's dependencies](#if-some-but-not-all-of-the-interdependent-packages-in-a-project-are-released-opam-can-t-solve-the-project-s-dependencies)

### Linking against OS-specific native libraries with Dune is hard

The first thing I needed to do was make a program that plays a simple
sound.  The most reliable cross-platform library I'm aware of for
interfacing with sound drivers is
[`cpal`](https://crates.io/crates/cpal).  One problem: It's a Rust
library. (I've since learned of
[`ocaml-ao`](https://github.com/savonet/ocaml-ao) which provides
bindings for the cross-platform audio library `libao`.)

Calling into Rust from OCaml was easier than I expected
thanks to the [`ocaml-rs`](https://crates.io/crates/ocaml)
library. I used `ocaml-rs` and `cpal` to make a small Rust library
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

For example I run NixOS (by the way) where the correct linker arguments are:

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
  (:include library_flags.sexp)))  ; <- here!
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
to help you write OCaml programs that query the current machine and
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
While this does work, it feels like a [Rube Goldberg Machine](https://en.wikipedia.org/wiki/Rube_Goldberg_machine), and I was
surprised to find that such a complex solution was needed to pass
different linker flags while building on different operating systems.

### Dune silently ignores directories starting with a period, breaking Rust interoperability

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
relinking the OCaml library against the new version. One problem with
the code above is that running `cargo build --release` will download
any Rust dependencies before building the Rust library. This is a
problem because I intend to release my library on Opam, and when Opam
installs a package it doesn't allow build commands to access the
network. The solution is to vendor any rust dependencies inside the
project so they are already available when `cargo build --release`
runs.

To vendor Rust dependencies just run `cargo vendor` in the Rust
project and create the file `.cargo/config.toml` at the top level of
the Rust project with the contents:

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
where others have run into the same problem.

The documentation for `source_tree` doesn't mention this behaviour
because it's just the default behaviour for which files in a directory
are ignored in general (it affects more that just `source_tree`). This behaviour
can be adjusted by placing a `dune` file inside the rust project with
contents:

```dune
(dirs :standard .cargo)
```
...which adds the `.cargo` directory to the default set of directories to not ignore.

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

I wanted to load some audio samples from `.wav` files and decided to try out
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
instead. I developed the first version of my synthesizer library
during a hackathon and didn't have time to debug `mm`. I'd
already done the work to set up Rust interoperability for this project
so it was very quick to extend my Rust library `low_level` to read
`.wav` files using [hound](https://crates.io/crates/hound).

This worked well except I ran into an issue copying the audio data from Rust to OCaml...

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
publishing a [standalone library just for parsing MIDI
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
`ppx_inline_test` cannot be marked as `with-test`; they must be
unconditional dependencies. This is because preprocessor directives
like `let%test` are not valid OCaml syntax, and the OCaml compiler is
unable to parse the files until something has gone through and removed
all the preprocessor directives.

I was hesitant to make `ppx_inline_test` an unconditional dependency
of my MIDI parsing library because my library didn't have any
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
testing in OCaml and Dune, especially since security is one of the main selling
points of OCaml. The lower the barrier for writing tests, the more
tests people will write.


### Dune can generate `.opam` files but requires a workaround for adding the `available` field

My library only works on `x86_64` and `arm64` architectures, I think
because of its Rust dependencies (I haven't really investigated this).
OCaml is supported on many architectures, so to prevent llama from
being installed on incompatible computers, I manually added this line the
package manifest that I released to the Opam repository:

```diff
 ...
 license: "MIT"
 homepage: "https://github.com/gridbugs/llama"
 bug-reports: "https://github.com/gridbugs/llama/issues"
+available: arch != "arm32" & arch != "ppc64" & arch != "s390x" & arch != "x86_32"
 depends: [
   "dune" {>= "3.0"}
   "llama_core" {= version}
 ...
```

Llama's Opam manifests are generated by Dune. The same metadata is present in its `dune-project` file as:

```dune
...
(source (github gridbugs/llama))
(license MIT)
(package
 (name llama)
 (synopsis "Language for Live Audio Module Arrangement")
 (description "Libraries for declaratively building software-defined modular synthesizers")
 (depends
  (llama_core (= :version))
  ...
```

This looked to me like a one-to-one translation from the `dune-project` file to the Opam package manifest, so I assumed I could add an `available` field to the package's description like:

```dune
(package
 (name llama)
 (available (and (<> :arch arm32) (<> :arch ppc64) (<> :arch s390x) (<> :arch x86_32)))
 ...
```

But this is not supported:

```
File "dune-project", line 31, characters 2-11:
31 |  (available (and (<> :arch arm32) (<> :arch ppc64) (<> :arch s390x) (<> :arch x86_32)))
Error: Unknown field available
```

I found this surprising as it really seemed like it was a one-to-one
translation. It felt like Dune's UI had trained me to expect that it
works a certain way, only then to reveal that it actually works a
different way. The [docs for generating Opam
files](https://dune.readthedocs.io/en/stable/howto/opam-file-generation.html)
don't specify that the `available` field is supported and at first I
thought it was just not yet implemented. There is a [github
issue](https://github.com/ocaml/dune/issues/7059) to support
additional fields, but from the discussion there it's apparent that the
missing fields are omitted intentionally. There is a policy of not
adding fields that are only used by Opam, and Dune doesn't currently
have an analog of this feature.

There is a workaround to add the `available` field to
the generated Opam file using an "Opam Template". If I had read the
[generating Opam files
docs](https://dune.readthedocs.io/en/stable/howto/opam-file-generation.html)
more carefully I would have noticed:

> `(package)` stanzas do not support all opam fields or complete
> syntax for dependency specifications. If the package you are
> adapting requires this, keep the corresponding opam fields in a
> `pkg.opam.template` file.

So I just ended up making a `llama.opam.template` file with the contents:

```
available: arch != "arm32" & arch != "ppc64" & arch != "s390x" & arch != "x86_32"
```


### If some (but not all) of the interdependent packages in a project are released, Opam can't solve the project's dependencies

I released my synthesizer library on Opam. It was made up of 3 packages:
- `llama_core` defines the data types for representing audio streams and contains a library of sound effects and filters
- `llama` lets you play audio streams through your speakers
- `llama_interactive` lets you use your computer's keyboard and mouse to control the synthesizer

There's also an unreleased package `llama_tests` that contains all the
tests. As described above, tests are in a separate package to avoid
adding unconditional testing dependencies to other packages.

The MIDI decoder was originally part of `llama_core` but I wanted to
split it out into a new package `llama_midi` since it's useful on its
own outside of the context of the synthesizer library. I created the
new package but didn't release it to the Opam repository right
away. Around this time I tried setting up the project on a new
computer, and this is when my problems started.

Following the convention for OCaml projects, I put an Opam package manifest for each package in the project in the root directory of the project.

```
$ ls
...
llama.opam
llama_core.opam
llama_interactive.opam
llama_midi.opam
llama_tests.opam
...
```

Opam supports running `opam install <dir>` which will install all the
packages with package manifests in `<dir>`, along with all their
dependencies. If you just want the dependencies and not the packages
themselves you can pass `--deps-only`. To set up the project on my new
computer, I thought the right thing to do would be running `opam
install . --deps-only` from the root directory of the project.

```
$ opam install . --deps-only
[ERROR] Package conflict!
  * Missing dependency:
    - llama_midi >= 0.0.1
    no matching version

No solution found, exiting
```

This was frustrating as `llama_midi.opam` was right there. Remember
that `llama_midi` was a new package, and not yet released to the Opam
repo. Maybe Opam was trying to find `llama_midi` in the Opam repo and
failing because it's not released yet.

Next I tried running `opam pin`. This does a similar thing to `opam
install` except it associates local packages with the path to their
source code on disk. This shouldn't be necessary in this case; I don't
even want to install `llama_midi` - just the dependencies of my local
packages. I tried it anyway:

```
$ opam pin .
This will pin the following packages: llama, llama_core, llama_interactive,
llama_midi, llama_tests. Continue? [Y/n] Y
Processing  3/5: [llama: git] [llama_core: git] [llama_interactive: git]
llama is now pinned to git+file:///.../llama#main (version 0.0.1)
llama_core is now pinned to git+file:///.../llama#main (version 0.0.1)
llama_interactive is now pinned to git+file:///.../llama#main (version 0.0.1)
Package llama_midi does not exist, create as a NEW package? [Y/n] Y
llama_midi is now pinned to git+file:///.../llama#main (version ~dev)
Package llama_tests does not exist, create as a NEW package? [Y/n] Y
llama_tests is now pinned to git+file:///.../llama#main (version ~dev)
[ERROR] Package conflict!
  * Missing dependency:
    - llama_midi >= 0.0.1
    no matching version

[NOTE] Pinning command successful, but your installed packages may be out of sync.
```

Same error as before, only this time it happened to print the version
number of each pinned package. Notice how for the three released
packages it says `(version 0.0.1)` but for the unreleased `llama_midi`
and `llama_tests` it says `(version ~dev)`. This tells me that Opam is
trying to install `0.0.1` of all the released packages, and version
`~dev` of the unreleased packages. `0.0.1` happens to be the version
number I used when releasing `llama_core`, `llama`, and
`llama_interactive`.

Since the initial release, I split `llama_midi` out of `llama_core`,
and made `llama_core` depend on the new `llama_midi` package. I want
to keep the versions of all the llama packages tied together, so when
one of the llama packages depends on another, I declare that
dependency as:

```
# llama_core.opam
...
depends: [
  "llama_midi" {= version}
  ...
]
```

The `{= version}` tells Opam that any given version of `llama_core`
depends on the `llama_midi` package with the identical version
number. And the error I'm seeing is because Opam is trying to install
version `0.0.1` of `llama_core`, but since `llama_midi` has never been
released, the only version Opam knows about is the synthetic version
number `~dev`.

But why was Opam installing version `0.0.1` of `llama_core` in the
first place?  Unlike some (most?) other package managers, Opam package
manifests don't contain the version number of the package they
describe. The only place where package version numbers are recorded is
as part of a directory name inside the Opam package repository, where
manifests are stored in directories named like `<package>.<version>`
([for
example](https://github.com/ocaml/opam-repository/tree/master/packages/llama_core)
`llama_core.0.0.1`).  My expectation was that since it's being
installed as a local package from a local Opam package manifest file,
`llama_core` would be given the version number `~dev`. The local
package file is clearly being read because Opam is trying to respect
the fact that `llama_core` now depends on `llama_midi`, but Opam is
still using the version number of the released version of
`llama_core`: `0.0.1`. That version number isn't stored anywhere in
llama's git repo, so Opam must be using information from its package
repository to choose this version number, and then it can't solve
dependencies because there is no version of `llama_midi` with the same
version number.

So maybe I need to find a way to force Opam to install the
local packages with the version number `~dev` rather than taking the
version numbers from the package repository.

I learnt that it's possible to override the version number of packages installed with `opam pin` by passing `--with-version`.
I tried installing all the local packages with version number `sigh` as I was getting quite exasperated.

```
opam pin . --with-version sigh
...
#=== ERROR while compiling llama.sigh =========================================#
# context     2.1.5 | macos/arm64 | ocaml-base-compiler.4.14.1 | pinned(git+file:///.../llama#main#06deea42efa6b84653be43529daf8aa08dc106
68)
# path        /.../_opam/.opam-switch/build/llama.sigh
# command     ~/.opam/opam-init/hooks/sandbox.sh build dune build -p llama -j 7 @install
# exit-code   1
# env-file    ~/.opam/log/llama-60822-042f19.env
# output-file ~/.opam/log/llama-60822-042f19.out
### output ###
# error: failed to get `anyhow` as a dependency of package `low_level v0.1.0 (.../_opam/.opam-switch/build/llama.sigh/_build/default/src
/low-level/low-level-rust)`
# [...]
# Caused by:
#   failed to query replaced source registry `crates-io`
#
# Caused by:
#   download of config.json failed
#
# Caused by:
#   failed to download from `https://index.crates.io/config.json`
#
# Caused by:
#   [7] Couldn't connect to server (Failed to connect to index.crates.io port 443 a
fter 0 ms: Couldn't connect to server)
```

That error is because the package `llama` contains some Rust
code. Earlier in the post I described vendoring all of the Rust
dependencies as they can't be downloaded when building the package
with Opam, as Opam's build sandbox doesn't have internet access. This
vendoring usually takes place in a build script that runs as a github
action. I don't check in the vendored libraries as it would bloat the
repo, and when developing locally with Dune there is no need to vendor
them (Dune's build sandbox _does_ have internet access).

Recall that I don't even want to install `llama` with Opam - I
just want to install all the non-local dependencies of the local
packages that make up my project. There may well be a way to do this
but I couldn't find it and nobody I asked knew how to do it so I just
ended up installing the dependencies by hand. Fortunately
there were only a few.

This was the point where I was really starting to question whether
OCaml was the right tool for this project, and really any project I
want to develop on my own time.  It's important to me that I can clone
a project on a machine with OCaml installed on it and be up and
running after a command or two, kind of like `npm install` or `cargo
run` which in my experience tend to "just work".  The fact that it was
such a headache to do something that I expected to be simple indicated
to me that the philosophy underpinning the UX of Opam is really
different from the way that I tend to approach software
development. Fortunately this won't be a problem for much longer as
Dune's package management features are quickly maturing and are
designed with this use case in mind.


## The "Happy Path"

I hear from a lot of OCaml developers that tooling works well when you keep to the "Happy
Path" and I tend to agree with this. This refers to the case where all
the code in your project is written in OCaml and you use the default
configurations for everything. Lately I've been developing a [CLI
parsing library](https://github.com/gridbugs/climate) in OCaml which
sticks to the Happy Path. It's entirely written in OCaml, doesn't link
with any external libraries, only depends on third-party packages for
its tests and is compatible with all architectures. So far I haven't had
any issues with tooling, and even been pleasantly surprised a couple
of times.

Most of the negative experiences from this post happened when I
strayed from the Happy Path into parts of the ecosystem that are less
polished and battle tested, or when my assumptions ran contrary to
those made by tools.

## Conclusions

This experience taught me that if you go into an OCaml project
expecting the tools to "just work", you're probably going to have a
bad time. Expect that the first few times you try to modify a Dune
build configuration that the syntax will be incorrect, and once that's
fixed expect the configuration to not do what you wanted
in the first place, and the eventual solution will be a Rube Goldberg Machine. Expect third-party packages to be buggy and untested around
edge-cases. Expect to get into confusing situations when using Opam to
manage local packages that you're actively developing. And expect [yak
shaves](https://en.wiktionary.org/wiki/yak_shaving) - so many times
when one thing isn't working correctly I run into a second, unrelated
issue while trying to resolve the first issue.

Normalize complaining about this stuff so that new OCaml users can
correctly set their expectations coming in and don't get a nasty shock
the first time they leave the Happy Path. And if you find yourself
struggling with the tools, don't beat yourself up about it. Most OCaml
users struggle. I clearly struggle. Remember, it's not you - it's the
tools.

As for my synth library, due to the friction I experienced developing
it in OCaml, and to avoid the future frustration I anticipated if I
continued the project, [I rewrote it in Rust](https://github.com/gridbugs/caw).
