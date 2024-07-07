+++
title = "Problems, not Solutions"
date = 2020-08-14
slug = "problems-not-solutions"
+++

A few years ago, at a past job, I received a piece of advice from a code reviewer which I've treasured every since:
"describe a change in terms of the problem it addresses, rather than the solution it implements".

Focusing on solutions is tempting! You're a smart engineer. You worked hard on your solution,
and you're proud of the code you wrote. When you've spent a few days working on implementing a new
feature, it's easy to just describe the work you did.

The trouble with this approach is that
reviewers, and people who later find your code with (say) git blame, won't understand
why the change was made. The change will exist as a technical artifact, and will be reviewed as
such, but stripping away the context as to why the change was made means some difficult questions
might not get asked during review. And after the code is checked in, if someone besides the author
thinks the code should be changed further, or even removed, it takes more effort if the "paper trail"
associated with a particular piece of code doesn't include the reason it was written in the first place.

Take this idea further. When someone tries to convince you of an idea, sell you a product, pitch you
a company, it's common for the person with a solution to focus on the shiny solution. It's common for the
person on the receiving end to be impressed by a shiny solution, and skip the part where they
question whether it's a problem that needs solving (at least right now), or whether the solution is appropriate.

Beware of solutions without problems.
