---
layout: series-part
series: roguelike-tutorial-2020
index: 1
date: 2020-06-12 20:00:00 +1000
title: "Part 1 - Drawing and Moving the Player"
permalink: /roguelike-tutorial-2020-part-1-test/
og_image: screenshot.png
---


For getting set up for this tutorial, see {% local roguelike-tutorial-2020-part-0 | Part 0 %}.

This part will take you from printing "Hello, World!" to opening a window, drawing a '@' symbol
(representing the player character) and moving the player around with the arrow keys.

By the end of this part, the game will look like this:

{% image screenshot.png %}

<!--more-->

This part is loosely based on [this part](http://rogueliketutorials.com/tutorials/tcod/part-1/) of the
python tcod tutorial.

Reference implementation branch for starting point: [part-0-end](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-0-end)

In this post:

- [Open a Window](#open-a-window)
- [Draw the Player](#draw-the-player)
- [Move the Player](#move-the-player)

## {% anchor open-a-window | Open a Window %}

Start by adding dependencies on `chargrid` and `chargrid_graphical`:

{% pygments toml %}
# Cargo.toml
...
[dependencies]
chargrid_graphical = "0.2"  # graphical frontend for chargrid applications
chargrid = "0.1"            # library for implementing chargrid applications
{% endpygments %}

Now update your main function:

{% pygments rust %}
// src/main.rs

fn main() {
    use chargrid_graphical::{Context, ContextDescriptor, Dimensions, FontBytes};
    const CELL_SIZE_PX: f64 = 24.;
    let context = Context::new(ContextDescriptor {
        font_bytes: FontBytes {
            normal: include_bytes!("./fonts/PxPlus_IBM_CGAthin.ttf").to_vec(),
            bold: include_bytes!("./fonts/PxPlus_IBM_CGA.ttf").to_vec(),
        },
        title: "Chargrid Tutorial".to_string(),
        window_dimensions: Dimensions {
            width: 960.,
            height: 720.,
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
in a window (as we are doing now), a unix terminal, or a web browser. For each of these "frontends",
there is a `Context` type which knows all the frontend-specific details, and knows how to take
an implementation of the `chargrid::app::App` trait (see below) and run it by feeding it input
from the keyboard and mouse, and allowing it to render its output to the screen.

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

This creates an `App` (defined below) which will contain all the state and
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

    fn on_input(
        &mut self,
        input: chargrid::app::Input,
    ) -> Option<chargrid::app::ControlFlow> {
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

## {% anchor draw-the-player | Draw the Player %}

Let's place the player character in the centre of the game area, then render the player.

Start by adding some more dependencies to help represent locations and colours.

{% pygments toml %}
# Cargo.tom
...
[dependencies]
...
coord_2d = "0.2"        # representation of 2D integer coordinates and sizes
rgb24 = "0.2"           # representation of 24-bit colour
{% endpygments %}

{% pygments rust %}
// src/main.rs

use coord_2d::{Coord, Size};
use rgb24::Rgb24;

fn main() {
...
{% endpygments %}

Now we need to add the player's coordinate to the `App` type. We could introduce a new field directly to `App`
containing the coordinate, but we'll do something a little different. Chargrid applications typically define two
top-level types - one for storing the application's _data_, and another representing a _view_ of the application's data.
The data itself doesn't know anything about how it will be rendered to the screen. The view knows how to render the
application's data, and tends to have very little (if any) state of its own. In practice, applications tend to be
made up of several discrete visual elements, each representing some abstract data. It's typical for the data and
view types in a chargrid app to be composed of simpler data and view types representing discrete application components.

The player's location is part of the application's data:
{% pygments rust %}
struct AppData {
    player_coord: Coord,
}

impl AppData {
    fn new(screen_size: Size) -> Self {
        Self {
            player_coord: screen_size.to_coord().unwrap() / 2,
        }
    }
}
{% endpygments %}

Note that `AppData::new` takes the screen size, so it can initialize the player's location to the middle of the game area.

As is common, the app's view has no state, and is just an empty struct:
{% pygments rust %}
struct AppView {}

impl AppView {
    fn new() -> Self {
        Self {}
    }
}
{% endpygments %}

The `App` type now just combines the data and view:
{% pygments rust %}
struct App {
    data: AppData,
    view: AppView,
}

impl App {
    fn new(screen_size: Size) -> Self {
        Self {
            data: AppData::new(screen_size),
            view: AppView::new(),
        }
    }
}
{% endpygments %}

We added an argument to `App::new`, so update the call site in `main` to pass the screen size:

{% pygments rust %}
fn main() {
    ...
    let screen_size = Size::new(40, 30);
    let app = App::new(screen_size);
    context.run_app(app);
}
{% endpygments %}

As mentioned above, the app's view needs to know how to render the app's data. In concrete terms, the type `AppView`
must implement the trait `chargrid::render::View<&AppData>`.

{% pygments rust %}
impl<'a> chargrid::render::View<&'a AppData> for AppView {
    fn view<F: chargrid::app::Frame, C: chargrid::app::ColModify>(
        &mut self,
        data: &'a AppData,
        context: chargrid::app::ViewContext<C>,
        frame: &mut F,
    ) {
        let view_cell = chargrid::render::ViewCell::new()
            .with_character('@')
            .with_foreground(Rgb24::new_grey(255));
        frame.set_cell_relative(data.player_coord, 0, view_cell, context);
    }
}
{% endpygments %}

<style>
.small-images img {
    padding-left: 20px;
    width: 240px;
}
</style>

Lots of new things here:
- `chargrid::app::Frame` represents the visible output of the application. Calling `set_cell_relative` on it draws a character at a position in the window.
- `chargrid::app::ColModify` represents the current colour modifier. In chargrid, views are often hierarchical, and a view may want to indicate that when a child
view says "give that cell a bright-green background", it actually means "give that cell a medium-green background".
This is mainly used to dim the game area while a menu is visible.
<div class="small-images">
{% image slime99-bright.png %} {% image slime99-dark.png %}
</div>
- `chargrid::app::ViewContext` allows a view to tell child views to render at an offset, or with constraints on their size.
It's also the mechanism by which colour modifiers are passed to child views (note the `C: chargrid::app::ColModify` type argument).
- `chargrid::render::ViewCell` is a character with a foreground and background colour, which is possibly bold or underlined. Here
it describes a white '@' sign, which will represent the player in our game.

Now that the view is defined, invoke it in the `on_frame` method to render the game:

{% pygments rust %}
impl chargrid::app::App for App {
    ...
    fn on_frame<F, C>(
        &mut self,
        _since_last_frame: chargrid::app::Duration,
        view_context: chargrid::app::ViewContext<C>,
        frame: &mut F,
    ) -> Option<chargrid::app::ControlFlow>
    where
        F: chargrid::app::Frame,
        C: chargrid::app::ColModify,
    {
        use chargrid::render::View;
        self.view.view(&self.data, view_context, frame);
        None
    }
}
{% endpygments %}

An '@' sign will now be rendered in the centre of the screen:

{% image screenshot.png %}

Reference implementation branch: [part-1.1](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-1.1)

## {% anchor move-the-player | Move the Player %}

To add the most basic of gameplay, begin by adding one more dependency to let us talk about directions:
{% pygments toml %}
# Cargo.tom
...
[dependencies]
...
directions = "0.17"           # representation of directions
{% endpygments %}

This game will only allow movement in cardinal directions (north, south, east, west). Import the corresponding type:

{% pygments rust %}
// src/main.rs
...
use direction::CardinalDirection;

fn main() {
...
{% endpygments %}

Add the screen size to the `AppData` type so we can prevent the player from walking off the screen:

{% pygments rust %}
struct AppData {
    screen_size: Size,
    player_coord: Coord,
}

impl AppData {
    fn new(screen_size: Size) -> Self {
        Self {
            screen_size,
            player_coord: screen_size.to_coord().unwrap() / 2,
        }
    }
    ...
}
{% endpygments %}

Add a helper method to `AppData` for moving the player in a direction:

{% pygments rust %}
impl AppData {
    ...
    fn maybe_move_player(&mut self, direction: CardinalDirection) {
        let new_player_coord = self.player_coord + direction.coord();
        if new_player_coord.is_valid(self.screen_size) {
            self.player_coord = new_player_coord;
        }
    }
}
{% endpygments %}

...and a method for handling input events which calls `maybe_move_player` with the
directions corresponding to each arrow key:
{% pygments rust %}
impl AppData {
    ...
    fn handle_input(&mut self, input: chargrid::input::Input) {
        use chargrid::input::{Input, KeyboardInput};
        match input {
            Input::Keyboard(key) => match key {
                KeyboardInput::Left => self.maybe_move_player(CardinalDirection::West),
                KeyboardInput::Right => self.maybe_move_player(CardinalDirection::East),
                KeyboardInput::Up => self.maybe_move_player(CardinalDirection::North),
                KeyboardInput::Down => self.maybe_move_player(CardinalDirection::South),
                _ => (),
            },
            _ => (),
        }
    }
}
{% endpygments %}

Finally, call `handle_input` from the `on_input` method of `App`'s implementation of `chargrid::app::App`:

{% pygments rust %}
impl chargrid::app::App for App {
    fn on_input(
        &mut self,
        input: chargrid::app::Input,
    ) -> Option<chargrid::app::ControlFlow> {
        use chargrid::input::{keys, Input};
        match input {
            Input::Keyboard(keys::ETX) | Input::Keyboard(keys::ESCAPE) => {
                Some(chargrid::app::ControlFlow::Exit)
            }
            other => {
                self.data.handle_input(other);
                None
            }
        }
    }
    ...
}

{% endpygments %}

That's it! Run the game, press the arrow keys, and the player will move around.

Reference implementation branch: [part-1.2](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-1.2)

{% local roguelike-tutorial-2020-part-2 | Click here for the next part! %}
