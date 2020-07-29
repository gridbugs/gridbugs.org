---
layout: series-part
series: roguelike-tutorial-2020
index: 0
date: 2020-06-12 20:00:00 +1000
title: "Part 0 - Setting Up"
permalink: /roguelike-tutorial-2020-part-0/
og_image: logo.png
---

This is the first of a series of posts where I follow the
[python tcod roguelike tutorial](http://rogueliketutorials.com/)
but instead of programming in python using the
[tcod](https://github.com/libtcod/libtcod) library, I'll be programming
in rust using the [chargrid](https://github.com/stevebob/chargrid)
library, which I've been developing for about 3 years.

This is part of an event where the [roguelikedev subreddit does the complete
roguelike tutorial](https://old.reddit.com/r/roguelikedev/wiki/python_tutorial_series)
over the course of several weeks.

{% image logo.png %}

## Installation

To follow this tutorial you will need a rust compiler. Follow the instructions [here](https://www.rust-lang.org/tools/install).

## New Rust Project

After rust is installed you'll have a command named `cargo`. Use it to create a new rust project:

```
$ cargo new --bin chargrid-roguelike-tutorial-2020
```

This command creates a directory structure:

```
├── Cargo.toml   # manifest - we'll mainly update it to add dependencies
└── src          # all the project's source code will live under this directory
    └── main.rs  # entry point for the program
```

From within the "chargrid-roguelike-tutorial-2020" directory, run:

```bash
cargo run
```

This will compile and run the program. The output should be something like:

```
   Compiling chargrid-roguelike-tutorial-2020 v0.1.0
    Finished dev [unoptimized + debuginfo] target(s) in 0.16s
     Running `target/debug/chargrid-roguelike-tutorial-2020`
Hello, world!

```

## Get Fonts

We'll be making a traditional roguelike, and that means text-only graphics.
You'll need a font. Chargrid requires a pair of fonts - one for regular text and a second for bold.
Download ttf files for a pair of fonts. They must be monospace (all characters are the same width).

Two suitable fonts can be downloaded here:

- {% file roguelike-tutorial-2020/fonts/PxPlus_IBM_CGAthin.ttf | IBM PxPlus Regular TTF %}
- {% file roguelike-tutorial-2020/fonts/PxPlus_IBM_CGA.ttf | IBM PxPlus Bold TTF %}

Once you have your fonts, make a "fonts" directory inside your "src" directory and place the
fonts there.

Your source tree should now look like this:
```
├── Cargo.toml
└── src
    ├── fonts
    │   ├── PxPlus_IBM_CGAthin.ttf
    │   └── PxPlus_IBM_CGA.ttf
    └── main.rs
```
## Reference Implementation

If you get stuck, or something in these tutorials doesn't make sense, take a look at the git repo at
[https://github.com/stevebob/chargrid-roguelike-tutorial-2020](https://github.com/stevebob/chargrid-roguelike-tutorial-2020).
For each part and subsection of this tutorial, there is a corresponding branch showing the state of the repo
at that stage of the tutorial. This makes it easy to show the changes introduced in each part of the tutorial.

For example to show the change to `src/main.rs` between part 0.0 and 1.0, clone the repo and run:
```
git diff part-0.0 part-1.0 src/main.rs
```

{% pygments diff %}
diff --git a/src/main.rs b/src/main.rs
index e7a11a9..b7dbe34 100644
--- a/src/main.rs
+++ b/src/main.rs
@@ -1,3 +1,64 @@
 fn main() {
-    println!("Hello, world!");
+    use chargrid_graphical::{Context, ContextDescriptor, Dimensions, FontBytes};
+    const CELL_SIZE_PX: f64 = 16.;
+    let context = Context::new(ContextDescriptor {
...
{% endpygments %}

Reference implementation branch: [part-0.0](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-0.0)

## Code Snippets

Throughout this tutorial there will be many code snippets!
In fact all the code that makes up the reference implementation will be present at some point in the tutorial.
As we progress through building this roguelike, there will be times when we update existing code.
Whenever code changes, the new version of the code will be shown, with (hopefully!) enough context for the reader
to understand the old code that it's replacing and update their implementation accordingly.

If it's not clear, consult the reference implementation to see exactly what changes between each section of each part.

There may be points in the middle of sections (between headings) where the code doesn't compile, however at each heading
in each part, the code will be in a compiling state. Each heading corresponds to a particular `part-x.y` branch
in the reference implementation repository, and each such branch should always be in a compilable state.

## Ready to begin?

{% local roguelike-tutorial-2020-part-1-test | Click here for part 1 of the tutorial! %}
