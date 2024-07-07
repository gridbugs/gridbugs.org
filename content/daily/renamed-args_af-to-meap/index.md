+++
title = "Renamed \"args_af\" to \"meap\""
date = 2020-09-14
slug = "renamed-args_af-to-meap"
+++

I renamed my [work-in-progress command-line argument parsing library](https://github.com/gridbugs/meap)
from "args_af" to "meap". Meap stands for **M**inimal **E**xtensible **A**rgument **P**arser.
It's minimal in the sense that it has no external dependencies and CLOCs in at a little over
1000 lines of rust. It's extensible in the sense that the `Parser` trait defined in the library
can be implemented by types from 3rd party code to create custom combinators.
A second trait, `SingleArgParser`, can be used to implement custom basic arguments.

The main reason for the rename is the "AF" in "args_af" stood for "Applicative Functor", which
is a term often found in "functional programming" literature to describe types which a function
of multiple arguments may be (essentially) mapped. An argument parser is an applicative functor because it's
possible to take a pair of separate parsers and combine them into a single parser which yields
a pair of values (`both`), AND it's possible to take a parser yielding values of some type, and a
function from that type to some other type, and combine them into a new parser which yields
values of the new type (`map`). To technically qualify as an applicative functor there would need
to be a way to take a value and build from it a parser that yields that value (`pure` in the literature),
but there doesn't seem to be any point in actually including this function in meap.
The `apply` function that's normally used to define applicative functors is left out as it can
be implement in terms of `pure`, `map`, and `both`, and is frankly less useful in this domain.

While the fact that an argument parser is an applicative functor is an interesting observation,
it's of little practical use to anyone who just wants to parse arguments.
I expect may programmers have never encountered the term before, and
*I'd* sure feel uncomfortable using a library with an unfamiliar acronym in its name.

I also initially found it hilarious to say that my library was "Args AF!", but it got old
pretty fast and some potential users may find it off-putting.
