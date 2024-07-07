+++
title = "Replace all the CSS!"
date = 2020-08-05
slug = "replace-all-the-css!"
+++

Last night I rewrote all the CSS in this site.
This site started its life with the [minima](https://github.com/jekyll/minima)
theme, and I've been gradually replacing parts until there's almost nothing
of the original templates left. I'd been hacking on its original CSS for
years and it was growing into a tangled mess which I only partially understood.

So I deleted all the stylesheets (except syntax highlighting) and all the `class`
tags, and most `div` wrapper elements I was using for style, then rebuilt the
style to be the bare minimum to make the site look basically the same as before.
I now understand why every CSS rule is the way it is, and I can change the rules
in the future with confidence.

The hardest part was getting the nav bar along the top to behave sensibly when
the screen is narrow (e.g. on a phone). Previously it would replace the links
with a drop-down menu using a trick
involving a checkbox input element which I only learnt about when I viewed
the site without any CSS and still don't understand how it worked.
In the interest of making the CSS simpler, I got rid of the drop-down menu
and now the nav links wrap around and have some minor style changes
when the screen width gets below a certain value.
