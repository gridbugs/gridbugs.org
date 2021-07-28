---
layout: series-part
series: roguelike-tutorial-2020
index: 5
date: 2020-07-02 22:00:00 +1000
title: "Part 5 - Placing NPCs"
permalink: /roguelike-tutorial-2020-part-5/
og_image: screenshot-end.png
---

In this part we'll populate the dungeon with enemies.
There won't be any AI or combat. That will come later.

By the end of this part, the game will look like this:

{% image screenshot-end.png %}

<!--more-->

This part is loosely based on [this part](http://rogueliketutorials.com/tutorials/tcod/part-5/) of the
python tcod tutorial.

Reference implementation branch for starting point: [part-4-end](https://github.com/gridbugs/chargrid-roguelike-tutorial-2020/tree/part-4-end)

In this post:
- [Add NPCs to Game State](#add-npcs-to-game-state)
- [Place NPCs in Rooms](#place-npcs-in-rooms)
- [Basic NPC Interaction](#basic-npc-interaction)

## {% anchor add-npcs-to-game-state | Add NPCs to Game State %}

Start by making it possible to represent the presence of NPCs in the game state.
Add an enum type with variants for each npc type.

```rust
// world.rs
...
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum NpcType {
    Orc,
    Troll,
}

impl NpcType {
    pub fn name(self) -> &'static str {
        match self {
            Self::Orc => "orc",
            Self::Troll => "troll",
        }
    }
}
```

Add a variant to `Tile` so we can render NPCs.
```rust
#[derive(Clone, Copy, Debug)]
pub enum Tile {
    Player,
    Floor,
    Wall,
    Npc(NpcType),
}
```

Add a component so game entities can be marked as NPCs, and track which type of NPC an entity is:
```rust
entity_table::declare_entity_module! {
    components {
        tile: Tile,
        npc_type: NpcType,
    }
}
```

Add a method to `World` for spawning a new NPC.
```rust
impl World {
    ...
    fn spawn_npc(&mut self, coord: Coord, npc_type: NpcType) -> Entity {
        let entity = self.entity_allocator.alloc();
        self.spatial_table
            .update(
                entity,
                Location {
                    coord,
                    layer: Some(Layer::Character),
                },
            )
            .unwrap();
        self.components.tile.insert(entity, Tile::Npc(npc_type));
        self.components.npc_type.insert(entity, npc_type);
        entity
    }
    ...
}
```

In `terrain.rs` add a `TerrainTile` variant so we can add NPCs during dungeon generation.
```rust
// terrain.rs
use crate::world::NpcType;
...
pub enum TerrainTile {
    Player,
    Floor,
    Wall,
    Npc(NpcType),
}
```

And back in `world.rs`, handle the `TerrainTile::Npc` case inside `World::populate`.
```rust
// world.rs
impl World {
    pub fn populate<R: Rng>(&mut self, rng: &mut R) -> Populate {
        ...
        for (coord, &terrain_tile) in terrain.enumerate() {
            match terrain_tile {
                ...
                TerrainTile::Npc(npc_type) => {
                    let entity = self.spawn_npc(coord, npc_type);
                    self.spawn_floor(coord);
                    ai_state.insert(entity, ());
                }
            }
        }
        ...
    }

}
```

In the rendering logic inside `app.rs`, handle the case for `Tile::Npc`:
```rust
// app.rs
...
fn currently_visible_view_cell_of_tile(tile: Tile) -> ViewCell {
    match tile {
        ...
        Tile::Npc(NpcType::Orc) => ViewCell::new()
            .with_character('o')
            .with_bold(true)
            .with_foreground(Rgb24::new(0, 187, 0)),
        Tile::Npc(NpcType::Troll) => ViewCell::new()
            .with_character('T')
            .with_bold(true)
            .with_foreground(Rgb24::new(187, 0, 0)),
    }
}

fn previously_visible_view_cell_of_tile(tile: Tile) -> ViewCell {
    match tile {
        ...
        Tile::Npc(NpcType::Orc) => ViewCell::new()
            .with_character('o')
            .with_bold(true)
            .with_foreground(Rgb24::new_grey(63)),
        Tile::Npc(NpcType::Troll) => ViewCell::new()
            .with_character('T')
            .with_bold(true)
            .with_foreground(Rgb24::new_grey(63)),
    }
}
```

The game engine can now represent NPCs, but we aren't adding any NPCs to the generated dungeon yet.

Reference implementation branch: [part-5.0](https://github.com/gridbugs/chargrid-roguelike-tutorial-2020/tree/part-5.0)

## {% anchor place-npcs-in-rooms | Place NPCs in Rooms %}

Start by adding a function that populates a room with NPCs.
Each time an NPC is placed, there'll be an 80% chance of placing an orc, and a 20% chance of placing a troll.
We'll need some more traits from the `rand` library to be in scope.

```rust
// terrain.rs
use rand::{seq::IteratorRandom, seq::SliceRandom, Rng};
```

Now for the method that populates a room with NPCs.
It's expected that this method is called _after_ the player character has been added.
It first enumerates all the coordinates of cells in the room which contain floor tiles,
then randomly selects `n` of them to replace with NPC tiles.
```rust
impl Room {
    ...
    // Place `n` randomly chosen NPCs at random positions within the room
    fn place_npcs<R: Rng>(&self, n: usize, grid: &mut Grid<Option<TerrainTile>>, rng: &mut R) {
        for coord in self
            .coords()
            .filter(|&coord| grid.get_checked(coord).unwrap() == TerrainTile::Floor)
            .choose_multiple(rng, n)
        {
            let npc_type = if rng.gen_range(0..100) < 80 {
                NpcType::Orc
            } else {
                NpcType::Troll
            };
            *grid.get_checked_mut(coord) = Some(TerrainTile::Npc(npc_type));
        }
    }
}
```

Now update `generate_dungeon` to call `place_npcs` on each room.
Use an array to control the probability distribution of NPCs per room.

```rust
pub fn generate_dungeon<R: Rng>(size: Size, rng: &mut R) -> Grid<TerrainTile> {
    let mut grid = Grid::new_copy(size, None);
    let mut room_centres = Vec::new();

    const NPCS_PER_ROOM_DISTRIBUTION: &[usize] =
        &[0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 3, 3, 4];

    // Attempt to add a room a constant number of times
    const NUM_ATTEMPTS: usize = 100;
    for _ in 0..NUM_ATTEMPTS {
        // Make a random room
        let room = Room::choose(size, rng);

        // Carve out the room unless it overlaps with an existing room
        if room.only_intersects_empty(&grid) {
            room.carve_out(&mut grid);

            let room_centre = room.centre();

            // Add the player to the centre of the room if it's the first room
            if room_centres.is_empty() {
                *grid.get_checked_mut(room_centre) = Some(TerrainTile::Player);
            }

            // Build up a list of all room centres for use in constructing corridors
            room_centres.push(room_centre);

            // Add npcs to the room
            let &num_npcs = NPCS_PER_ROOM_DISTRIBUTION.choose(rng).unwrap();
            room.place_npcs(num_npcs, &mut grid, rng);
        }
    }

    // Add corridors connecting every adjacent pair of room centres
    for window in room_centres.windows(2) {
        carve_corridor(window[0], window[1], &mut grid);
    }

    grid.map(|t| t.unwrap_or(TerrainTile::Wall))
}
```

Run this, and you'll find yourself in a populated dungeon!

{% image screenshot-end.png %}

Reference implementation branch: [part-5.1](https://github.com/gridbugs/chargrid-roguelike-tutorial-2020/tree/part-5.1)

## {% anchor basic-npc-interaction | Basic NPC Interaction %}

We're not quite done yet. Let's add a basic level of interactivity - printing a message
each time the player bumps into an NPC, and placeholder logic for NPC AI.

Update `World::maybe_move_character` to print a message when the player bumps into a character.

```rust
// world.rs
impl World {
    ...
    pub fn maybe_move_character(&mut self, character_entity: Entity, direction: CardinalDirection) {
        let player_coord = self
            .spatial_table
            .coord_of(character_entity)
            .expect("player has no coord");
        let new_player_coord = player_coord + direction.coord();
        if new_player_coord.is_valid(self.spatial_table.grid_size()) {
            let dest_layers = self.spatial_table.layers_at_checked(new_player_coord);
            if let Some(character) = dest_layers.character {
                if let Some(npc_type) = self.components.npc_type.get(character) {
                    println!("You harmlessly bump into the {}.", npc_type.name());
                }
            } else if dest_layers.feature.is_none() {
                self.spatial_table
                    .update_coord(character_entity, new_player_coord)
                    .unwrap();
            }
        }
    }
    ...
}
```

Run the game and walk into an orc. The game will print "You harmlessly bump into the orc."
For now this will just go to the program's standard output (the terminal).
In a later part we'll add a message log to the game's UI.

Now to set the scene for AI. Add a `ComponentTable` directly to `GameState` for mapping each NPC's
entity to its AI state (currently the AI state will just be a `()`).

```rust
// game.rs
...
use entity_table::ComponentTable;
...
pub struct GameState {
    world: World,
    player_entity: Entity,
    shadowcast_context: shadowcast::Context<u8>,
    visibility_grid: VisibilityGrid,
    ai_state: ComponentTable<()>,
}
```

Why add `ai_state` to `GameState` and not to the `Components` struct in `world.rs`?
When the NPCs take their turn, we'll iterate over the AI state of each entity,
taking a mutable reference to each one in turn. The NPC will make a decision of which
action to take based on its AI state, and the current state of the world.
If `ai_state` was part of `world`, taking a mutable reference to `ai_state` would
borrow the `world`, and we wouldn't be able to query the rest of world when deciding what
action an NPC will take.

To initialise `ai_state`, have the `World::populate` method create a `ComponentTable<()>`
with an entry for each NPC it creates:

```rust
// world.rs
...
use entity_table::{ComponentTable, Entity, EntityAllocator};
...
pub struct Populate {
    pub player_entity: Entity,
    pub ai_state: ComponentTable<()>,
}
...
impl World {
    ...
    pub fn populate<R: Rng>(&mut self, rng: &mut R) -> Populate {
        let terrain = terrain::generate_dungeon(self.spatial_table.grid_size(), rng);
        let mut player_entity = None;
        let mut ai_state = ComponentTable::default();
        for (coord, &terrain_tile) in terrain.enumerate() {
            match terrain_tile {
                ...
                TerrainTile::Npc(npc_type) => {
                    let entity = self.spawn_npc(coord, npc_type);
                    self.spawn_floor(coord);
                    ai_state.insert(entity, ());
                }
            }
        }
        Populate {
            player_entity: player_entity.unwrap(),
            ai_state,
        }
    }
    ...
}
```

When constructing a new `GameState`, initialize the `ai_state` field with the corresponding
field of `Populate`.
```rust
// game.rs
...
impl GameState {
    pub fn new(screen_size: Size) -> Self {
        ...
        let Populate {
            player_entity,
            ai_state,
        } = world.populate(&mut rng);
        ...
        let mut game_state = Self {
            world,
            player_entity,
            shadowcast_context,
            visibility_grid,
            ai_state,
        };
        ...
    }
}
```

Now add a new method to `GameState` called `ai_turn` which iterates over all the entries
in `ai_state` and prints a message. Later on we'll replace this with having the AI
choose an action for the NPC to take.

```rust
...
impl GameState {
    ...
    pub fn maybe_move_player(&mut self, direction: CardinalDirection) {
        self.world
            .maybe_move_character(self.player_entity, direction);
        self.ai_turn();
    }
    ...
    fn ai_turn(&mut self) {
        for (entity, ()) in self.ai_state.iter_mut() {
            let npc_type = self.world.npc_type(entity).unwrap();
            println!("The {} ponders its existence.", npc_type.name());
        }
    }
}
```

Now that the basic framework for AI is set up, it will be easier to add AI in a future part.

Reference implementation branch: [part-5.2](https://github.com/gridbugs/chargrid-roguelike-tutorial-2020/tree/part-5.2)

{% local roguelike-tutorial-2020-part-6 | Click here for the next part! %}
