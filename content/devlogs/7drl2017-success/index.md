+++
title = "7 Day Roguelike 2017: Success"
date = 2017-03-11T00:02:00+10:00
path = "7drl2017-success"

[taxonomies]
+++

I spent the night polishing, play-testing, balancing and fixing some minor bugs.
I consider the week to have been largely successful. The game turned out roughly
like what I imagined at the start of the week.

The main thing I would do differently if I could do it over would be making
gameplay more pure. My original design was inspired by 868HACK, specifically the
predictable gameplay allowing for thinking many moves ahead. The result I ended
up with was instead quite organic, with gameplay emerging from low-level physical
rules. I still think I have created something fun, but it wasn't exactly what I
set out to achieve.

Something I'm happy with is the fact that players must think about short and
long term goals when playing Apocalypse Post. During a delivery they make short
term decisions about positioning and combat. Between deliveries, they must
decide whether it's worth spending money on things they might need next mission,
or saving up for something more expensive that will pay off long term.
Further, while on a mission, players collect letters which increase the reward
at the end of the mission. Going out of their way to collect letters is more
dangerous than just taking the safest route, so there is a trade-off between
safety right now, and having enough resources later on.
This is
an improvement over the game I made for last year's 7DRL,
[Skeleton Crew](@/projects/skeleton-crew/index.md), in which all the decision making was short
term.

Another goal of this week for me was to stress test the game engine I've
been developing for several months. Its goal is to be able to efficiently and
flexibly encode and enforce rules for a turn-based game,
which it does using many concepts
borrowed from Entity Component Systems.

The 7DRL has succeeded in highlighting
which parts of the engine I would most benefit from improving. In short, as the
number of rules increases, unintended interactions between rules can
occasionally cause undesired results. I have some ideas for addressing this
problem. I plan on making some blog posts explaining how the engine works and
how I'll address the limitations I discovered.
