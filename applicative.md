---
layout: daily
date: 2020-09-11
title: Applicative Functors for Engineers
---

## Functors Primer

A _functor_ is anything you can _map_ a function over. That is, any type constructor `t` for which a function with the following
signature is defined:
```ocaml
map : a t -> (a -> b) -> b t

(* This is OCaml syntax.
 * [a t] is syntax for a type [t] parameterised by a type [a].
 * [(a -> b)] is the type of a function that takes a value of type [a] and returns a value of type [b].
 *)
```

This function preserves the "structure" of its input, but updates values of contained elements according
to some function. A practical example is creating a list by applying a function to every element of an
existing list (`list` is a functor).

If you have a function `strlen` which returns the number of characters in a string:
```ocaml
strlen : string -> int
```
...you can count the characters in a list of strings and produce a list of lengths with:
```ocaml
List.map ["The"; "emperor"; "has"; "no"; "clothes."] strlen   (* [3; 7; 3; 2; 8] *)

(* The above syntax is the application of a function named [map] from a module named [List],
 * passing it a list of strings and a function.
 * In OCaml, lists are delimited by semicolon.
 * Note the [List] module from the base library looks slightly different to the one used here.
 *)
```

## Applicative Functors

_Applicative functors_ let you operate on groups of values simultaneously.

Suppose you have a function `prefix` that returns the initial substring of a string with a given length:
```ocaml
prefix : string -> int -> string    (* prefix "pencil" 3 == "pen" *)
```

Observe that with `map` alone, there's no way to take a list of strings, and a corresponding list of
prefix lengths, and compute the corresponding list of prefixes. Try it! You aren't allowed to pattern
match, recur, or use any other functions besides `List.map`.

All applicative functors are functors (ie. they have a `map` function). Additionally, the following
two functions are defined:
```ocaml
pure : a -> a t

apply : (a -> b) t -> a t -> b t
```

Before getting into these, it's worth showing one more function - `both` - which can be implemented in terms of `map`
and `apply` - that may be more intuitive:
```ocaml
both : a t -> b t -> (a * b) t

(* In OCaml [a * b] is the type of a pair of values of type [a] and [b]. *)
```

The `both` function combines corresponding pairs of values from its input.
When dealing with lists, the `both` function is often named `zip` instead, but the
idea generalises to all applicative functors. For example, in the context of
command-line argument parsing, if you have a parser which knows how to read a string
argument named `--input` (a `string parser`, say), and a second parser which knows
how to detect the presence of a `--verbose` flag (a `bool parser`), you could use
`both` to produce a parser that knows how to parse both arguments at the same time -
a `(string * bool) parser` in this case.

To use `both` to compute prefixes of a list of strings:
```ocaml
List.map
    (List.both ["wearing"; "yellow"; "attracts"; "marsupials"] [2; 4; 2; 4])
    (fun (str, len) -> prefix str len)

(* ["we"; "yell"; "at"; "mars"] *)

(* The 3rd line above shows an inline function which unpacks the pairs produced by [both]
 * and passes the string and prefix length to [prefix].
 *)
```

Back to the "canonical" definition of applicative functors:
```ocaml
pure : a -> a t

apply : (a -> b) t -> a t -> b t
```

The `pure` function takes a "normal" value and constructs a (often trivial) value of the application functor based on its argument.
In the case of `list`, `pure` creates a one-element list containing its argument.

`apply` looks scary because its first argument is the applicative functor type constructor parameterised by a function type `(a -> b)`.
In the case of `list`, this would be a list of functions. `apply` is particularly useful in languages with _partial function application_
(such as OCaml). Taking the `prefix` function above - a function of 2 arguments - and calling it with only its first argument:
```ocaml
prefix : string -> int -> string

prefix "instantaneous" : int -> string
```
...results in a function that takes the remainder of `prefix`'s arguments.
```ocaml
let prefix_instantaneous = prefix "instantaneous"

prefix_instantaneous 2   (* in *)
prefix_instantaneous 7   (* instant *)
```

If we were to map `prefix` over a list of strings:
```ocaml
List.map ["wearing"; "yellow"; "attracts"; "marsupials"] prefix : (int -> string) list
```
...we'd end up with a list of partially-applied functions. We can now use `apply` to call each of these functions on
the corresponding prefix length:
```ocaml
List.apply
    (List.map ["wearing"; "yellow"; "attracts"; "marsupials"] prefix)
    [2; 4; 2; 4])

(* ["we"; "yell"; "at"; "mars"] *)
```

The `pure` function lets you write the same thing without the need for map:
```ocaml
List.apply
    (List.apply
        (List.pure prefix)
        ["wearing"; "yellow"; "attracts"; "marsupials"]
    )
    [2; 4; 2; 4])

(* ["we"; "yell"; "at"; "mars"] *)
```

