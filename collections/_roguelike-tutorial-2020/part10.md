---
layout: series-part
series: roguelike-tutorial-2020
index: 10
date: 2020-08-03 19:00:00 +1000
title: "Part 10 - Saving and Loading"
permalink: /roguelike-tutorial-2020-part-10/
og_image: screenshot-end.png
---

In this part we'll make it possible to save and load games, and add a main menu.

{% image screenshot-end.png %}

This part is loosely based on [this part](http://rogueliketutorials.com/tutorials/tcod/part-10/) of the
python tcod tutorial.

Reference implementation branch for starting point: [part-9-end](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-9-end)

In this post:
 - [Serializing Game State](#serializing-game-state)
 - [Main Menu](#main-menu)
 - [Saving](#saving)
 - [Loading](#loading)

## {% anchor serializing-game-state | Serializing Game State %}

In order to save the game, we must describe a way to convert the `GameState`
type to and from a sequence of bytes which can be stored in a file.
In rust, the typical way to do this is using a crate called [serde](https://crates.io/crates/serde).
It defines traits `Serialize` and `Deserialize`, which can be derived on a type
just like `Clone`, `Copy`, `Debug`, etc.

Many of the crates our game depend on can be configured to use serde to make the types they define
implement `Serialize` and `Deserilaize`. The `GameState` type contains many types imported from
crates. The first step is to configure these crates to allow the types they define to be serialized.
Update the `[dependencies]` section of `Cargo.toml` to look like this:
```toml
# Cargo.toml
...
[dependencies]
chargrid_graphical = "0.2"
chargrid = { version = "0.3", features = ["serialize"] }
coord_2d = { version = "0.2", features = ["serialize"] }
grid_2d = { version = "0.14", features = ["serialize"] }
rgb24 = { version = "0.2", features = ["serialize"] }
direction = { version = "0.17", features = ["rand", "serialize"] }
entity_table = { version = "0.2", features = ["serialize"] }
spatial_table = { version = "0.2", features = ["serialize"] }
rand = "0.7"
rand_isaac = { version = "0.2", features = ["serde1"] }
shadowcast = { version = "0.7", features = ["serialize"] }
simon = "0.4"
grid_search_cardinal = { version = "0.2", features = ["serialize"] }
line_2d = { version = "0.4", features = ["serialize"] }
serde = { version = "1.0", features = ["serde_derive"] }
```
Note the addition of the `serde` crate.
Most existing crates have had a feature enabled which turn on serialization.

Now in `game.rs`, import the `Serialize` and `Deserialize` traits from `serde`:
```rust
// game.rs
...
use serde::{Deserialize, Serialize};
...
```
...and derive them for the `GameState` type:
```rust
#[derive(Serialize, Deserialize)]
pub struct GameState {
    ...
}
```

The derived implementation of (de)serialization will invoke the (de)serialization
methods for each of its fields. Some of its fields won't _have_ (de)serialization
methods yet, so you'll see many errors of the form:
```
the trait `serde::Deserialize<'_>` is not implemented for <type>
```
where `<type>` is a type defined in the game's code.

For each type that produces this error, derive the `Serialize` and `Deserialize` traits.

Reference implementation branch: [part-10.0](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-10.0)

## {% anchor main-menu | Main Menu %}

Now let's add a main menu.

Start by defining the main menu entry, view, select, and decorator types, and a function returning an `EventRoutine`, much as we did
for the inventory menu:

```rust
// app.rs
...
#[derive(Clone, Copy, Debug)]
enum MainMenuEntry {
    NewGame,
    Resume,
    Quit,
}

fn main_menu_instance() -> MenuInstanceChooseOrEscape<MainMenuEntry> {
    use MainMenuEntry::*;
    MenuInstanceBuilder {
        items: vec![Resume, NewGame, Quit],
        hotkeys: Some(hashmap!['r' => Resume, 'n' => NewGame, 'q' => Quit]),
        selected_index: 0,
    }
    .build()
    .unwrap()
    .into_choose_or_escape()
}

#[derive(Default)]
struct MainMenuView {
    mouse_tracker: MenuInstanceMouseTracker,
}

impl MenuIndexFromScreenCoord for MainMenuView {
    fn menu_index_from_screen_coord(&self, len: usize, coord: Coord) -> Option<usize> {
        self.mouse_tracker.menu_index_from_screen_coord(len, coord)
    }
}

impl<'a> View<&'a AppData> for MainMenuView {
    fn view<F: Frame, C: ColModify>(
        &mut self,
        data: &'a AppData,
        context: ViewContext<C>,
        frame: &mut F,
    ) {
        self.mouse_tracker.new_frame(context.offset);
        for (i, &entry, maybe_selected) in data.main_menu.menu_instance().enumerate() {
            let (prefix, style) = if maybe_selected.is_some() {
                (
                    ">",
                    Style::new()
                        .with_foreground(Rgb24::new_grey(255))
                        .with_bold(true),
                )
            } else {
                (" ", Style::new().with_foreground(Rgb24::new_grey(187)))
            };
            let text = match entry {
                MainMenuEntry::Resume => "(r) Resume",
                MainMenuEntry::NewGame => "(n) New Game",
                MainMenuEntry::Quit => "(q) Quit",
            };
            let size = StringViewSingleLine::new(style).view_size(
                format!("{} {}", prefix, text),
                context.add_offset(Coord::new(0, i as i32)),
                frame,
            );
            self.mouse_tracker.on_entry_view_size(size);
        }
    }
}

struct MainMenuSelect;

impl ChooseSelector for MainMenuSelect {
    type ChooseOutput = MenuInstanceChooseOrEscape<MainMenuEntry>;
    fn choose_mut<'a>(&self, input: &'a mut Self::DataInput) -> &'a mut Self::ChooseOutput {
        &mut input.main_menu
    }
}

impl DataSelector for MainMenuSelect {
    type DataInput = AppData;
    type DataOutput = AppData;
    fn data<'a>(&self, input: &'a Self::DataInput) -> &'a Self::DataOutput {
        input
    }
    fn data_mut<'a>(&self, input: &'a mut Self::DataInput) -> &'a mut Self::DataOutput {
        input
    }
}

