+++
title = "I'll probably move this site to nearlyfreespeech"
date = 2020-08-04
slug = "i'll-probably-move-this-site-to-nearlyfreespeech"
+++

I recently grew frustrated with the infrastructure running this website.
At the time of writing it's hosted on amazon s3, using cloudfront for
caching and managing certificates. S3 seems to have some issues with mime
types requiring occasional manual fixups through the aws console and
explicit cache invalidations. I'm sure (or at least I hope) that there's a
way to configure aws to better suite my needs, but I'm also not _in love_ with
amazon as a company, so I've started exploring alternatives.

This site is about as simple as a website can be - it's a directory of
static html files (generated with jekyll, but the server doesn't need
to worry about that), so I can host it pretty much anywhere.
I've been messing around with [nearlyfreespeech](https://www.nearlyfreespeech.net/)
and even set up a [version of this site](https://gridbugs.nfshost.com/)
there to see how easy it would be to set up and I can only describe the
process as "no nonsense"!
