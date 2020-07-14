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

Let's add some rudimentary AI to NPCs. In order for pathfinding to work, we'll need a way of finding out which areas
of the map can be traversed by an NPC. Add the following to `world.rs`:

{% pygments rust %}
// world.rs
...
impl World {
    ...
    pub fn can_npc_enter_ignoring_other_npcs(&self, coord: Coord) -> bool {
        self.spatial_table
            .layers_at(coord)
            .map(|layers| layers.feature.is_none())
            .unwrap_or(false)
    }
    pub fn can_npc_enter(&self, coord: Coord) -> bool {
        self.spatial_table
            .layers_at(coord)
            .map(|layers| {
                let contains_npc = layers
                    .character
                    .map(|entity| self.components.npc_type.contains(entity))
                    .unwrap_or(false);
                let contains_feature = layers.feature.is_some();
                !(contains_npc || contains_feature)
            })
            .unwrap_or(false)
    }

}
{% endpygments %}

NPCs can enter a cell if it doesn't contain a feature or another NPC. It will also turn out convenient to be able to
check whether an NPC can enter a cell, _ignoring_ the rule about NPCs not being able to walk on top of each other.

To help with pathfinding, expose one more method in `World` that returns the coordinate of an entity:

{% pygments rust %}
// world.rs
impl World {
    ...
    pub fn entity_coord(&self, entity: Entity) -> Option<Coord> {
        self.spatial_table.coord_of(entity)
    }
}
{% endpygments %}

While you're here, remove the `npc_type` method from `World`. We won't be needing it anymore.

To do the heavy lifting of pathfinding, we'll use a library:
{% pygments toml %}
# Cargo.toml
...
[dependencies]
grid_search_cardinal = "0.2"
{% endpygments %}

The general idea for pathfinding is the following: Each time the player moves, populate a grid (called a "distance map") with the distance from
each NPC-traversable cell to the player. On an NPC's turn, it will consider its local region of this grid, and move in the direction
which minimises its distance to the player. Note that an NPC may look further than 1 cell away when deciding which
direction to move, and thus make a decision to step into a cell which increases its distance from the player _on the way to_
a cell which is nearer to the player.

{% image pathfinding.png %}

The diagram above shows a grid where each floor cell is annotated with its distance from the player.
The grey cells are walls, and thus have no distance annotation.
The @ represents the player, and W,X,Y,Z represent NPCs. The red-shaded area is all the traversable
cells within 3 cells of Z. On its turn, Z will move along a path on the way to one of cells which are 2
away from the player. The first step along this path will _increase_ Z's distance from the player (from 3 to 4).

I've written more on the topic of pathfinding on a grid in {% local pathfinding-on-a-grid | a previous post %}.

Make a new file called `behaviour.rs`:
{% pygments rust %}
// behaviour.rs
use crate::world::World;
use coord_2d::{Coord, Size};
use direction::CardinalDirection;
use entity_table::Entity;
use grid_search_cardinal::{
    distance_map::{
        DistanceMap, PopulateContext as DistanceMapPopulateContext,
        SearchContext as DistanceMapSearchContext,
    },
    CanEnter,
};

pub struct BehaviourContext {
    distance_map_to_player: DistanceMap,
    distance_map_populate_context: DistanceMapPopulateContext,
    distance_map_search_context: DistanceMapSearchContext,
}

impl BehaviourContext {
    pub fn new(size: Size) -> Self {
        Self {
            distance_map_to_player: DistanceMap::new(size),
            distance_map_populate_context: DistanceMapPopulateContext::default(),
            distance_map_search_context: DistanceMapSearchContext::new(size),
        }
    }

    pub fn update(&mut self, player: Entity, world: &World) {
        struct NpcCanEnterIgnoringOtherNpcs<'a> {
            world: &'a World,
        }
        impl<'a> CanEnter for NpcCanEnterIgnoringOtherNpcs<'a> {
            fn can_enter(&self, coord: Coord) -> bool {
                self.world.can_npc_enter_ignoring_other_npcs(coord)
            }
        }
        let player_coord = world.entity_coord(player).expect("player has no coord");
        const MAX_APPROACH_DISTANCE: u32 = 20;
        self.distance_map_populate_context.add(player_coord);
        self.distance_map_populate_context.populate_approach(
            &NpcCanEnterIgnoringOtherNpcs { world },
            MAX_APPROACH_DISTANCE,
            &mut self.distance_map_to_player,
        );
    }
}
{% endpygments %}