impl ViewSelector for MainMenuSelect {
    type ViewInput = AppView;
    type ViewOutput = MainMenuView;
    fn view<'a>(&self, input: &'a Self::ViewInput) -> &'a Self::ViewOutput {
        &input.main_menu_view
    }
    fn view_mut<'a>(&self, input: &'a mut Self::ViewInput) -> &'a mut Self::ViewOutput {
        &mut input.main_menu_view
    }
}

struct MainMenuDecorate;

impl Decorate for MainMenuDecorate {
    type View = AppView;
    type Data = AppData;
    fn view<E, F, C>(
        &self,
        data: &Self::Data,
        mut event_routine_view: EventRoutineView<E>,
        context: ViewContext<C>,
        frame: &mut F,
    ) where
        E: EventRoutine<Data = Self::Data, View = Self::View>,
        F: Frame,
        C: ColModify,
    {
        BoundView {
            size: data.game_state.size(),
            view: AlignView {
                alignment: Alignment::centre(),
                view: FillBackgroundView {
                    rgb24: Rgb24::new_grey(0),
                    view: BorderView {
                        style: &BorderStyle {
                            title: None,
                            title_style: Style::new().with_foreground(Rgb24::new_grey(255)),
                            ..Default::default()
                        },
                        view: MinSizeView {
                            size: Size::new(12, 0),
                            view: &mut event_routine_view,
                        },
                    },
                },
            },
        }
        .view(data, context.add_depth(10), frame);
        event_routine_view.view.game_view.view(
            &data.game_state,
            context.compose_col_modify(ColModifyMap(|c: Rgb24| c.saturating_scalar_mul_div(1, 2))),
            frame,
        );
        event_routine_view
            .view
            .render_ui(None, &data, context, frame);
    }
}

fn main_menu() -> impl EventRoutine<
    Return = Result<MainMenuEntry, menu::Escape>,
    Data = AppData,
    View = AppView,
    Event = CommonEvent,
