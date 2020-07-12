---
layout: series-part
series: roguelike-tutorial-2020
index: 6
date: 2020-07-12 17:00:00 +1000
title: "Part 6 - AI and Combat"
permalink: /roguelike-tutorial-2020-part-6/
og_image: screenshot-end.png
---

In this part we'll imbue NPCs with artificial intelligence, and make it possible
for them to deal and receive damage.

By the end of this part, the game will look like this:

{% image screenshot-end.png %}

<!--more-->

This part is loosely based on [this part](http://rogueliketutorials.com/tutorials/tcod/part-6/) of the
python tcod tutorial.

Reference implementation branch for starting point: [part-5-end](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-5-end)

In this post:
 - [Command-Line Options for Debugging](#command-line-options-for-debugging)
 - [NPC Pathfinding](#npc-pathfinding)
 - [NPC Line of Sight](#npc-line-of-sight)
 - [NPC Memory](#npc-memory)
 - [Combat](#combat)

## {% anchor command-line-options-for-debugging | Command-Line Options for Debugging %}

Before adding AI to the game, let's make it easier to test.
Once NPCs can move on their own, it will be useful to have a way to let NPCs take their turns
without needing to move the player. To this end, we'll add a "wait" command, triggered by the space bar:

{% pygments rust %}
// game.rs
...
impl GameState {
    ...
    pub fn wait_player(&mut self) {
        self.ai_turn();
    }
}
{% endpygments %}

{% pygments rust %}
// app.rs
...
impl AppData {
    ...
    fn handle_input(&mut self, input: Input) {
        match input {
            Input::Keyboard(key) => match key {
                ...
                KeyboardInput::Char(' ') => self.game_state.wait_player(),
                _ => (),
            },
            _ => (),
        }
        ...
    }
}
{% endpygments %}

The dungeon is procedurally generated. If we spot some unexpected behaviour which is dependent on a particular level
layout, it would be useful if we could rerun the game with the same level.
We'll seed the RNG with a randomly-chosen integer, and print this integer out when the game starts.
Then, we'll add a command-line argument that lets us specify and RNG seed to use instead.

We'll add one more command-line argument which tells the game to run in "omniscient mode", where the entire map is
always visible. This will let us investigate the behaviour of NPCs which are out of the player's field of view.

With these 2 changes in place, we'll be able to run the game with:

```
cargo run -- --debug-omniscient
```

...and see:

```
RNG Seed: 820464076793322760
```
...on its standard output (for example). When I run this I get a level that looks like:

{% image screenshot-omniscient.png %}

Now I can rerun the game with the command:
```
cargo run -- --debug-omniscient --rng-seed=820464076793322760
```
...and the level will be the same, as it was generated with the same RNG seed.
This will help debug any issues by reproducing the circumstances under which they arose.

Here's the code for adding both the RNG seed argument, and omniscient mode.

Add a `VisibilityAlgorithm` type, and an argument to `VisibilityGrid::update` for choosing which algorithm to use.
In the `Omniscient` case, just mark every cell as visible.

{% pygments rust %}
// visibility.rs
...
#[derive(Clone, Copy, Debug)]
pub enum VisibilityAlgorithm {
    Shadowcast,
    Omniscient,
}
...
impl VisibilityGrid {
    pub fn update(
        &mut self,
        player_coord: Coord,
        world: &World,
        shadowcast_context: &mut shadowcast::Context<u8>,
        algorithm: VisibilityAlgorithm,
    ) {
        self.count += 1;
        match algorithm {
            VisibilityAlgorithm::Omniscient => {
                for cell in self.grid.iter_mut() {
                    cell.last_seen = self.count;
                }
            }
            VisibilityAlgorithm::Shadowcast => {
                let count = self.count;
                let grid = &mut self.grid;
                shadowcast_context.for_each_visible(
                    player_coord,
                    &Visibility,
                    world,
                    VISION_DISTANCE,
                    255,
                    |coord, _visible_directions, _visibility| {
                        let cell = grid.get_checked_mut(coord);
                        cell.last_seen = count;
                    },
                );
            }
        }
    }
}
{% endpygments %}

Two changes in `game.rs`. Pass the visibility algorithm through to `self.visibility_grid.update`,
and take an `rng_seed` in the constructor, which is used to initialize the `Isaac64Rng` instead
of initializing it with `Isaac64Rng::from_entropy`.

{% pygments rust %}
// game.rs
...
use crate::visibility::{CellVisibility, VisibilityAlgorithm, VisibilityGrid};
...

impl GameState {
    pub fn new(
        screen_size: Size,
        rng_seed: u64,
        initial_visibility_algorithm: VisibilityAlgorithm,
    ) -> Self {
        ...
        let mut rng = Isaac64Rng::seed_from_u64(rng_seed);
        ...
        game_state.update_visibility(initial_visibility_algorithm);
        ...
    }
    ...
    pub fn update_visibility(&mut self, visibility_algorithm: VisibilityAlgorithm) {
        let player_coord = self
            .world
            .spatial_table
            .coord_of(self.player_entity)
            .unwrap();
        self.visibility_grid.update(
            player_coord,
            &self.world,
            &mut self.shadowcast_context,
            visibility_algorithm,
        );
    }
}
{% endpygments %}

In `app.rs`, just pass the new arguments down to `GameState`'s methods, and store the visibility algorithm in a field of `AppData`:

{% pygments rust %}
// app.rs
...
use crate::visibility::{CellVisibility, VisibilityAlgorithm};
...
struct AppData {
    game_state: GameState,
    visibility_algorithm: VisibilityAlgorithm,
}

impl AppData {
    fn new(screen_size: Size, rng_seed: u64, visibility_algorithm: VisibilityAlgorithm) -> Self {
        Self {
            game_state: GameState::new(screen_size, rng_seed, visibility_algorithm),
            visibility_algorithm,
        }
    }
    fn handle_input(&mut self, input: Input) {
        ...
        self.game_state.update_visibility(self.visibility_algorithm);
    }
}
...
impl App {
    pub fn new(
        screen_size: Size,
        rng_seed: u64,
        visibility_algorithm: VisibilityAlgorithm,
    ) -> Self {
        Self {
            data: AppData::new(screen_size, rng_seed, visibility_algorithm),
            view: AppView::new(),
        }
    }
}
...
{% endpygments %}

In order to parse command-line arguments, these examples will use a library called [simon](https://crates.io/crates/simon).
Feel free to use whatever argument-parsing library you're most comfortable with.

{% pygments toml %}
# Cargo.toml
...
[dependencies]
simon = "0.4"
{% endpygments %}

Update `main.rs` to parse command line arguments and pass the visibility algorithm and RNG seed to `App::new`:

{% pygments rust %}
// main.rs
...
use simon::Arg;

...

struct Args {
    rng_seed: u64,
    visibility_algorithm: VisibilityAlgorithm,
}

impl Args {
    fn parser() -> impl Arg<Item = Self> {
        simon::args_map! {
            let {
                rng_seed = simon::opt("r", "rng-seed", "seed for random number generator", "INT")
                    .with_default_lazy(|| rand::thread_rng().gen());
                visibility_algorithm = simon::flag("", "debug-omniscient", "enable omniscience")
                    .map(|omniscient| if omniscient {
                        VisibilityAlgorithm::Omniscient
                    } else {
                        VisibilityAlgorithm::Shadowcast
                    });
            } in {
                Self { rng_seed, visibility_algorithm }
            }
        }
    }
}

fn main() {
    let Args {
        rng_seed,
        visibility_algorithm,
    } = Args::parser().with_help_default().parse_env_or_exit();
    println!("RNG Seed: {}", rng_seed);
    ...
    let app = App::new(screen_size, rng_seed, visibility_algorithm);
    ...
}
{% endpygments %}

If you used the `simon` library for argument parsing, the `with_help_default()` method called above allows you to pass a `--help`
argument to see usage instructions:

```
 $ cargo run -- --help
Usage: target/debug/chargrid-roguelike-tutorial-2020 [options]

Options:
    -r, --rng-seed INT  seed for random number generator
        --debug-omniscient
                        enable omniscience
    -h, --help          print this help menu

```

Reference implementation branch: [part-6.0](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-6.0)

## {% anchor npc-pathfinding | NPC Pathfinding %}

Reference implementation branch: [part-6.1](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-6.1)

## {% anchor npc-line-of-sight | NPC Line of Sight %}

Reference implementation branch: [part-6.2](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-6.2)

## {% anchor npc-memory | NPC Memory %}

Reference implementation branch: [part-6.3](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-6.3)

## {% anchor combat | Combat %}

{% image screenshot-end.png %}

Reference implementation branch: [part-6.4](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-6.4)

{% local roguelike-tutorial-2020-part-7 | Click here for the next part! %}