The `BehaviourContext` type will contain all the re-usable state required for pathfinding.
The field `distance_map_to_player` is the grid which will contain the distance from each cell to the player.
The other 2 fields - `distance_map_populate_context` and `distance_map_search_context` contain re-usable
state for updating the distances in the distance map, and choosing a path through a distance map, respectively.

The `BehaviourContext::update` method updates the distance map such that each cell contains the distance to the player.

Note the `NpcCanEnterIgnoringOtherNpcs` type, which implements the trait `grid_search_cardinal::CanEnter`.
The `grid_search_cardinal` library assumes nothing about the representation of the world, and uses
the `CanEnter` trait to tell it whether a particular cell of the world is traversable.
When populating the distance map, NPC-occupied cells are treated as traversable. This is because all NPCs share
the distance map, and it isn't re-computed each time an NPC moves (only when the player moves).

Also note the `MAX_APPROACH_DISTANCE` constant. We won't populate the entire distance map each time the player moves -
only the area within 20 cells of the player. This is an optimization which limits the time spent populating the distance
map. NPCs more than 20 cells from the player won't be able to approach the player, but this won't really affect gameplay.

Now add the following to `behaviour.rs`:

{% pygments rust %}
// behaviour.rs
...
pub enum NpcAction {
    Wait,
    Move(CardinalDirection),
}

pub struct Agent {}

impl Agent {
    pub fn new() -> Self {
        Self {}
    }

    pub fn act(
        &mut self,
        entity: Entity,
        world: &World,
        behaviour_context: &mut BehaviourContext,
    ) -> NpcAction {
        struct NpcCanEnter<'a> {
            world: &'a World,
        }
        impl<'a> CanEnter for NpcCanEnter<'a> {
            fn can_enter(&self, coord: Coord) -> bool {
                self.world.can_npc_enter(coord)
            }
        }
        let npc_coord = world.entity_coord(entity).expect("npc has no coord");
        const SEARCH_DISTANCE: u32 = 5;
        match behaviour_context.distance_map_search_context.search_first(
            &NpcCanEnter { world },
            npc_coord,
            SEARCH_DISTANCE,
            &behaviour_context.distance_map_to_player,
        ) {
            None => NpcAction::Wait,
            Some(direction) => NpcAction::Move(direction),
        }
    }
}
{% endpygments %}

Start by enumerating all the different actions an NPC can take in `NpcAction`. Define an `Agent` type which will currently be empty.

The method `Agent::act` chooses an action for an NPC to take. Note a second implementation of `CanEnter` here.
Since we're no actually choosing the direction an NPC will walk (if any), it's now necessary to account for the fact
that NPCs can't move through one another, so we should route the current NPC around the other NPCs.
Recall that `World::can_npc_enter` only considers a cell to be traversable if it contains neither a wall, nor an NPC.

The call to `behaviour_context.distance_map_search_context.search_first` chooses a direction for the NPC to move.
It will move in the direction of the first step along a path which will take it to the reachable cell nearest to the
player within `SEARCH_DISTANCE` of the NPC. The lower `SEARCH_DISTANCE`, the less inclined an NPC will be to walk around
other NPCs to reach the player.

Add a `BehaviourContext` to `GameState`, and update `ai_state` to be a `ComponentTable<Agent>` instead of
a `ComponentTable<()>`.

{% pygments rust %}
// game.rs
use crate::behaviour::{Agent, BehaviourContext, NpcAction};
...
pub struct GameState {
    ...
    ai_state: ComponentTable<Agent>,
    behaviour_context: BehaviourContext,
}

impl GameState {
    pub fn new(
        screen_size: Size,
        rng_seed: u64,
        initial_visibility_algorithm: VisibilityAlgorithm,
    ) -> Self {
        ...
        let behaviour_context = BehaviourContext::new(screen_size);
        let mut game_state = Self {
            ...
            behaviour_context,
        };
        ...
    }
    ...
}
{% endpygments %}

Update `GameState::ai_turn` to call `Agent::act` so NPCs actually move on their turns:

{% pygments rust %}
...
impl GameState {
    ...
    fn ai_turn(&mut self) {
        self.behaviour_context
            .update(self.player_entity, &self.world);
        for (entity, agent) in self.ai_state.iter_mut() {
            let npc_action = agent.act(entity, &self.world, &mut self.behaviour_context);
            match npc_action {
                NpcAction::Wait => (),
                NpcAction::Move(direction) => self.world.maybe_move_character(entity, direction),
            }
        }
    }
}
{% endpygments %}

