---
layout: series-part
series: roguelike-tutorial-2022
index: 0
date: 2022-09-06 01:42:00 +0200
title: "Part 0 - Setting Up"
permalink: /roguelike-tutorial-2022-part-0/
---

This series of tutorials will demonstrate how to build a traditional roguelike
game in rust using the [gridbugs](https://github.com/gridbugs/gridbugs/) game
engine.

## Install Dependencies

### Rust

Install the rust compiler by following [these instructions](https://www.rust-lang.org/tools/install).

### Tools and Libraries

Linux users may need to install build tools and libraries in order to compile
and run the code in this tutorial. You'll need a C compiler and linker, as well
as X11 libraries and a video driver.

#### Ubuntu
```
apt install build-essential libxcursor1 libxrandr2 libxi6 libx11-xcb1 vulkan-tools
```
#### Archlinux
```
pacmah -S base-devel libx11 libxcursor libxrandr libxi vulkan-tools
```
#### NixOS
Use the
[shell.nix](https://github.com/gridbugs/gridbugs-roguelike-tutorial-2022/blob/main/shell.nix)
file in the reference implementation.

## Make a new rust project

```
cargo new --bin gridbugs-roguelike-tutorial-2022
```

This command creates a directory named `gridbugs-roguelike-tutorial-2022`
with contents:
```
├── Cargo.toml   # manifest - we'll mainly update it to add dependencies
└── src          # all the project's source code will live under this directory
    └── main.rs  # entry point for the program
```

## Reference Implementation

There's a reference implementation at
[github.com/gridbugs/gridbugs-roguelike-tutorial-2022](https://github.com/gridbugs/gridbugs-roguelike-tutorial-2022).
It's organised into branches that correspond to sections of pages of the
tutorial. This makes it possible to view the changes introduced in a section
using `git diff <from-branch> <to-branch> <filename>`.

```
$ git diff part-1.2 part-1.3 src/app.rs
```
```diff
diff --git a/src/app.rs b/src/app.rs
index c30622c..3a573b0 100644
--- a/src/app.rs
+++ b/src/app.rs
@@ -1,17 +1,61 @@
 use gridbugs::{
     chargrid::{control_flow::*, prelude::*},
     coord_2d::{Coord, Size},
+    direction::CardinalDirection,
 };

+/// An update to the game state
+enum GameAction {
+    Move(CardinalDirection),
+}
+
+/// Associate game actions with input events
+fn game_action_from_input(input: Input) -> Option<GameAction> {
+    match input {
+        Input::Keyboard(keyboard_input) => {
```

## Code Snippets

When new code is added or existing code is changed, a snippet of code containing
the new code will be shown, including some context to help the reader update the
correct file. Each page is broken up into sections (corresponding to branches in
the reference implementation), and it will be possible to compile the code in
between each section (but not necessarily at all points within a section).

## Get Started

{% local roguelike-tutorial-2022-part-1 | Click here for part 1 of the tutorial. %}
