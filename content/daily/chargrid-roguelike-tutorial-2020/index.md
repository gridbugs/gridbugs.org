+++
title = "Chargrid Roguelike Tutorial 2020"
date = 2020-08-15
slug = "chargrid-roguelike-tutorial-2020"
+++

Today I finished writing the code and tutorial pages for the tutorial I'm making
as part of
[roguelikedev subreddit does the complete
roguelike tutorial](https://old.reddit.com/r/roguelikedev/wiki/python_tutorial_series).
The tutorial pages can be read [here](@/roguelike-tutorial-2020/_index.md).

I've been working on this in my spare time for about 8 weeks. Unlike the 7drl,
for this project I started from nothing and built the entire engine and game using
a collection of rust libraries I've made. Also unlike the 7drl, my aim was to make a vanilla
procedurally-generated dungeon crawler, with no interesting features, to demonstrate
how my libraries can be used to implement a roguelike.

The biggest personal benefit of doing this project has been that I was forced to explain
all the concepts of my libraries to someone other than myself. This lead to various simplifications
and quality of life improvements. I also noticed a common pattern I've used in my most recent roguelike engines
(namely [rip](https://github.com/gridbugs/rip) and [slime99](https://github.com/gridbugs/slime99/))
which is generic and internally complex. Not wanting to explain its inner workings as part of the
tutorial, I factored it out into the [spatial_table](https://crates.io/crates/spatial_table) crate.
