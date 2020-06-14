---
layout: post
title: "Roguelike Tutorial 2020: Part 1 - Drawing and Moving the Player"
date: 2020-06-12 20:00:00 +1000
categories: gamedev roguelikes tutorial
permalink: /roguelike-tutorial-2020-part-1/
excerpt_separator: <!--more-->
future: true
---

For getting set up for this tutorial, see {% local roguelike-tutorial-2020-part-0 | Part 0 %}.

This part will take you from printing "Hello, World!" to opening a window, drawing a '@' symbol
(representing the player character) and moving the player around with the arrow keys.

<!--more-->

## Open a Window

Start by adding dependencies on `chargrid` and `chargrid_graphical`:

```toml
# Cargo.toml
...
[dependencies]
chargrid_graphical = "0.2"  # graphical frontend for chargrid applications
chargrid = "0.1"            # library for implementing chargrid applications
```

Now update your main function:

```rust
fn main() {
    use chargrid_graphical::{Context, ContextDescriptor, Dimensions, FontBytes};
    const CELL_SIZE_PX: f64 = 16.;
    let context = Context::new(ContextDescriptor {
        font_bytes: FontBytes {
            normal: include_bytes!("./fonts/PxPlus_IBM_CGAthin.ttf").to_vec(),
            bold: include_bytes!("./fonts/PxPlus_IBM_CGA.ttf").to_vec(),
        },
        title: "Chargrid Tutorial".to_string(),
        window_dimensions: Dimensions {
            width: 960.,
            height: 640.,
        },
        cell_dimensions: Dimensions {
            width: CELL_SIZE_PX,
            height: CELL_SIZE_PX,
        },
        font_dimensions: Dimensions {
            width: CELL_SIZE_PX,
            height: CELL_SIZE_PX,
        },
        font_source_dimensions: Dimensions {
            width: CELL_SIZE_PX as f32,
            height: CELL_SIZE_PX as f32,
        },
        underline_width: 0.1,
        underline_top_offset: 0.8,
    })
    .expect("Failed to initialize graphical context");
    let app = App::new();
    context.run_app(app);
}
```

This creates a new graphical context for running chargrid applications.
Chargrid is designed with the aim of being able to define an application which can run
in a window (as we are doing now), a unix terminal, or a web page. For each of these _frontends_,
there is a `Context` type which knows all the frontend-specific details, and knows how to take
an implementation of the `chargrid::app::App` trait (see below) and run it by feeding it input
from the keyboard and mouse, and allowing it to render its output to the screen.

As its name suggests, chargrid allows you to render a grid of characters, get input from the keyboard
and mouse, and not much else.
The graphical context is configured using a `ContextDescriptor` which specifies the following details
about how to render a grid of characters in a window:
- `font_bytes`: which font to use to render characters
- `title`: title of the window
- `window_dimensions`: size of the window in pixels
- `cell_dimensions`: size of each cell of the grid in pixels
- `font_dimensions`: size to render each character in pixels (usually the same as `cell_dimensions`)
- `font_source_dimensions`: size of each character in the source font in pixels (usually the same as `font_dimensions`)
- `underline_width`: how much of the height of each cell should be taken up by the underline as a proportion of cell height
- `underline_top_offset`: how far from the top of each cell should the underline begin as a proportion of cell height

## Draw the Player

{% image screenshot.png %}

## Move the Player
