---
layout: series-part
series: roguelike-tutorial-2022
index: 2
date: 2022-12-25 19:39:00 +0200
title: "Part 2 - Generic Entities, Walls, Doors, Floor"
permalink: /roguelike-tutorial-2022-part-2/
og_image: screenshot.png
---

In this section we'll add a system for managing generic entities and use it to
represent walls, floor, and doors.

By the end of this chapter the game will look like this:
{% image screenshot.png %}

The starting point for this chapter is branch
[part-2.0](https://github.com/gridbugs/gridbugs-roguelike-tutorial-2022/tree/part-2.0).

## Generic Entities

In the previous chapter the player's position was stored directly in a field of
the game state. As the game grows in complexity, it will be convenient to store
game data in a more structured form. This section introduces a simple database
for storing game entities which we'll build on in future sections to add more
types of entity besides the player.

The reference implementation for this section is
[part-2.1](https://github.com/gridbugs/gridbugs-roguelike-tutorial-2022/tree/part-2.1).

Start by adding the "entity_data" feature of the `gridbugs` crate:
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
    "entity_table",
]
...
```

Make a new file game.rs to store the logic specific to the game. In this section
we'll be re-implementing the logic for moving and rendering the player in a
way which represents the player as a generic entity.

Start by defining a `Tile` type which will represent the different tiles that
can be rendered. Then use the `entity_table::declare_entity_module!` macro to
define a type for storing entity data. Each field of the resulting
`components::Components` type will be a `ComponentTable<_>`, which is documented
here
[here](https://docs.rs/entity_table/latest/entity_table/struct.ComponentTable.html).

```rust
// game.rs
use gridbugs::{
    coord_2d::{Coord, Size},
    direction::CardinalDirection,
    entity_table::{self, Entity, EntityAllocator},
};

#[derive(Clone, Copy, Debug)]
pub enum Tile {
    Player,
}

// Generates the type for a database storing entities. Each field is a table which maps an `Entity`
// (just a unique identifier) to a component value.
// E.g.
// struct Components {
//   coord: ComponentTable<Coord>,
//   tile: ComponentTable<Tile>,
//   ...
// }
// A `ComponentTable<T>` maps entities to values of type `T`.
entity_table::declare_entity_module! {
    components {
        coord: Coord,
        tile: Tile,
    }
}
use components::Components;
...
```

Add the newly created `game` module to main.rs:
```rust
// main.rs
...
mod game;
...
```

Add a type representing the state of the game world, and give it a method to add
the player character.
```rust
// game.rs
...
// The state of the game's world
#[derive(Default)]
pub struct World {
    components: Components, // the components of each entity in the world
    entity_allocator: EntityAllocator, // used to allocate new entities
}

impl World {
    // Add a new entity representing the player character at the given coord
    pub fn spawn_player(&mut self, coord: Coord) -> Entity {
        let entity = self.entity_allocator.alloc();
        self.components.coord.insert(entity, coord);
        self.components.tile.insert(entity, Tile::Player);
        entity
    }
}
...
```
Add a type to represent the game state.
```rust
// game.rs
...
// The state of the game
pub struct Game {
    world: World,
    player_entity: Entity,
    world_size: Size,
}

impl Game {
    pub fn new(world_size: Size) -> Self {
        let mut world = World::default();
        let centre = world_size.to_coord().unwrap() / 2;
        // The player starts in the centre of the screen
        let player_entity = world.spawn_player(centre);
        Self {
            world,
            player_entity,
            world_size,
        }
    }
    ...
}
```
Implement methods on `Game` for moving the player character. These will look
like the equivalent methods from the previous chapter, but rather than storing
the player's position in a field, it's stored in a component.

```rust
// game.rs
...

impl Game {
    ...

    // Returns the coordinate of the player character
    fn get_player_coord(&self) -> Coord {
        *self
            .world
            .components
            .coord
            .get(self.player_entity)
            .expect("player does not have coord")
    }

    // Move the player character one cell in the given direction
    pub fn move_player(&mut self, direction: CardinalDirection) {
        let player_coord = self.get_player_coord();
        let new_player_coord = player_coord + direction.coord();
        // Don't let the player walk off the screen
        if new_player_coord.is_valid(self.world_size) {
            self.world
                .components
                .coord
                .insert(self.player_entity, new_player_coord);
        }
    }
}
```

In order to render entities we need to expose a method which returns the
relevant components of all renderable entities. Add a type that stores the
information required to render a single entity: its position and its tile.
```rust
// game.rs
...
// Information needed to render an entity
pub struct EntityToRender {
    pub coord: Coord,
    pub tile: Tile,
}
...
```
Now add a method to `Game` which returns an iterator over `EntityToRerder`s for
all the entities which have both a position and a tile.
```rust
// game.rs
...
impl Game {
    ...
    // Returns an iterator over rendering information for each renderable entity
    pub fn entities_to_render(&self) -> impl '_ + Iterator<Item = EntityToRender> {
        self.world
            .components
            .tile
            .iter()
            .filter_map(|(entity, &tile)| {
                let &coord = self.world.components.coord.get(entity)?;
                Some(EntityToRender { tile, coord })
            })
    }
}
```

Finally, update app.rs to use the `Game` type:
```rust
// app.rs
use crate::game::{EntityToRender, Game, Tile};
...
// The state of the game
struct GameData {
    game: Game,
}

impl GameData {
    fn new(screen_size: Size) -> Self {
        let game = Game::new(screen_size);
        Self { game }
    }

    // Update the game state by applying a game action
    fn handle_game_action(&mut self, game_action: GameAction) {
        match game_action {
            GameAction::Move(direction) => self.game.move_player(direction),
        }
    }

    // Associate each tile with a description of how to render it
    fn render_cell_from_tile(&self, tile: Tile) -> RenderCell {
        match tile {
            Tile::Player => RenderCell::BLANK.with_character('@').with_bold(true),
        }
    }

    fn render(&self, ctx: Ctx, fb: &mut FrameBuffer) {
        for EntityToRender { coord, tile } in self.game.entities_to_render() {
            let render_cell = self.render_cell_from_tile(tile);
            fb.set_cell_relative_to_ctx(ctx, coord, 0, render_cell);
        }
    }
}
...
impl Component for GameComponent {
    ...
    fn render(&self, state: &Self::State, ctx: Ctx, fb: &mut FrameBuffer) {
        state.render(ctx, fb);
    }
    ...
}
...
```
