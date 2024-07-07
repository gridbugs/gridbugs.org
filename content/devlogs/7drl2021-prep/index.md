+++
title = "7 Day Roguelike 2021: Preparation"
date = 2021-03-04
path = "7drl2021-prep"

[taxonomies]
+++
<style>
.orbital-decay {
    color: #D08C15;
    background-color: #00003B;
}
</style>

This year's 7DRL is days away.
Over the last few weeks I've dusted off my game engine and come up with a plan for the jam.
I'm going to revisit the idea behind my first 7DRL - [Skeleton Crew](@/projects/skeleton-crew/index.md) -
which was a game about fighting zombies in a space ship where shooting the hull caused the
ship to decompress.

<!-- more -->

![skeleton-crew.png](skeleton-crew.png)

The plan this year is to make the spiritual successor to Skeleton Crew, addressing what I see
as its faults. Skeleton Crew lacked any strategic decision making; the only game loop was tactical,
and the tactics themselves were shallow.

The parts of Skeleton Crew that I'm proud of - the art style and plot (if "shoot zombies in space" can be considered a plot) -
I will be shamelessly recycling. I'm still using [chargrid](https://github.com/gridbugs/chargrid) for graphics and input handling,
so all the graphics will need to be re-implemented in that framework. SC didn't use text-only graphics (_gasp_), so those heath
bars are going to have to be replaced with something else.

Another part of Skeleton Crew I'm proud of was its title. Obviously I can't re-use that, so I need to come up with another
phrase that evokes both spaceships and the undead:

## <span class="orbital-decay">Orbital Decay</span>

<p class="orbital-decay">
The station clung desperately to the edge of space. As it kissed the atmosphere,
sparse traces of air compressed red hot before it, scribing a brilliant arc
across the night sky.
</p>

<p class="orbital-decay">
And now, a second shooting star...
</p>

<p class="orbital-decay">
Klaxons rang out a shrill warning as the engines of your emergency shuttle worked harder than
your boss would approve of. But your boss isn't here. Only you would be mad enough to pilot this
cobbled-together assortment of carbon fiber and polyurethane foam, perched atop a tank of highly-volatile chemicals,
in pursuit of a dangerously out-of-gas space station. Just a little boost at just the right time from the precious
fuel cell you carry and the station will be free of this dreaded atmosphere, leaving enough juice to get you home,
where your buddies are placing bets on whether you'll make it.
</p>

<p class="orbital-decay">
Last you heard, odds were 5 to 1 against.
</p>

<p class="orbital-decay">
"Docking complete," sounds a lifeless mechanical voice. No word yet from the crew. Comms must be down. Figures.
Shouldering your pack containing the hydrogen fuel cell, you trudge into the airlock.
Gotta lug this thing down five flights of stairs to get to the fuel bay. Who designed this place?
</p>

<p class="orbital-decay">
A dim light flickers on in the airlock revealing words smeared in blood on the opposite door: "DON'T OPEN! DEAD INSIDE!".
</p>

<p class="orbital-decay">
Better make those odds 6 to 1...
</p>

## Concept Art

So that I don't spend hours on the first day bikeshedding art style, I've drawn some sketches.
Last year I had great success using a grid of 2x2 character tiles in [slime99](@/projects/slime99/index.md),
so this year I'm going to take it further and use a grid of _3x3_ tiles. This will let each enemy
have two visible stats, and 3 letters for their name.

The most time was spent getting the "@" sign looking just right!

![concept-game.png](concept-game.png)

Here's how I hope the main menu will end up. Obviously the partially-visible space station on the menu screen will be procedurally-generated!

![concept-menu.png](concept-menu.png)

## Engine Prep

Other than the [Chargrid Roguelike Tutorial](@/roguelike-tutorial-2020/_index.md) I didn't get much roguelike development done
in the past year. For this 7DRL I'll be starting with the [slime99 codebase](https://github.com/gridbugs/slime99) from last year's 7DRL.
I have been doing regular maintenance on slime99. The audio bug that meant that music was disabled at launch is fixed.
My pull request to fix the rust audio library [rodio](https://crates.io/crates/rodio) remains unmerged after almost a year,
so I'm using my own fork. I've been keeping chargrid up-to-date as its dependencies are updated, and keeping slime99 working
with the latest versions of all my libraries.

Also the [wfc](https://crates.io/crates/wfc)-based procedural-generation playground that I made last year for slime99
appears to still work which will make it easy to mess around with terrain generation before starting any actual game development.
When I run the playground it prints out a slime99 level.

![procgen.png](procgen.png)

## Plan

I'll start on Saturday, and spend the day on terrain generation, renderer and basic physics (collisions, doors, visible area detection, lights, stairs).
On Sunday I'll implement the core game mechanics. Specifically the armour penetration system where bullets move through enemies, damaging
each one, until enough armour has been stacked up to reduce the pen of the bullet to zero. If a projectile strikes the hull, there is a
chance that that piece of hull will be destroyed. I'll also implement the decompression mechanic on Sunday.

I'm working full-time during the week, so I'll only have evenings to commit to the game jam.
The goal will be to spend Thursday and Friday adding content, play testing, and tuning. This means I'll have Monday to Wednesday to finish on mechanics.
There are some open questions around mechanics:
- How will the player get new weapons? What are the strategic decisions relating to replacing weapons?
- When will the player receive character upgrades? Other than more health and oxygen, what upgrades would make sense? Should there be active/passive abilities to unlock?
- Visible area detection should be thought of as a game mechanic. A way to add depth to this is to allow the player to reveal areas of the map by other means, but this should cost something.
Do they pay with risk (they have to get to the map) or with some sort of resource? Can that resource also be used to pay for upgrades?
- What happens on the final floor? [Boss fights don't really make sense in traditional roguelikes.](@/blog/boss-fights-in-traditional-roguelikes/index.md) What would be a better way to
  culminate the experience of the game? Would a difficult, regular level be enough?
- How will the game change as the player progresses? Adding more/tougher enemies is easy but boring. The station could get progressively more and more destroyed, and an upgrade
  path could center around dealing with more sections of void.
