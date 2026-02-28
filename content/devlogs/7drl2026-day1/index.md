+++
title = "7 Day Roguelike 2026: Day 1"
date = 2026-02-28
path = "7drl2026-day1"

[taxonomies]

[extra]
og_image = "screenshot2.jpg"
+++

This year my game will be about taking a road trip through a mysterious exclusion zone,
kind of like Pacific Drive, only it's one continuous journey rather than a series of short
runs. And obviously it's an ASCII turn-based traditional roguelike.

![](screenshot2.jpg)

I spent today dusting off my codebase from my submission from 2 years ago ([Electric Organ](@/projects/electric-organ/index.md)), reworking the UI, and
adding a driving mode pictured above. The gameplay loop will alternate between two modes:
a driving mode where you choose where and when to stop and _hopefully_ make some
decisions about which routes to take and deal with random events (though these
are all stretch goals) and a regular walking around mode, scavenging for resources to keep the journey going.

![](screenshot1.jpg)

I don't have as much free time to devote to 7DRL this year. I'm going to try to get a basic framework
up and running tomorrow for procgen, implement the systems that drive the
status bars at the bottom of the screen, and add a win condition. Then the
remaining work will mostly be adding content, which I can add as much or as
little of as I have time to do so.