> {
    MenuInstanceRoutine::new(MainMenuSelect)
        .convert_input_to_common_event()
        .decorated(MainMenuDecorate)
}
```

Note the `hashmap!` macro used to specify hotkeys for the main menu.
This is from a crate called `maplit`, which needs to be imported.

```toml
# Cargo.toml
...
[dependencies]
maplit = "1.0"
```

```rust
// app.rs
...
use maplit::hashmap;
...
```

Add the relevant main menu types to `AppData` and `AppView`:
```rust
...
struct AppData {
    ...
    main_menu: MenuInstanceChooseOrEscape<MainMenuEntry>,
}

impl Data {
    fn new(screen_size: Size, rng_seed: u64, visibility_algorithm: VisibilityAlgorithm) -> Self {
        ...
        Self {
            ...
            main_menu: main_menu_instance(),
        }

    }
    ...
}

struct AppView {
    ...
    main_menu_view: MainMenuView,
}

impl AppView {
    fn new(screen_size: Size) -> Self {
        ...
        Self {
            ...
            main_menu_view: MainMenuView::default(),
        }
    }
    ...
}
...
```

At the moment, when the escape key is pressed, the game exits. Let's change it so that the
menu opens instead. There's no longer a need for the `GameReturn::Exit` variant, so remove it.

```rust
enum GameReturn {
    Menu,
    ...
}
...
impl AppData {
    ...
    fn handle_input(&mut self, input: Input) -> Option<GameReturn> {
        match input {
            Input::Keyboard(key) => {
                match key {
                    ...
                    keys::ESCAPE => return Some(GameReturn::Menu),
                    ...
                }
                ...
            }
            ...
        }
        ...
    }
}

```

Handle the `GameReturn::Menu` value in `game_loop`. Have it run the `main_menu()` event routine
and handle the choice from that menu.

```rust
...
fn game_loop() -> impl EventRoutine<Return = (), Data = AppData, View = AppView, Event = CommonEvent>
{
    make_either!(Ei = A | B | C | D | E);
    Loop::new(|| {
        GameEventRoutine.and_then(|game_return| match game_return {
            GameReturn::Menu => Ei::A(main_menu().and_then(|choice| {
                make_either!(Ei = A | B);
                match choice {
                    Err(menu::Escape) => Ei::A(Value::new(None)),
                    Ok(MainMenuEntry::Resume) => Ei::A(Value::new(None)),
                    Ok(MainMenuEntry::Quit) => Ei::A(Value::new(Some(()))),
                    Ok(MainMenuEntry::NewGame) => {
                        Ei::B(SideEffect::new_with_view(|data: &mut AppData, _: &_| {
                            data.new_game();
                            None
                        }))
                    }
                }
            })),
            GameReturn::GameOver => Ei::B(game_over().map(|()| Some(()))),
            GameReturn::UseItem => Ei::C(use_item().map(|_| None)),
            GameReturn::DropItem => Ei::D(drop_item().map(|_| None)),
            GameReturn::Examine => Ei::E(TargetEventRoutine { name: "EXAMINE" }.map(|_| None)),
        })
    })
    .return_on_exit(|_| ())
}
...
```

In the `NewGame` case, we're calling a `.new_game()` method of `AppData` which we've yet to implement.
Implement this now. This will require adding some fields to `AppData`.

```rust
...
struct AppData {
    ...
    game_area_size: Size,
    rng_seed: u64,
}

