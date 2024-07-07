+++
title = "Migrated browser games to nearlyfreespeech"
date = 2020-10-07
slug = "migrated-browser-games-to-nearlyfreespeech"
+++

After [I accidentally let all my AWS TLS certs expire](@/daily/i-accidentally-let-some-of-my-tls-certs-expire/index.md), attempting to
play any games on games.gridbugs.org (such as [Skeleton Crew](https://games.gridbugs.org/skeleton-crew))
results in a scary warning about security risks ahead. I took this opportunity to move more of my
stuff off amazon and onto my new favourite web hosting provider: [nearlyfreespeech](https://www.nearlyfreespeech.net/).

Currently all my browser games are playable on [gridbugs-games.nfshost.com](https://gridbugs-games.nfshost.com/).
I'll update the DNS records for games.gridbugs.org in the coming days.
As an added bonus, there is now an index page (just the default apache index) which lists all the games!
This wasn't possible when I was hosting with AWS because S3 has no concept of listing the files in a directory
when a directory lacks an index file.

I removed a work-in-progress game ("RIP"), renamed "meters" to "meters-below-the-ground", and compressed the bump
and light map in the "top-down-side-scrolling-engine", which I've also renamed to "abandoned-game-big".
There are some references to these projects in various git repos and pages on this site, which I still need to
update.

I'm not going to migrate downloadable files for the games that are distributed as standalone binaries.
Instead, I'll update all their download links to point to [my itch.io page](https://gridbugs.itch.io/) where
they can be downloaded (for an optional fee!), and where I don't have to pay for the bandwidth!