And update `world.rs` to return a `ComponentTable<Agent>` in its `Populate` struct:
{% pygments rust %}
// world
use crate::behaviour::Agent;
...
pub struct Populate {
    pub player_entity: Entity,
    pub ai_state: ComponentTable<Agent>,
}
...
impl GameState {
    pub fn populate<R: Rng>(&mut self, rng: &mut R) -> Populate {
        let mut ai_state = ComponentTable::default();
        for (coord, &terrain_tile) in terrain.enumerate() {
            match terrain_tile {
                ...
                TerrainTile::Npc(npc_type) => {
                    let entity = self.spawn_npc(coord, npc_type);
                    self.spawn_floor(coord);
                    ai_state.insert(entity, Agent::new());
                }
            }
        }
        Populate {
            player_entity: player_entity.unwrap(),
            ai_state,
        }
    }
}
{% endpygments %}

Don't forget to add `mod behaviour;` to `main.rs`:
{% pygments rust %}
...
mod behaviour;
...
{% endpygments %}

Run this with `--debug-omniscient` and observe pathfinding in action.
Since there's still no combat system, expect to find yourself trapped in a corner
surrounded by NPCs!

{% image surrounded.png %}

Reference implementation branch: [part-6.1](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-6.1)

## {% anchor npc-line-of-sight | NPC Line of Sight %}

To make the game more realistic, we'll require that NPCs must be able to see the player in order to move towards them.
Start by adding a method to `World` for testing whether an NPC can see through the cell at a given coordinate.

{% pygments rust %}
// world.rs
...
impl World {
    ...
    pub fn can_npc_see_through_cell(&self, coord: Coord) -> bool {
        self.spatial_table
            .layers_at(coord)
            .map(|layers| layers.feature.is_none())
            .unwrap_or(false)
    }
}
{% endpygments %}

No we could go and run the shadowcast filed-of-view algorithm for each NPC, but that would be expensive.
Instead, we only need to test if the (straight) line segment between each NPC and the player can be traversed
without visiting a cell which the NPC can't see through.

To help talk about lines rasterized onto grids, grab a library:
{% pygments toml %}
# Cargo.toml
[dependencies]
line_2d = "0.4"
{% endpygments %}

Add a function for testing NPC line of sight to `behaviour.rs`:

{% pygments rust %}
// behaviour.rs
...
use line_2d::LineSegment;
use shadowcast::{vision_distance, VisionDistance};
...
fn npc_has_line_of_sight(src: Coord, dst: Coord, world: &World) -> bool {
    const NPC_VISION_DISTANCE_SQUARED: u32 = 100;
    const NPC_VISION_DISTANCE: vision_distance::Circle =
        vision_distance::Circle::new_squared(NPC_VISION_DISTANCE_SQUARED);
    if src == dst {
        return true;
    }
    for coord in LineSegment::new(src, dst).iter() {
        let src_to_coord = coord - src;
        if !NPC_VISION_DISTANCE.in_range(src_to_coord) {
            return false;
        }
        if !world.can_npc_see_through_cell(coord) {
            return false;
        }
    }
    true
}
{% endpygments %}

Add a `player: Entity` argument to `Agent::act`, and then call our new function to test whether the NPC can
see the player. For now, just have the NPC wait on their turn if they can't see the player.

{% pygments rust %}
...
impl Agent {
    ...
    pub fn act(
        &mut self,
        entity: Entity,
        player: Entity,
        world: &World,
        behaviour_context: &mut BehaviourContext,
    ) -> NpcAction {
        ...
        if !npc_has_line_of_sight(npc_coord, player_coord, world) {
            return NpcAction::Wait;
        }
        ...
    }
}
{% endpygments %}

Update the call of `Agent::act` in `game.rs` to pass the player:

{% pygments rust %}
// game.rs
...
impl Game {
    ...
    fn ai_turn(&mut self) {
        self.behaviour_context
            .update(self.player_entity, &self.world);
        for (entity, agent) in self.ai_state.iter_mut() {
            let npc_action = agent.act(
                entity,
                self.player_entity,
                &self.world,
                &mut self.behaviour_context,
            );
            match npc_action {
                NpcAction::Wait => (),
                NpcAction::Move(direction) => self.world.maybe_move_character(entity, direction),
            }
        }
    }
}
{% endpygments %}

Run the game with omniscience and confirm that as soon as there stops being line of sight between
you and an NPC following you, the NPC freezes.

Reference implementation branch: [part-6.2](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-6.2)

## {% anchor npc-memory | NPC Memory %}

Reference implementation branch: [part-6.3](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-6.3)

## {% anchor combat | Combat %}

{% image screenshot-end.png %}

Reference implementation branch: [part-6.4](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-6.4)

{% local roguelike-tutorial-2020-part-7 | Click here for the next part! %}
