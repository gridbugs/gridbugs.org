+++
title = "7 Day Roguelike 2018: Success"
date = 2018-03-10T00:37:00+10:00
path = "7drl2018-success"

[taxonomies]
+++

The game is done! I'll make another post in a day or so with links to download
and play the game, but if you can't wait, [get the source code from github](https://github.com/gridbugs/meters-below-the-ground) or
[play or download the game from its itch.io page](https://gridbugs.itch.io/meters-below-the-ground).

<!-- more -->

![screenshot.png](screenshot.png)

Tonight I added two more meters: "blink" which teleports the player 2 cells
in a given direction, and "push" which pushes away nearby enemies. I also did
some minor UI tweaks and game balancing. The rest of the night I spent play-testing
and adjusting balance.

I'm happy with how the game turned out. While play-testing I was initially quite bad
at the game, but eventually learnt some strategies that increased my odds of progressing.
Most importantly, I actually enjoyed myself when playing the almost-finished game. I
think this is the first time I've been faced with interesting tactical and strategic decisions
while playing a game I've made.

My favourite mechanic is the interplay of the railgun, quadgun and blink abilities.
To use the weapons effectively, you must position yourself favourably. When using
the railgun, you want a line of enemies on the X or Y axis of the player so you can hit them
all at once. The quadgun is most efficient when there's an enemy to your north, south, east and west,
since you can hit 4 enemies with a single shot. The blink ability gives you more power
over your positioning, and the guns motivate the use of this power.

As always, the 7drl was a trial-by-fire of my game engine. I adapted the game engine from an
ongoing game project ([punchcards](https://github.com/gridbugs/punchcards)), which I've been
developing for several months. I found bugs in my terminal rendering library ([prototty](https://github.com/gridbugs/prototty))
and missing functionality in my game data store code-generation library ([entity-store](https://github.com/gridbugs/entity-store)).
Some of these problems I fixed during the week. I'll be exploring the more complex problems
in the coming weeks. The one feature I sorely missed from the engine is a turn schedule.
I want the ability to have events happen a certain number of turns in the future, and ended
up implementing a hasty workaround.

I'm planning to continue working on this game after the 7drl. I'm going to use it to test the new
engine features I implement, and use it as a case study for coming up with better abstractions
for encoding rules and mechanics in my engine.
