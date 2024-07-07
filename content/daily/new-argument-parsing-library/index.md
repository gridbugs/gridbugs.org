+++
title = "New argument parsing library"
date = 2020-09-09
slug = "new-argument-parsing-library"
+++

A few years ago I made [simon](https://crates.io/crates/simon) - a rust library
for parsing command-line arguments. Looking at it with fresh eyes, I've decided
that it's over-engineered, and places too much emphasis on generality and
theoretical niceness rather than being useful.

Today I started working on [args_af](https://github.com/gridbugs/args-af)
which is my attempt at making a minimal, pragmatic command-line parser.
The biggest difference from simon is combinators only work on specific
parsers, rather than generalising to all parsers. It's done this way to
simplify generating help messages. Like simon, it uses the idea of
"Applicative Functors" (hence the "af"), but it's less in-your-face
about it, and only really uses them to combine a collection of parsers
into a single parser of a collection of values.
