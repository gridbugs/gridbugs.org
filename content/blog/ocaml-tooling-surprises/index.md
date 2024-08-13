+++
title = "OCaml Tooling Surprises"
date = 2024-08-12
path = "ocaml-tooling-surprises"

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
it's not just you," it certainly would have improved my mental
health. I'll attempt to normalize the idea that OCaml tools can be
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
- [Dune silently ignores directories starting with a period, breaking Rust interoperability](#dune-silently-ignores-directories-starting-with-a-period-breaking-rust-interoperability)
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
OCaml code against native libraries like `liblow_level.a`, and the
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
provided with both of these files, dune a look through
[dune's (library ...) stanza documentation](https://dune.readthedocs.io/en/stable/dune-files.html#library)
to see if there's a way to only link against the static library and
found the `no_dynlink` field:

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

Next step is to actually make some noise. I made a little program simply named `experiment` which uses `llama_low_level` to play a sine wave. Here's its `dune` file:

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
archive must depend on some frameworks on MacOS for doing "audio
stuff" and I need to tell the linker about it. Eventually I found the
appropriate linker flags to copy/paste from stack overflow:

```
-framework CoreServices -framework CoreAudio -framework AudioUnit -framework AudioToolbox
```

Now I have to find a way to pass these flags to the linker. If this was a C program I could pass them via the C compiler. Something like:
```
clang foo.c -Wl,-framework,CoreServices,-framework,CoreAudio,-framework,AudioUnit,-framework,AudioToolbox
```

Dune provides a mechanism for passing additional linker flags when compiling a library:
> `(library_flags (<flags>))` is a list of flags passed to ocamlc and ocamlopt when building the library archive files.

And similar to the C compiler example above, the OCaml compiler also has a way of passing custom flags along to the linker. From `man ocamlc`:
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

For example I run NixOS by the way and for me the correct linker arguments are:

```
$ pkg-config --libs alsa
-L/nix/store/g3a56c2y6arvxyr4kxvlg409gzfwyfp0-alsa-lib-1.2.11/lib -lasound
```

As an experiment I modified the `dune` file to have the output of `pkg-config` hard-coded to see if that was enough for it to work on Linux:

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
so the right arguments for the current machine are passed to the
linker. First we'll make it so the linker arguments are loaded from a
file, then we'll have dune generate that file at build time by running
`pkg-config`.

Dune allows the contents of [S-expression
(sexp)](https://en.wikipedia.org/wiki/S-expression) files to be
included in most fields. Make a file `library_flags.sexp` with the
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

This solution is specific to Linux. To add back support for MacOS
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

Note the third rule which is necessary so that the
`library_flags.sexp` file is still generated on machines that are
running neither MacOS nor Linux. Also note that the comparisons `(=
%{system} linux)` and `(= %{system} macosx)` are string comparisons,
so if you accidentally typed `macos` instead of `macosx` then the
condition would always be false.

In this project I found that it was getting out of hand to manage the conditional rules and to generate sexp files using Dune's built-in configuration language. Fortunately there is an external library [`dune-configurator`](https://opam.ocaml.org/packages/dune-configurator) to help you write OCaml programs that generate sexp files.

In a separate directory, I made a little executable called `discover` with this `dune` file:

```dune
(executable
 (name discover)
 (libraries dune-configurator))
```

Then I rewrote the logic from the Dune rules into OCaml:

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

### Dune silently ignores directories starting with a period, breaking Rust interoperability

### The obvious choice of package for reading `.wav` files crashes when reading `.wav` files

### Transferring an array of floats from Rust to OCaml produced a broken array (this is now fixed!)

### Adding inline tests to a library requires adding over 20 (runtime) dependencies

### If some (but not all) of the interdependent packages in a project are released, Opam cannot automatically install the project's dependencies

### Dune can generate `.opam` files but requires a workaround for adding the `available` field
