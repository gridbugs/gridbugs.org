---
layout: series-part
series: roguelike-tutorial-2022
index: 1
date: 2022-09-09 21:10:11 +0200
title: "Part 1 - Drawing and Moving the Player"
permalink: /roguelike-tutorial-2022-part-1/
og_image: 2.png
---

For getting set up for this tutorial, see {% local roguelike-tutorial-2022-part-0 | Part 0 %}.

Here we will initialize the chargrid library, open a window, and drawing an '@'
symbol controlled by the arrow keys.

The starting point for this chapter is branch
[part-1.0](https://github.com/gridbugs/gridbugs-roguelike-tutorial-2022/tree/part-1.0).

## Chargrid Hello World

Open a graphical window containing the text "Hello, World!".
The reference implementation for this section is
[part-1.1](https://github.com/gridbugs/gridbugs-roguelike-tutorial-2022/tree/part-1.1).

### Dependencies
Let's open a window and display a "Hello, World!" message.
Add some dependencies:
```toml
# Cargo.toml
...
[dependencies.gridbugs]
version = "0.5"
features = [
    "chargrid", # library for rendering text and handling inputs
    "chargrid_wgpu", # frontend for chargrid that runs in a graphical window
]
```

### Fonts!
We'll be using the WGPU frontend to chargrid which uses [WebGPU](https://en.wikipedia.org/wiki/WebGPU)
to render text into a graphical window. In order to display text, we need a
font! Choose your favourite truetype font, and place font files for normal
and bold text in src/fonts. For this tutorial I'll use
[this IBM bios font](https://int10h.org/oldschool-pc-fonts/fontlist/font?ibm_bios).
You can download the normal and bold ttf files for this font here:
 - [PxPlus_IBM_CGA.ttf](https://github.com/gridbugs/gridbugs-roguelike-tutorial-2022/raw/main/src/fonts/PxPlus_IBM_CGA.ttf)
 - [PxPlus_IBM_CGAthin.ttf](https://github.com/gridbugs/gridbugs-roguelike-tutorial-2022/raw/main/src/fonts/PxPlus_IBM_CGAthin.ttf)

To make the fonts accessible to our code, place them in src/fonts, e.g.:
```
$ tree src/
src/
├── fonts
│   ├── PxPlus_IBM_CGA.ttf
│   └── PxPlus_IBM_CGAthin.ttf
└── main.rs
```

### Open a Window

To open a window, we need to configure a WGPU context, specifying the window's
size, what font to use, and some other properties.

```rust
// main.rs
use gridbugs::{chargrid::control_flow::*, chargrid_wgpu};

// Create a context for running chargrid apps in a WGPU graphical window
fn wgpu_context() -> chargrid_wgpu::Context {
    use chargrid_wgpu::*;
    const CELL_SIZE_PX: f64 = 16.;
    Context::new(Config {
        font_bytes: FontBytes {
            normal: include_bytes!("./fonts/PxPlus_IBM_CGAthin.ttf").to_vec(),
            bold: include_bytes!("./fonts/PxPlus_IBM_CGA.ttf").to_vec(),
        },
        title: "Gridbugs Roguelike Tutorial".to_string(),
        window_dimensions_px: Dimensions {
            width: 960.,
            height: 720.,
        },
        cell_dimensions_px: Dimensions {
            width: CELL_SIZE_PX,
            height: CELL_SIZE_PX,
        },
        font_scale: Dimensions {
            width: CELL_SIZE_PX,
            height: CELL_SIZE_PX,
        },
        underline_width_cell_ratio: 0.1,
        underline_top_offset_cell_ratio: 0.8,
        resizable: false,
        force_secondary_adapter: false,
    })
}

// A chargrid app which does nothing
fn app() -> App {
    unit().ignore_output()
}

fn main() {
    // Create the WGPU chargrid context and run the app
    let context = wgpu_context();
    context.run(app());
}
```

You should be able to run this with `cargo run` and it will display a black
window. The close button won't work yet, so exit the program with Ctrl+C.

### Hello, World!

Replace the `app` function with this:

```rust
// A placeholder chargrid app that displays the text "Hello, World!"
fn app() -> App {
    // Create a component which ignores its input and renders a string.
    styled_string("Hello, World!".to_string(), Default::default())
        .centre() // Display the text in the centre of the window.
        .ignore_output() // Coerce the component's output type to `app::Output`.
        .exit_on_close() // Terminate the program when the window is closed.
        .catch_escape() // Intercept the escape key so we can terminate on escape.
        .map(|res| match res {
            // Terminate the program when the escape key is pressed.
            Ok(app::Exit) | Err(Escape) => app::Exit,
        })
}
```

The `gridbugs::chargrid::control_flow` module defines a declarative language
embedded in rust for describing interactive tick-based programs which can be
rendered. The methods chained onto `styled_string(...)` are an example of this
language. Using this language will often prove more convenient than programming
on the level of individual ticks, though this is also possible in chargrid as
we'll see in the next section.

## Draw the Player Character

A simple representation of the player character which can be rendered
as the infamous '@' symbol.
The reference implementation for this section is
[part-1.2](https://github.com/gridbugs/gridbugs-roguelike-tutorial-2022/tree/part-1.2).

Move the `app` function into a new file app.rs, and refer to it from main.rs.
This will help keep the code organised as the application grows.

```rust
// app.rs
use gridbugs::chargrid::control_flow::*;

pub fn app() -> App {
    ...
}
```

```rust
// main.rs
use gridbugs::chargrid_wgpu;

mod app;

...

fn main() {
    // Create the WGPU chargrid context and run the app
    let context = wgpu_context();
    context.run(app::app());
}
```

To represent the position of the player character we'll use the module
`gridbugs::coord_2d`. Add the corresponding feature to Cargo.toml:
```toml
# Cargo.toml
...
[dependencies.gridbugs]
version = "0.5"
features = [
    "chargrid",
    "chargrid_wgpu",
    "coord_2d",
]
```

Now, add a type to app.rs representing the game's state. Note that we're now
importing the types `Coord` and `Size` from the `gridbugs::coord_2d` module,
as well as the contents of `gridbugs::chargrid::prelude`.

```rust
// app.rs
use gridbugs::{
    chargrid::{control_flow::*, prelude::*},
    coord_2d::{Coord, Size},
};

// The state of the game
struct GameData {
    player_coord: Coord,
}

impl GameData {
    fn new(screen_size: Size) -> Self {
        // The player starts in the centre of the screen
        let player_coord = screen_size.to_coord().unwrap() / 2;
        Self { player_coord }
    }
}
...
```
Now to render the player character, we'll implement the `Component` trait from
`gridbugs::chargrid::prelude` for a new type `GameComponent`. This is the
typical way one implements tick-based logic in chargrid.

```rust
// app.rs
...
// A named unit type representing the renderable, interactive  game area
struct GameComponent;

impl Component for GameComponent {
    type Output = ();
    type State = GameData;

    fn render(&self, state: &Self::State, ctx: Ctx, fb: &mut FrameBuffer) {
        // The player will be represented with a bold '@' sign
        let render_cell_player = RenderCell::BLANK.with_character('@').with_bold(true);

        // Draw the player character to the frame buffer relative to the current context, which
        // allows this component to be nested inside other components.
        fb.set_cell_relative_to_ctx(ctx, state.player_coord, 0, render_cell_player);
    }

    fn update(&mut self, _state: &mut Self::State, _ctx: Ctx, _event: Event) -> Self::Output {
        // TODO: Update the game state when input is received
    }

    fn size(&self, _state: &Self::State, ctx: Ctx) -> Size {
        // The game will take up the entire window
        ctx.bounding_box.size()
    }
}
...
```

This is our first encounter with the `Component` trait which is at the core of
chargrid. Read its documentation
[here](https://docs.rs/chargrid_core/latest/chargrid_core/trait.Component.html).
The key takeaway from this section is that this component knows how to render a
`GameData` each frame, and knows how to update a `GameData` in response to an
input event.

To complete this section, we need to instantiate the `GameData`, and associate
it with a `GameComponent` inside the `app` function. Replace the `app` function
with:
```rust
// app.rs
...
pub fn app() -> App {
    // Instantiate the game state
    let screen_size = Size::new(60, 45);
    let game_data = GameData::new(screen_size);
    cf(GameComponent)
        .ignore_output() // Coerce the component's output type to `app::Output`.
        .with_state(game_data) // Associate the game state with the component.
        .exit_on_close() // Exit the program when its window is closed.
        .catch_escape() // Catch the escape event so we can exit on escape.
        .map(|res| match res {
            Err(Escape) => app::Exit, // Exit the program when escape is pressed.
            Ok(output) => output,     // Other outputs are simply returned.
        })
}
```

Now when you run the program, a single `@` sign will be drawn in the centre of
its window.

{% image 2.png %}

## Move the Player Character

Move the character around the screen with the arrow keys.
The reference implementation for this section is
[part-1.3](https://github.com/gridbugs/gridbugs-roguelike-tutorial-2022/tree/part-1.3).

Start by adding the "direction" feature to Cargo.toml to get access to
`gridbugs::direction` which will be useful for implementing movement:
```toml
# Cargo.toml
...
[dependencies.gridbugs]
version = "0.5"
features = [
    "chargrid",
    "chargrid_wgpu",
    "coord_2d",
    "direction",
]
```
Import the `CardinalDirection` type:
```rust
// app.rs
use gridbugs::{
    chargrid::{control_flow::*, prelude::*},
    coord_2d::{Coord, Size},
    direction::CardinalDirection,
};
...
```
The `CardinalDirection` type is simply:
```rust
pub enum CardinalDirection {
    North,
    East,
    South,
    West,
}
```
...with some convenience methods.

Define a type representing actions that the player can take. At first this will
just be moving in cardinal directions.
```rust
// app.rs
...
// An update to the game state
enum GameAction {
    Move(CardinalDirection),
}
...
```
Add a function for parsing `GameAction` from input events:
```rust
// app.rs
...
// Associate game actions with input events
fn game_action_from_input(input: Input) -> Option<GameAction> {
    match input {
        Input::Keyboard(keyboard_input) => {
            use CardinalDirection::*;
            use GameAction::*;
            match keyboard_input {
                KeyboardInput::Left => Some(Move(West)),
                KeyboardInput::Right => Some(Move(East)),
                KeyboardInput::Up => Some(Move(North)),
                KeyboardInput::Down => Some(Move(South)),
                _ => None,
            }
        }
        _ => None,
    }
}
...
```

Add the game screen size to `GameData` so we can prevent the player from walking
off the screen.
```rust
// app.rs
...
// The state of the game
struct GameData {
    player_coord: Coord,
    screen_size: Size,
}

impl GameData {
    fn new(screen_size: Size) -> Self {
        // The player starts in the centre of the screen
        let player_coord = screen_size.to_coord().unwrap() / 2;
        Self {
            player_coord,
            screen_size,
        }
    }
}
...
```

Add methods to `GameData` for moving the player and updating the game state in
response to a general `GameAction` (which currently is just moving the player).

```rust
// app.rs
...
impl GameData {
    ...

    // Move the player character one cell in the given direction
    fn move_player(&mut self, direction: CardinalDirection) {
        let new_player_coord = self.player_coord + direction.coord();
        // Don't let the player walk off the screen
        if new_player_coord.is_valid(self.screen_size) {
            self.player_coord = new_player_coord;
        }
    }

    // Update the game state by applying a game action
    fn handle_game_action(&mut self, game_action: GameAction) {
        match game_action {
            GameAction::Move(direction) => self.move_player(direction),
        }
    }
}
...
```
Update `GameComponent`'s implementation of `Component` so its `update` method
updates the game state:
```rust
// app.rs
...
impl Component for GameComponent {
    ...
    fn update(&mut self, state: &mut Self::State, _ctx: Ctx, event: Event) -> Self::Output {
        if let Event::Input(input) = event {
            if let Some(game_action) = game_action_from_input(input) {
                state.handle_game_action(game_action);
            }
        }
    }
    ...
}
...
```

You should now be able to run the program and press the arrow keys, however
you'll see something like this:

{% image 3-oops.png %}

The problem is that the screen isn't being cleared in between each frame, so
it's just drawing the '@' sign over the previously rendered frame. Tell chargrid
to clear the screen before each frame with the `clear_each_frame` method:
```rust
// app.rs
...
pub fn app() -> App {
    // Instantiate the game state
    let screen_size = Size::new(60, 45);
    let game_data = GameData::new(screen_size);
    cf(GameComponent)
        .ignore_output() // Coerce the component's output type to `app::Output`.
        .with_state(game_data) // Associate the game state with the component.
        .exit_on_close() // Exit the program when its window is closed.
        .catch_escape() // Catch the escape event so we can exit on escape.
        .map(|res| match res {
            Err(Escape) => app::Exit, // Exit the program when escape is pressed.
            Ok(output) => output,     // Other outputs are simply returned.
        })
        .clear_each_frame()
}
```

## Run the Program in a Terminal

As a fun bonus, let's make it so that the game can run in a terminal!
The reference implementation for this section is
[part-1.4](https://github.com/gridbugs/gridbugs-roguelike-tutorial-2022/tree/part-1.4).

We'll set it up so that the program can be run with the `--terminal` flag to
indicate that it should run in a terminal instead of a graphical window. Add a
dependency to handle parsing command line arguments. We'll also now need to
depend on the terminal frontend for chargrid, which will require the
"chargrid_ansi_terminal" feature of the gridbugs package.
```toml
# Cargo.toml
...
[dependencies.gridbugs]
version = "0.5"
features = [
    "chargrid",
    "chargrid_wgpu",
    "chargrid_ansi_terminal",
    "coord_2d",
    "direction",
]

[dependencies]
meap = "0.5"
```

Add a type representing the command line arguments and a method for parsing the
command line arguments:
```rust
// main.rs
...
// Command-line arguments
struct Args {
    terminal: bool,
}

impl Args {
    pub fn parser() -> impl meap::Parser<Item = Self> {
        meap::let_map! {
            let {
                terminal = flag("terminal").desc("run in a terminal");
            } in {
                Self { terminal }
            }
        }
    }
}
```
Replace the `main` function with the following, which parses command line
arguments from the environment and then starts the app in the appropriate
context based on whether the `--terimnal` argument was given.
```rust
// main.rs
...
fn main() {
    use meap::Parser;
    let Args { terminal } = Args::parser().with_help_default().parse_env_or_exit();
    let app = app::app();
    if terminal {
        // Run the app in an ANSI terminal chargrid context
        use chargrid_ansi_terminal::{Context, FromTermInfoRgb};
        let context = Context::new().expect("Failed to initialize terminal");
        let colour = FromTermInfoRgb; // Use 256-colour encoding
        context.run(app, colour);
    } else {
        // Run the app in a WGPU chargrid context
        let context = wgpu_context();
        context.run(app);
    }
}
```

Run the game in a terminal with the command:
```
cargo run -- --terminal
```
{% image 4.png %}

The terminal mode of the game will continue to work as we add more features
without us needing to do any additional work.