impl AppData {
    fn new(screen_size: Size, rng_seed: u64, visibility_algorithm: VisibilityAlgorithm) -> Self {
        let game_area_size = screen_size.set_height(screen_size.height() - UI_NUM_ROWS);
        ...
        Self {
            ...
            game_area_size,
            rng_seed,
        }
    }
    fn new_game(&mut self) {
        self.rng_seed = self.rng_seed.wrapping_add(1);
        self.game_state = GameState::new(
            self.game_area_size,
            self.rng_seed,
            self.visibility_algorithm,
        );
    }
    ...
}
...
```

The rng seed is incremented so each time a new game is started, its random number generator is
in a different state, and the level will be generated differently.
Since the rng seed is changing mid-game, rather than being set once at startup, move
the code that prints the rng seed from `main` to `GameState::new`, so if you observe
an error after hitting `New Game` several times, it's still possible to easily reproduce it.

Now that we have the ability to start a new game, change `game_loop` again so that when the player dies,
a new game is started.

```rust
...
fn game_loop() -> impl EventRoutine<Return = (), Data = AppData, View = AppView, Event = CommonEvent>
{
    make_either!(Ei = A | B | C | D | E);
    Loop::new(|| {
        GameEventRoutine.and_then(|game_return| match game_return {
            ...
            GameReturn::GameOver => Ei::B(game_over().and_then(|()| {
                SideEffect::new_with_view(|data: &mut AppData, _: &_| {
                    data.new_game();
                    None
                })
            })),
            ...
        })
    })
    .return_on_exit(|_| ())
}
...
```

{% image menu1.png %}

Reference implementation branch: [part-10.1](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-10.1)

## {% anchor saving | Saving %}

Add the `general_storage_file` crate which will help with storing and retrieving serialized state in a file.
The goal of this crate is to present an abstract view of persistent data, backed by files in a directory.

```toml
# Cargo.toml
...
[dependencies]
general_storage_file = { version = "0.1", features = ["json", "compress"] }
```

Note the `json` and `compress` features. This crate lets you choose between a number of different data serialization
formats, but all are disabled by default and require explicit features to enable. This is because each format
depends on additional crates. We reduce the transitive dependencies of our game by only adding storage
formats which we need.

Now in `app.rs`, start using the crate, and define some constants that will configure how we use the crate.

```rust
// app.rs
...
use general_storage_file::{format, FileStorage, IfDirectoryMissing, Storage};
...
const SAVE_DIR: &str = "save";
const SAVE_FILE: &str = "save";
const SAVE_FORMAT: format::Compress<format::Json> = format::Compress(format::Json);
```

`SAVE_DIR` is the directory in which the save file will be placed. `SAVE_FILE` is the name of the file
which will contain the save game. `SAVE_FORMAT` defines how the game's state will be serialized.
`format::Compress(format::Json)` means create a json string representing the game's state, then
compress that (with gzip). An alternative format, `format::Bincode`
is available with the `bincode` feature flag, which serializes with the [bincode](https://crates.io/crates/bincode)
crate. It's not used here, as it causes programs to crash if the type definitions change between
serializing and deserializing data (which _will_ happen here as we're constantly adding to this game!).
In contrast, the json serializer just returns an error in this situation. Switch to bincode once the
game is finished.

Replace `MainMenu::Quit` with `MainMenu::SaveAndQuit`.
```rust
...
enum MainMenuEntry {
    ...
    SaveAndQuit,
}
...
fn main_menu_instance() -> MenuInstanceChooseOrEscape<MainMenuEntry> {
    use MainMenuEntry::*;
    MenuInstanceBuilder {
        items: vec![Resume, NewGame, SaveAndQuit],
        hotkeys: Some(hashmap!['r' => Resume, 'n' => NewGame, 'q' => SaveAndQuit]),
        selected_index: 0,
    }
    .build()
    .unwrap()
    .into_choose_or_escape()
}
...
impl<'a> View<&'a AppData> for MainMenuView {
    fn view<F: Frame, C: ColModify>(
        &mut self,
        data: &'a AppData,
        context: ViewContext<C>,
        frame: &mut F,
    ) {
        self.mouse_tracker.new_frame(context.offset);
        for (i, &entry, maybe_selected) in data.main_menu.menu_instance().enumerate() {
            ...
            let text = match entry {
                MainMenuEntry::Resume => "(r) Resume",
                MainMenuEntry::NewGame => "(n) New Game",
                MainMenuEntry::SaveAndQuit => "(q) Save and Quit",
            };
            ...
        }
    }
}
...
fn game_loop() -> impl EventRoutine<Return = (), Data = AppData, View = AppView, Event = CommonEvent>
{
    make_either!(Ei = A | B | C | D | E);
    Loop::new(|| {
        GameEventRoutine.and_then(|game_return| match game_return {
            GameReturn::Menu => Ei::A(main_menu().and_then(|choice| {
                make_either!(Ei = A | B | C);
                match choice {
                    ...
                    Ok(MainMenuEntry::SaveAndQuit) => {
                        Ei::C(SideEffect::new_with_view(|data: &mut AppData, _: &_| {
                            Some(())
                        }))
                    }
                    ...
                }
            })),
            ...
        })
    })
    .return_on_exit(|data| data.save_game())
}
...
```

Implement a method for saving the game state to a file.

```rust
...
impl AppData {
    ...
    fn save_game(&self) {
        let mut file_storage = match FileStorage::next_to_exe(SAVE_DIR, IfDirectoryMissing::Create)
        {
            Ok(file_storage) => file_storage,
            Err(error) => {
                eprintln!("Failed to save game: {:?}", error);
                return;
            }
        };
        println!("Saving to {:?}", file_storage.full_path(SAVE_FILE));
        match file_storage.store(SAVE_FILE, &self.game_state, SAVE_FORMAT) {
            Ok(()) => (),
            Err(error) => {
                eprintln!("Failed to save game: {:?}", error);
                return;
            }
        }
    }
    ...
}
...
```

It creates a directory called "save" next to the game's executable, and serializes the game's state
into a file in this directory, also called "save".

Now call this method from `game_loop`, both when `SaveAndQuit` is selected from the main menu, and when
the game is closed.

```rust
...
fn game_loop() -> impl EventRoutine<Return = (), Data = AppData, View = AppView, Event = CommonEvent>
{
    make_either!(Ei = A | B | C | D | E);
    Loop::new(|| {
        GameEventRoutine.and_then(|game_return| match game_return {
            GameReturn::Menu => Ei::A(main_menu().and_then(|choice| {
                make_either!(Ei = A | B | C);
                match choice {
                    ...
                    Ok(MainMenuEntry::SaveAndQuit) => {
                        Ei::C(SideEffect::new_with_view(|data: &mut AppData, _: &_| {
                            data.save_game();
                            Some(())
                        }))
                    }
                    ...
                }
            })),
            ...
        })
    })
    .return_on_exit(|data| data.save_game())
}
...
```

Reference implementation branch: [part-10.2](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-10.2)

## {% anchor loading | Loading %}

Define a method in `AppData` which attempts to deserialize a game state from a file.

```rust
// app.rs
...
impl AppData {
    ...
    fn load_game() -> Option<GameState> {
        let file_storage = match FileStorage::next_to_exe(SAVE_DIR, IfDirectoryMissing::Create) {
            Ok(file_storage) => file_storage,
            Err(error) => {
                eprintln!("Failed to load game: {:?}", error);
                return None;
            }
        };
        if !file_storage.exists(SAVE_FILE) {
            return None;
        }
        println!("Loading from {:?}", file_storage.full_path(SAVE_FILE));
        match file_storage.load(SAVE_FILE, SAVE_FORMAT) {
            Ok(game_state) => Some(game_state),
            Err(error) => {
                eprintln!("Failed to load game: {:?}", error);
                None
            }
        }
    }
    ...
}
...
```

If it fails to deserialize the state, it prints a warning and continues.
This will likely happen from time to time, since the (de)serialization logic is derived from
the structure of the types used in the game. Whenever we change the definition of a type,
the game is no longer able to understand the serialized representation of the old versions
of these types.

Call `load_game` when creating a new `AppData`.
```rust
...
impl AppData {
    fn new(screen_size: Size, rng_seed: u64, visibility_algorithm: VisibilityAlgorithm) -> Self {
        ...
        let game_state = Self::load_game()
            .unwrap_or_else(|| GameState::new(game_area_size, rng_seed, visibility_algorithm));
        ...
    }
}
...
```

Reference implementation branch: [part-10.3](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-10.3)
