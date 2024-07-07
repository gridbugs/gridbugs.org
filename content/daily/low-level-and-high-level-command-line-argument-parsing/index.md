+++
title = "Low-Level and High-Level Command-Line Argument Parsing"
date = 2020-09-10
slug = "low-level-and-high-level-command-line-argument-parsing"
+++

A natural way to approach the problem of command-line argument parsing is to split it into two parts.

Start with a simple parser that takes the raw sequence of strings given to a
program when it starts (its arguments), along with a description of what which arguments to look
for, and produces a structure which can answer queries of the form "How many times was the flag `-v`
passed to the program?", or "List all the strings that immediately succeed the flag `--input`".
If you want your command-line argument parser to treat certain patterns specially, such as interpreting
`-abc` as `-a -b -c`, or treat everything after the first `--` as literal arguments (not flags), now
is the time to implement that behaviour. At this level the only types are strings, and no arity
rules are considered (e.g optional vs required vs variadic arguments).

The low level parser faces the raw argument list, and the high level parser faces the humans who use
and program the application whose arguments are being parsed. A programmer should be able to specify
the program's arguments declaratively, including arity and descriptions,
and treat arguments as if they have types besides string.
Users should be able to print a message describing the arguments to the program (e.g. when running
the program with `--help`). This help text should be generated automatically from the declarative
command-line argument spec.

When the parser runs, the high level parser will configure a low level parser to look for particular
arguments in the raw argument list. The low level parser then runs, and produces a queriable structure.
The high level parser then queries this structure to bring into being the arguments described in
the declarative spec.

