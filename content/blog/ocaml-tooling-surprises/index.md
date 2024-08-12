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
synthesizer library](https://github.com/gridbugs/llama/). My goal here is to help spread the message that some OCaml dev tools
are rough around the edges. If you're learning OCaml and struggling
with the tools, it's not because you're bad at programming - it's the
tools. I've spent years of my programming career dealing with
imposter syndrome and if someone had told me at the start of my OCaml journey
"Yeh don't worry, everyone has trouble installing packages with Opam,
it's not just you," it certainly would have improved my mental
health. I'll attempt to normalize the idea that OCaml tools can be
hard to use by sharing a bunch of stories where
a tool did something unexpected (as well as the necessary workarounds
and related github issues!).

But first, some disclaimers. I'm
currently employed by Tarides where I work on the team largely
responsible for the Dune build system, but all the opinions in this
post are mine. I've been a user of Dune and Opam for about 2 years (1
year at the point when I first wrote this) and I've worked as a
programmer for over a decade across many different software
ecosystems.

The language I use most is Rust, though I've only
used it for personal projects. I choose Rust for most of my hobby programming specifically because I find it easy to manage dependencies and build projects with Cargo. I have limited free time and would rather spend it making cool stuff instead of fighting against the package manager or build system. Which brings is to...

## OCaml ecosystem surprises while working on my synthesizer library

- [Linking against platform-specific native libraries with Dune is non-trivial (but possible!)](#linking-against-platform-specific-native-libraries-with-dune-is-non-trivial-but-possible)
- [Dune silently ignores directories starting with a period, breaking Rust interoperability](#dune-silently-ignores-directories-starting-with-a-period-breaking-rust-interoperability)
- [The obvious choice of package for reading `.wav` files crashes when reading `.wav` files](#the-obvious-choice-of-package-for-reading-wav-files-crashes-when-reading-wav-files)
- [Transferring an array of floats from Rust to OCaml produced a broken array (this is now fixed!)](#transferring-an-array-of-floats-from-rust-to-ocaml-produced-a-broken-array-this-is-now-fixed)
- [Adding inline tests to a library requires adding over 20 (runtime) dependencies](#adding-inline-tests-to-a-library-requires-adding-over-20-runtime-dependencies)
- [If some (but not all) of the interdependent packages in a project are released, Opam cannot automatically install the project's dependencies](#if-some-but-not-all-of-the-interdependent-packages-in-a-project-are-released-opam-cannot-automatically-install-the-project-s-dependencies)
- [Dune can generate `.opam` files but requires a workaround for adding the `available` field](#dune-can-generate-opam-files-but-requires-a-workaround-for-adding-the-available-field)

### Linking against platform-specific native libraries with Dune is non-trivial (but possible!)

### Dune silently ignores directories starting with a period, breaking Rust interoperability

### The obvious choice of package for reading `.wav` files crashes when reading `.wav` files

### Transferring an array of floats from Rust to OCaml produced a broken array (this is now fixed!)

### Adding inline tests to a library requires adding over 20 (runtime) dependencies

### If some (but not all) of the interdependent packages in a project are released, Opam cannot automatically install the project's dependencies

### Dune can generate `.opam` files but requires a workaround for adding the `available` field
