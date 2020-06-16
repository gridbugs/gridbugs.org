---
layout: post
title: "Roguelike Tutorial 2020: Part 1 - Drawing and Moving the Player"
date: 2020-06-12 20:00:00 +1000
categories: gamedev roguelikes tutorial
permalink: /roguelike-tutorial-2020-part-1/
excerpt_separator: <!--more-->
future: true
og_image: screenshot.png
---

For getting set up for this tutorial, see {% local roguelike-tutorial-2020-part-0 | Part 0 %}.

This part will take you from printing "Hello, World!" to opening a window, drawing a '@' symbol
(representing the player character) and moving the player around with the arrow keys.

<!--more-->

## Open a Window

Start by adding dependencies on `chargrid` and `chargrid_graphical`:

{% pygments toml %}
[dependencies]
chargrid_graphical = "0.2"  # graphical frontend for chargrid applications
chargrid = "0.1"            # library for implementing chargrid applications
{% endpygments %}

Now update your main function:

{% pygments rust %}
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
{% endpygments %}

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

Once the context has been created with `Context::new`, the remaining two lines in `main` at this stage are:
{% pygments rust %}
let app = App::new();
context.run_app(app);
{% endpygments %}

This creates an `App` - a type which is not yet defined. The `App` type will contain all the state and
logic of the application - a roguelike game in this case. As hinted above, our `App` type will implement
the trait `chargrid::app::App` which will tell chargrid how to run the application. Finally, `context.run_app(app)`
takes the application and, well, runs it, in a graphical context, sending it keyboard and mouse events received by the window,
and drawing the grid of characters to the window.

The `App` type:

{% pygments rust %}
struct App {}

impl App {
    fn new() -> Self {
        Self {}
    }
}
{% endpygments %}

Currently the application has no state or logic, so this is just an empty struct for now.

Implement the `chargrid::app::App` trait:
{% pygments rust %}
impl chargrid::app::App for App {

    fn on_input(&mut self, input: chargrid::app::Input) -> Option<chargrid::app::ControlFlow> {
        use chargrid::input::{keys, Input};
        match input {
            Input::Keyboard(keys::ETX) | Input::Keyboard(keys::ESCAPE) => {
                Some(chargrid::app::ControlFlow::Exit)
            }
            _ => None,
        }
    }

    fn on_frame<F, C>(
        &mut self,
        _since_last_frame: chargrid::app::Duration,
        _view_context: chargrid::app::ViewContext<C>,
        _frame: &mut F,
    ) -> Option<chargrid::app::ControlFlow>
    where
        F: chargrid::app::Frame,
        C: chargrid::app::ColModify,
    {
        None
    }
}
{% endpygments %}

Every chargrid application must implement 2 methods:
- `on_input` is called each time a keyboard or mouse event occurs, and is passed a normalized representation of the event
- `on_frame` is called periodically, right before the context updates the contents of the window

Both methods return an `Option<chargrid::app::ControlFlow>`. A `chargrid::app::ControlFlow` is an `enum` of control flow actions
the application can take. At the time of writing, it can only be used to specify that the application should be terminated.

The application doesn't render anything yet, so `on_frame` does nothing.

Since it's annoying to have a program which opens a window that can't be closed, `on_input` terminates the application
by returning `Some(chargrid::app::ControlFlow::Exit)` when certain keys are pressed. `keys::ESCAPE` corresponds to the
escape key. `keys::ETX` actually corresponds to the user closing the window (e.g. by pressing the 'X' button in its corner).
The name "ETX", and the fact that this event pretends to be a keyboard event, is a remnant from the days when chargrid
applications could only run in unix terminals. When the user presses CTRL-C in a terminal, this manifests as a character
on standard input named "ETX" or "end of text".

This is now a complete chargrid application! Run it with `cargo run` and it will open an empty window:

{% image screenshot-blank.png %}

Reference implementation branch: [part-1.0](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-1.0)

## Draw the Player

{% image screenshot.png %}

Reference implementation branch: [part-1.1](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-1.1)

## Move the Player

Reference implementation branch: [part-1.2](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-1.2)
