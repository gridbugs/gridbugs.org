+++
title = "What exactly is a \"Functional Programming Language\""
date = 2020-09-24
slug = "what-exactly-is-a-functional-programming-language"
+++

I don't believe the term "functional" is a meaningful description of a programming language.
It's hard to come up with a definition of the term that includes all the languages that
brand themselves as "functional" that wouldn't include _all_ modern programming languages.

In a so called functional language, you'll certainly find closures and first class functions,
but name a general purpose language from the last 30 years that doesn't have these features.
It's likely you be _encouraged_ to avoid mutable state, but rare are the languages that
_prevent_ mutation (and these are the _purely_ functional languages - a term which is well-defined)
The standard library will probably come with a collection of persistent, immutable
data structures, but any language can have such a library.

Recursion will likely be the
_preferred_ (or perhaps only) form of iteration, and if you're lucky the language implementation
(or even the language _spec_ if you're extra lucky) will employ tail-call optimisation so
you don't (necessarily!) blow up your stack when calling functions recursively.

Algebraic data types, pattern matching, and expressive type systems all frequently make appearances
in functional languages. Lisp is a notable exception which has none of these.
It doesn't seem prudent to conflate these terms with functional programming though.

Perhaps "functional" is a useful word for describing a design space attractor. In practice, it
may turn out that all the features listed here go well together. Maybe the term was more meaningful
back in a time when the programming language ecosystem was less diverse, and the functional/imperative dichotomy
was stronger. Has the success of functional languages of the past, and their subsequent influence
on the design of new languages, ultimately led to the term losing all meaning?
