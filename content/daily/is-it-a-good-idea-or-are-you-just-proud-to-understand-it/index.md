+++
title = "Is it a good idea, or are you just proud to understand it?"
date = 2020-09-23
slug = "is-it-a-good-idea-or-are-you-just-proud-to-understand-it"
+++

I think among engineers there is a tendency to overvalue those ideas
whose complexity can serve as a kind of proof of intellect.
It's tempting to forgo a simple, easy-to-understand solution,
in place of a terse solution requiring more understanding, or even a more
flowery, perhaps more general solution. It may feel good at first to
show off your knowledge of programming to your fellow engineers who
review your code. Maybe teach them a thing or two. But I claim it's
rarely merited. Just give a tech talk instead!

I first noticed myself doing this when I came to realize that in scala,
"for loops" behave as syntactic sugar for `.map`, `.flatMap`, and `.foreach`.
For a brief period after this, I over-used them.
It felt "cute" to write a loop over an iterator which just built up a
new iterator (effectively mapping a function over the iterator).
```scala
val newIter = for { i <- someIterator } yield {
    // do something with i
}
```
This made me feel clever because understanding that code depended on
understanding that this loop is effectively:
```scala
val newIter = someIterator.map(i => /* do something with i */)
```
...and that the operation on `i` will be deferred until `newIter` is actually
iterated (if ever). This was especially confusing because in pretty much
every other language, for loops run immediately in all cases rather than
having behaviour that varies based on the type of the value on the right-hand-side
of the `<-` symbol (the more I use scala, the more I detest it).

It felt good to write the `for` version of the code above because I got
to exercise some newfound knowledge. But the requirement of knowledge that
made this code so satisfying to write makes it difficult to read.

So now I'm conscious of this pathology and aspire to write code that's only
as complicated as it needs to be to solve the problem on hand, rather than
demanding needless cognitive load for cognitive load's own sake.
