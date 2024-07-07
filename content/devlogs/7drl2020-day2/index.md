+++
title = "7 Day Roguelike 2020: Day 2"
date = 2020-03-01T20:00:00+10:00
path = "7drl2020-day2"

[taxonomies]

[extra]
og_image = "screenshot.png"
+++

Lots of visual changes today! I implemented a brand-new renderer. The most interesting thing about it
is every game cell is rendered as a 2x2 block of text cells. The obvious benefit of doing this is
the health of each enemy can be displayed on the enemy tiles, along with a letter indicating what
type of enemy they are, and an arrow indicating where they will move on their next turn.

![screenshot.png](screenshot.png)

Another neat side-effect of 2x2 rendering is the stairs can actually look like stairs (rendered using block characters)! I had to improvise a symbol for
the player character. I made an arrangement of box-drawing characters that kinda looks like a futuristic '@' if you squint!

<!-- more -->

I also added a message at the bottom of the screen describing what is in the currently hovered-over cell
(the mouse cursor isn't visible in the screenshot). On the right of the screen is a mock-up of the heads up display.
It gets rendered when the game runs, but is just populated with example data, and isn't connected to the game engine.
That will be my main task for tomorrow.

For those inclined to play roguelikes in a terminal, here's the save from my session above running in tmux
next to my compiling window!

![screenshot-terminal.png](screenshot-terminal.png)

And who doesn't love a good death screen!

![screenshot-death.png](screenshot-death.png)
