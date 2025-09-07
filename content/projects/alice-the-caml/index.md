+++
title = "Alice the Caml"
date = 2025-08-26
path = "alice-the-caml"

[taxonomies]
tags = ["ocaml", "alice"]
+++

[Alice](https://github.com/alicecaml/alice) is an experimental OCaml build
system emphasizing accessibility. It's still very much a work in progress and
nowhere near ready for regular use. Currently it can build multi-file OCaml
projects to executables and libraries. Its UI is inspired by cargo.

I'm one of the core Dune developers for my day job. Dune is a mature and widely
used OCaml build system which it difficult to make large structural changes to
its UI and packaging philosophy. Alice is an experiment exploring the design
space of OCaml build systems when these constraints are lifted.

Here's a tiny demo:

```
$ alice new hello
$ cd hello
$ cat src/main.ml
let () = print_endline "Hello, World!"
$ alice run
Hello, World!
```

It has incremental builds though they are currently sequential. It generates a
build graph which could be executed in parallel but this is future work. Running
`alice dot` prints a graphviz file representing the build graph.

It uses my [climate](https://github.com/gridbugs/climate) library for its CLI
and so contains an inbuilt mechanism for generating bash completion scripts.

It doesn't assume anything about your OCaml compiler setup. You can install the
compiler with opam or nix or your system package manager or manually build it from
source if you like. However it does come with a mechanism for downloading a
precompiled OCaml toolchain and some other tools (an LSP server and code
formatter), avoiding the need for users to build the compiler from source which
can be time-consuming. Precompiled toolchains are available for Linux x86_64,
MacOS x86_64/aarch64 and Windows x86_64, though I haven't yet ported Alice to
Windows. Alice deviates from opam in that the compiler and development tools are
not considered to be packages.

There's currently no packaging story and packages cannot yet depend on one
another. It would be nice to one day support depending on opam packages but this
is not going to be the default package format and opam compatibility isn't a
major priority for the project. Instead I'll design a packaging system
prioritizing ease of publishing and maintenance with as low cognitive load as
possible, and then see how opam compatibility can fit into that picture.

The name comes from an [Australian children's
song](https://www.youtube.com/watch?v=XM7Jnetdf0I).

My next two goals for the project are Windows support and basic package
management.

```
$ alice --help
Alice is a build system for OCaml projects.

Usage: alice [COMMAND]
       alice [OPTION]…

Options:
  -h, --help  Show this help message.

Commands:
  build, b  Build a project.
  clean, c  Delete all generated build artifacts.
  dot       Print graphviz source describing build artifact dependencies.
  new       Create a new alice project.
  tools     Manage tools for building and developing OCaml projects.
  run, r    Build a project and run its executable.
  help      Print documentation for a subcommand.
  internal  Internal commands.
```
