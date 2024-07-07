+++
title = "7 Day Roguelike 2022: Atmosphere"
date = 2022-03-06
path = "7drl2022-day2"

[taxonomies]
+++

The aspect I care most about this year is setting the mood of being inside
(or outside) on a rainy day in the woods. I spent most of today building
the rain and mist systems.

![screenshot.png](screenshot.png)

<!-- more -->

I also made a very simple procgen system that randomly places trees with
density determined with perlin noise. There is also ground topography which
will become relevant soon when I implement flooding. The cabin is placed
at a high location according to the topography and the player starts just
outside the cabin on the side with the door.

![screenshot2.png](screenshot2.png)

The cabin is supposed to feel inviting, and it gives off a warm glow
so the player can spot it in the rain at the start of the game.

I also have a more solid plan for the rest of the jam. The game will take place over the
course of several days. This will replace the multiple levels in a typical
dungeon crawler. Each day, the map will flood a little more. I generate
a topographic map using perlin noise, which I'll use to implement flooding by flooding
the lowest areas first.

In order for the flooding to be mechanically interesting, the player needs a reason
to go outside. The loss condition of the game will be the protagonist runs out of
motivation to stay in the woods. There will be certain tasks that can be done once
per day that refill motivation:
 - picking tea and returning to the cabin to brew it, and drink it
 - finding a rare flower and taking it to a shrine
 - harvesting the sap of a giant maple tree
 - standing on the shore of the lake and contemplating their existence
 - watching heavy rain from inside the cabin

The idea is that the player will form a daily routine which they can optimize and
defend from the rising water.

Motivation can be depleted by:
 - getting rained on without an umbrella
 - wading through water without gumboots

It will also gradually deplete over time at a rate that necessitates doing about half
of the motivation-building tasks each day.

The player can stand under a tree to reduce the effect of being rained on, and they
can move rocks to make stepping stones across flooded areas.

As time progresses, the rain gets heavier, and the flood waters rise. To mitigate the
effects of this, there are some items that the player can unlock by doing quests.
 - gumboots reduce the motivation lost by wading through water
 - the umbrella reduces the motivation lost by getting rained on
 - the newspaper gives advance warning of the next change in the weather
 - the shovel lets you dig drains that will fill up before flooding progresses
 - the map reveals the topography of the area and landmarks

Each day the player will have several quests available to them which grant one of these items.
They'll all require the player to go to a location and perform some action. The quest description
will be in terms of landmarks, e.g.
 - A blight has infected the trees to the west of the temple ruins. Take this serum and
   use it on the trees, and you'll receive a shovel in return.

This means the map will need landmarks:
 - giant tree
 - temple ruins
 - lake (on one edge of the map)
 - the cabin itself

I also added ruins to the terrain generator that just load the pre-fabricated section
of the map from a text file and rotate it a random amount.

![ruins.png](ruins.png)

I resisted the urge to make the markings on the alter glow purple because this isn't
that sort of game...
