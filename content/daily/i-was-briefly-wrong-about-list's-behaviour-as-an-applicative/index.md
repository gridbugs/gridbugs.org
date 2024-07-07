+++
title = "I was briefly wrong about list's behaviour as an applicative"
date = 2020-09-11
slug = "i-was-briefly-wrong-about-list's-behaviour-as-an-applicative"
+++

For today's post I originally set out writing an explanation of the concept of _Applicative Functors_.
Partway through writing it, I was making an example involving lists, and it occurred to me that
contrary to my intuition up until that point, you cannot use `apply` to effectively `map` a function
of two arguments over a pair of lists, as one would typically do with `zipWith`.
If you try, your code will typecheck, but you'll end up calling the function on all combinations of
values from the two lists, rather than just corresponding pairs. What's weird is that for as long
as I've known that "lists are monads" I've internalised the fact that `bind`-ing on lists
enumerates all combinations of values, and it would be weird for `apply` and `bind` to behave differently.
And in hindsight it's painfully obvious that an operation
as abstract as `apply` doesn't care about such paltry details as the _length_ of lists, as `zipWith`
does.

What gave it away was that I realised I expected `(pure (1+)) <*> [1, 2, 3]` to add 1 to each number in the RHS
(which it does) but I also expected `(pure (+)) <*> [1, 2, 3] <*> [4, 5, 6]` to be `[5, 7, 9]`.
I wrote down as much, and this set off all sorts of internal consistency checks in my head because
these two things can't be true at the same time. That's the whole point of doing these daily posts.
It seems like it's easier to be wrong in your head than on paper.

And if anyone is reading this and wondering about the results of the expressions above:
```haskell
Prelude> (pure (1+)) <*> [1, 2, 3]
[2,3,4]
Prelude> (pure (+)) <*> [1, 2, 3] <*> [4, 5, 6]
[5,6,7,6,7,8,7,8,9]
```

Now go read [learnyouahaskell](http://learnyouahaskell.com/functors-applicative-functors-and-monoids#applicative-functors)!
