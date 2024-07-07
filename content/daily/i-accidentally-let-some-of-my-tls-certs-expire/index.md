+++
title = "I accidentally let some of my TLS certs expire"
date = 2020-10-03
slug = "i-accidentally-let-some-of-my-tls-certs-expire"
+++

A few months ago I switched this site's web hosting from AWS to nearlyfreespeech.
I set up new TLS certificates for gridbugs.org and www.gridbugs.org, which the site
now uses instead of the AWS certificates it used to use. So when I received warnings
from Amazon informing me that my TLS certificates were about to expire, I promptly
ignored them. I forgot that some additional domains - games.gridbugs.org and
files.gridbugs.org - are still hosted on AWS and still use the (now expired)
AWS certificates. Oops!

I use those domains to host games I've made, both downloadable and playable in-browser.
Rather than migrating all the games to nearlyfreespeech, I'll set up redirects to
my [itch.io](https://gridbugs.itch.io/) page for all the games which I've released on
itch. The games which I never released, but which can only be played in a browser (mostly simple demos),
I'll migrate to nearlyfreespeech. Small game demos that run natively, I'll migrate as well.
All the new game projects I work on, I'll make available exclusively through itch.
This is mostly because as I add music to newer games I make, their size can be large, and I don't
want to use a ton of bandwidth should any of my games become wildly successful.
