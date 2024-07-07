+++
title = "7 Day Roguelike 2020: Day 4"
date = 2020-03-03T21:00:00+10:00
path = "7drl2020-day4"

[taxonomies]

[extra]
og_image = "screenshot.png"
+++

Lots of work on mechanics today. All the attack and defense abilities are implemented,
and most enemies do something interesting when attacked. Also, it's possible (but not
advisable!) to walk on the green sludge found around the sewer. Most enemies are also
vulnerable to the sludge, which can be used to the player's advantage.

![screenshot.png](screenshot.png)

<!-- more -->

This video shows off some abilities being used to herd enemies and push them into
toxic sludge.

{{ video_player_mp4_autoplay_loop(src="gameplay.mp4") }}

I spent some time today fixing pathfinding bugs.
Areas which enemies can traverse, but would rather avoid, required rethinking the
game's AI a little. Also, the AI system previously assumed that the player will
only move on their turn, which is violated by defensive teleports (a teleport
ability that activates when the player is attacked).

Tomorrow I need to fix some problems with turn order. NPCs skip their turn after
an animation (such as repelling enemies from the player), and as apparent in
the video above, if enemies are pushed into sludge, they don't take damage until
the end of their next turn.

Also on the cards for tomorrow is upgrades for the player character, and implementing
the abilities at the bottom of the UI (such as "Skip Atk").
