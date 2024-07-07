+++
title = "Part 2 - Entities, Rendering, Map"
date = 2020-06-19T20:00:00+10:00
path = "roguelike-tutorial-2020-part-2"

[extra]
og_image = "screenshot-end.png"
+++

In the [previous part](@/roguelike-tutorial-2020/part1/index.md) we got a single '@' sign moving
around the screen. The player character was represented by a coordinate stored directly in
the game state. In this part, we'll define a generic "entity" type, of which the player character
is merely one instance. The rendering logic will be generalized to draw arbitrary game entities.
Finally, we'll use the generic entity type to define map components - namely walls and
floor tiles.

By the end of this part, the game will look like this:
![screenshot-end.png](screenshot-end.png)

<!-- more -->

This part is loosely based on [this part](http://rogueliketutorials.com/tutorials/tcod/part-2/) of the
python tcod tutorial.

Reference implementation branch for starting point: [part-1-end](https://github.com/gridbugs/chargrid-roguelike-tutorial-2020/tree/part-1-end)

In this post:

- [Refactor](#refactor)
- [Generic Entities](#generic-entities)
- [General Rendering](#general-rendering)
- [Spatial Table](#spatial-table)
- [Walls and Floors](#walls-and-floors)

## Refactor

First, a minor refactor to split the code into 3 files. This won't change any logic - it will
just make future changes easier to talk about.

A new file `game.rs` will contain all the game-specific logic, mostly agnostic of the fact that it is a chargrid application.
For now this will look a lot like the `AppData` type. Note the `player_coord` method. For now this will just return the value
in the `player_coord` field but this will change later in this part.

```rust
// game.rs

use coord_2d::{Coord, Size};
use direction::CardinalDirection;

pub struct GameState {
    screen_size: Size,
    player_coord: Coord,
}

impl GameState {
    pub fn new(screen_size: Size) -> Self {
        ...
    }
    pub fn maybe_move_player(&mut self, direction: CardinalDirection) {
        ...
    }
    pub fn player_coord(&self) -> Coord {
        self.player_coord
    }
}
```

A new file `app.rs` will contain the definitions of `AppData`, `AppView`, and `App`.
`AppData` is now a wrapper of the `GameState` type from `game.rs`.
Keep the `handle_input` method here, interpreting `chargrid::input::Input`s
and calling the appropriate method of `GameState` (currently just `maybe_move_player`).
`GameState` doesn't expose its `player_coord` field, so update the implementation of `chargrid::render::View`
to call the `player_coord` method instead.

```rust
// app.rs
...
use crate::game::GameState;

struct AppData {
    game_state: GameState,
}

impl AppData {
    fn new(screen_size: Size) -> Self {
        Self {
            game_state: GameState::new(screen_size),
        }
    }
    fn handle_input(&mut self, input: Input) {
        match input {
            Input::Keyboard(key) => match key {
                KeyboardInput::Left => {
                    self.game_state.maybe_move_player(CardinalDirection::West)
                }
                ...
            },
            _ => (),
        }
    }
}

...

impl<'a> View<&'a AppData> for AppView {
    fn view<F: Frame, C: ColModify>(
        &mut self,
        data: &'a AppData,
        context: ViewContext<C>,
        frame: &mut F,
    ) {
        let view_cell = ViewCell::new()
            .with_character('@')
            .with_foreground(Rgb24::new_grey(255));
        frame.set_cell_relative(data.game_state.player_coord(), 0, view_cell, context);
    }
}
```

After this change, `main.rs` will contain the `main` function and nothing else.
Also note the lack of `chargrid::...` qualifiers on types from the `chargrid` library.
All the types from `chargrid` are now explicitly imported at the top of each file.

Here's how the code should look after the refactor: [part-2.0](https://github.com/gridbugs/chargrid-roguelike-tutorial-2020/tree/part-2.0)

## Generic Entities

At the moment the player is represented by a `Coord` in a field of the game state.
Eventually we will want to add other characters to the game, as well as other game objects such as walls, doors, and items.
To this end, we need a generic way of representing a game entity.

The general idea is this: For each property that an entity can have, we'll make a table associating an entity's id (just a number)
with the property value. Each entity's data will be "spread out" over a number of tables corresponding to all the properties
which the entity has. This is based on the idea of "components" from [Entity Component Systems](https://en.wikipedia.org/wiki/Entity_component_system).
From now on the term "component" will refer to a property of a game entity.

Add a dependency to help represent game state as a collection of component tables:
```toml
# Cargo.toml
...
[dependencies]
entity_table = "0.2"
```

Now we need to think about which components we will need. So far, the only entity is the player.
We can think of the player as having a location and a tile. The `Coord` type is suitable for representing
a location. As for tiles, let's start with this:

```rust
// game.rs

#[derive(Clone, Copy, Debug)]
pub enum Tile {
    Player,
}
```

Rather than storing how to draw the player (symbol, colour, etc), store an abstract value in the game state,
and let the rendering logic decide how to draw the player.

Now to define our components:
```rust
entity_table::declare_entity_module! {
    components {
        coord: Coord,
        tile: Tile,
    }
}

use components::Components;
```

This invocation of the `declare_entity_module` macro generates code resembling:
```rust
mod components {
    pub struct Components {
        pub coord: ComponentTable<Coord>,
        pub tile: ComponentTable<Tile>,
    }
}
```

The `ComponentTable<T>` type is defined in the `entity_table` crate, and associates entity ids with values of type `T`.
The `Entity` type from `entity_table` is an entity id, and contains no data of its own.

Here's part of the interface exposed by `ComponentTable` relevant to this post. Read more in [`entity_table`'s documentation](https://docs.rs/entity_table/0.2.1/entity_table/struct.ComponentTable.html).
```rust
impl<T> ComponentTable<T> {
    // set the component value of an entity
    pub fn insert(&mut self, entity: Entity, data: T) -> Option<T> { ... }

    // look up the component value of an entity
    pub fn get(&self, entity: Entity) -> Option<&T> { ... }

    // obtain a mutable reference to the component value of an entity
    pub fn get_mut(&mut self, entity: Entity) -> Option<&mut T> { ... }

    // returns an iterator over entities and their component values
    pub fn iter(&self) -> impl Iterator<Item = (Entity, T)> { ... }
    ...
}
```

Update the `GameState` type to store a `Components` and the `Entity` representing the player character:
```rust
pub struct GameState {
    screen_size: Size,
    components: Components,
    player_entity: Entity,
}
```

Add a method to `GameState` for spawning the player character, which adds entries to component tables
such that the player character is inserted at a specified location. Then add a second method which populates
the map, which for now will just spawn the player (we'll add more to this method shortly).
```rust
impl GameState {
    fn spawn_player(&mut self, coord: Coord) {
        self.components.coord.insert(self.player_entity, coord);
        self.components
            .tile
            .insert(self.player_entity, Tile::Player);
    }
    fn populate(&mut self, player_coord: Coord) {
        self.spawn_player(player_coord);
    }
    ...
}
```

The existing methods of `GameState` need to be updated to match its new definition.

So far we haven't talked about how new values of `Entity` are created. They are effectively just numbers, but
their numerical representation is opaque. They must be created with an `EntityAllocator` - another type
defined in `entity_table` which allows entity ids to be created and destroyed. Update `GameState::new` to create a `Components`,
and use an `EntityAllocator` to allocate an `Entity` representing the player. Then populate the `GameState` by calling
the `populate` method we just defined.
```rust
impl GameState {
    ...
    pub fn new(screen_size: Size) -> Self {
        let mut entity_allocator = EntityAllocator::default();
        let components = Components::default();
        let player_entity = entity_allocator.alloc();
        let mut game_state = Self {
            screen_size,
            components,
            player_entity,
        };
        game_state.populate(screen_size.to_coord().unwrap() / 2);
        game_state
    }
    ...
}
```

The logic for moving the player must be updated to operate on the `coord` component table rather than a single
`coord` value. It obtains a mutable reference to the player's current position, panicking if the player has no
current position. This mut ref is used to both check whether the movement is valid, and update the player's
position.
```rust
impl GameState {
    ...
    pub fn maybe_move_player(&mut self, direction: CardinalDirection) {
        let player_coord = self
            .components
            .coord
            .get_mut(self.player_entity)
            .expect("player has no coord component");
        let new_player_coord = *player_coord + direction.coord();
        if new_player_coord.is_valid(self.screen_size) {
            *player_coord = new_player_coord;
        }
    }
    ...
}
```

Finally, the `player_coord` method, which returns the coordinate of the player character, must be updated to
work with the `coord` component, rather than just returning the value of the `player_coord` field (now removed):
```rust
impl GameState {
    ...
    pub fn player_coord(&self) -> Coord {
        *self
            .components
            .coord
            .get(self.player_entity)
            .expect("player has no coord component")
    }
}
```

Note that we didn't change the public api of the `GameState` type, so no code outside of this file is affected by
changing the representation of game state.

Reference implementation branch: [part-2.1](https://github.com/gridbugs/chargrid-roguelike-tutorial-2020/tree/part-2.1)

## General Rendering

The rendering logic in `app.rs` is still hard-coded to only render the player character at the location returned by
`player_coord`. Before we can add additional entities to the game, rendering logic needs to be generalized to render
all entities which can be rendered.

Start by providing a way for `GameState` to tell the renderer what needs to be rendered.
Define a new type in `game.rs`:
```rust
// game.rs
...
pub struct EntityToRender {
    pub tile: Tile,
    pub coord: Coord,
}
```

This tells the renderer to draw a given tile at a given position on the screen.

Add a method to `GameState` which returns an `Iterator` over `EntityToRender`s for all the entities which
need to be rendered. For now, let's say that an entity needs to be rendered if it has both a `coord` and a `tiile`
component.
```rust
impl GameState {
    ...
    pub fn entities_to_render<'a>(&'a self) -> impl 'a + Iterator<Item = EntityToRender> {
        let tile_component = &self.components.tile;
        let coord_component = &self.components.coord;
        tile_component.iter().filter_map(move |(entity, &tile)| {
            let coord = coord_component.get(entity).cloned()?;
            Some(EntityToRender { tile, coord })
        })
    }
}
```

Now in `app.rs`, update the `view` method of `AppView` to call `entities_to_render` instead of `player_coord`:
```rust
// app.rs
use crate::game::{GameState, Tile};
...
impl<'a> View<&'a AppData> for AppView {
    fn view<F: Frame, C: ColModify>(
        &mut self,
        data: &'a AppData,
        context: ViewContext<C>,
        frame: &mut F,
    ) {
        for entity_to_render in data.game_state.entities_to_render() {
            let view_cell = match entity_to_render.tile {
                Tile::Player => ViewCell::new()
                    .with_character('@')
                    .with_foreground(Rgb24::new_grey(255)),
            };
            frame.set_cell_relative(entity_to_render.coord, 0, view_cell, context);
        }
    }
}
```

Note that the `ViewCell` which is rendered is obtained by matching on `entity_to_render.tile`. As we add new `Tile` variants,
we'll update this match statement to tell the renderer how to draw the new `Tile`s.

Now remove the `player_coord` method from `GameState` as it's no longer needed.

Reference implementation branch: [part-2.2](https://github.com/gridbugs/chargrid-roguelike-tutorial-2020/tree/part-2.2)

## Spatial Table

Shortly we'll be adding walls to the game. Walls are solid; we'll soon need a way of determining whether the player
is trying to move through a wall and prevent their movement. The game engine will need to answer queries of the form
"is there a solid entity at a given location?". One approach would be to add a new component `solid`, set to `true` on
solid entities (such as walls). The problem with this is in order to determine whether a solid object exists at a location,
the engine would need to cross reference the `solid` and `coord` components. Since `ComponentTable`s are indexed by
`Entity` (rather than, say, `Coord`), this cross reference will be expensive, as it will involve iterating over all entities
that are solid, and checking whether their `coord` is the one we're interested in.

It would be useful to have a separate data structure which could be indexed by a `Coord`, and tell us which entities are
currently at the specified location. The crate [spatial_table](https://crates.io/crates/spatial_table) defines a type
`SpatialTable` which is similar to a `ComponentTable<Coord>` in that it associates `Entity`s with a `Coord`,
but it also provides the _reverse_ association - a mapping from `Coord` to `Entity` indicating which entities are
at a given `Coord`.

Add a dependency on `spatial_table`:
```toml
# Cargo.toml
...
[dependencies]
spatial_table = "0.3"
```


Multiple entities may share a single location (e.g. a floor entity and a character entity may
co-exist in the same cell). To represent this fact, a `SpatialTable` associates each coordinate with a collection of `Entity`s
where each entity is on a separate "layer". At each coordinate, there are a fixed number of layers, and each layer
may contain one or zero entities. It might help to visualize a `SpatialTable` as a 2D array of a `Layers` type defined
as:
```rust
struct Layers {
    floor: Option<Entity>,
    character: Option<Entity>,
    feature: Option<Entity>,
}
```

In this scenario, every cell of the 2D grid _may_ contain a floor, a character, and a feature (walls, doors, furniture, etc).
`SpatialTable` doesn't care which entities are stored in a layer. When adding or updating an entity's location, you may also
set which layer it is on. `SpatialTable` doesn't allow you to update the coordinate or layer of an entity if its destination
coordinate and layer is already occupied.

`SpatialTable` doesn't assume anything about which layers you will use. Start by defining which layers we will be using for our game:
```rust
// game.rs
...
spatial_table::declare_layers_module! {
    layers {
        floor: Floor,
        character: Character,
        feature: Feature,
    }
}

pub use layers::Layer;
type SpatialTable = spatial_table::SpatialTable<layers::Layers>;
pub type Location = spatial_table::Location<Layer>;
```

The `declare_layers_module` macro produces code resembling:
```rust
mod layers {
    pub struct Layers {
        pub floor: Option<Entity>,
        pub character: Option<Entity>,
        pub feature: Option<Entity>,
    }

    pub enum Layer {
        Floor,
        Character,
        Feature,
    }

    impl spatial_table::Layers for Layers {
        type Layer = Layer;
        ...
    }
}
```

The `Layers` type represents which entities are on which layer. A `SpatialTable` will contain one `Layers` for each
cell in its grid.
The `Layer` type lets you refer to layers dynamically, for example when inserting an enity into a `SpatialTable`
at a specified coordinate and layer.

After the macro invocation, create type aliases to make it convenient to work with `SpatialTable` for our specified set of layers.
The `Location` type is a `Coord` plus a `Layer`.
It's defined as:
```rust
struct Location<L> {
    pub coord: Coord,
    pub layer: Option<L>,
}
```

Note that the `layer` field is an `Option` - an `Entity` doesn't need to be associated with a layer.
Only entities associated with layers will be returned when querying which entities are at a given coordinate.

Here's the relevant part of the `SpatialTable` interface. Note that it's generic over the type of layers in each cell.
The full interface is specified in [`spatial_table`'s documentation](https://docs.rs/spatial_table/0.2.0/spatial_table/struct.SpatialTable.html).
```rust
impl<L: spatial_table::Layers> SpatialTable<L> {
    // Creates a new SpatialTable<L> with given dimensions
    pub fn new(size: Size) -> Self { ... }

    // Returns the location (coord and layer) of a given entity
    pub fn location_of(&self, entity: Entity) -> Option<&Location<L::Layer>> { ... }

    // Returns the coord of a given entity
    pub fn coord_of(&self, entity: Entity) -> Option<Coord> { ... }

    // Returns the layers at a given coord, panicking if coord is out of bounds
    pub fn layers_at_checked(&self, coord: Coord) -> &L { ... }

    // Update the location (coord and layer) associated with an entity
    pub fn update(&mut self, entity: Entity, location: Location<L::Layer>)
        -> Result<(), UpdateError> {

    // Update the coord associated with an entity
    pub fn update_coord(&mut self, entity: Entity, coord: Coord)
        -> Result<(), UpdateError> { ... }
}

pub enum UpdateError {
    OccupiedBy(Entity),
    DestinationOutOfBounds,
}
```

Remove the `coord` component table. It will be replaced with a `SpatialTable`.

```rust
entity_table::declare_entity_module! {
    components {
        tile: Tile,
    }
}
```

Add a `SpatialTable` to `GameState`.
```rust
pub struct GameState {
    screen_size: Size,
    components: Components,
    spatial_table: SpatialTable,
    player_entity: Entity,
}
...
impl GameState {
    pub fn new(screen_size: Size) -> Self {
        let mut entity_allocator = EntityAllocator::default();
        let components = Components::default();
        let spatial_table = SpatialTable::new(screen_size);
        let player_entity = entity_allocator.alloc();
        let mut game_state = Self {
            screen_size,
            components,
            spatial_table,
            player_entity,
        };
        game_state.populate(screen_size.to_coord().unwrap() / 2);
        game_state
    }
    ...
}
```

Update `spawn_player` to add the player `Entity` to the `SpatialTable`.

```rust
impl GameState {
    fn spawn_player(&mut self, coord: Coord) {
        self.spatial_table
            .update(
                self.player_entity,
                Location {
                    coord,
                    layer: Some(Layer::Character),
                },
            )
            .unwrap();
        self.components
            .tile
            .insert(self.player_entity, Tile::Player);
    }
    ...
}
```

Update `maybe_move_player` to update the `SpatialTable`.
```rust
impl GameState {
    ...
    pub fn maybe_move_player(&mut self, direction: CardinalDirection) {
        let player_coord = self
            .spatial_table
            .coord_of(self.player_entity)
            .expect("player has no coord");
        let new_player_coord = player_coord + direction.coord();
        if new_player_coord.is_valid(self.screen_size) {
            self.spatial_table
                .update_coord(self.player_entity, new_player_coord)
                .unwrap();
        }
    }
    ...
}
```

And update `entities_to_render` to use the `SpatialTable`.
Replace the `coord: Coord` field of `EntityToRender` with a `location: Location` field
so the render knows which layer each entity is on. This will help later on when we need
to render a scene with multiple entities at a single coordinate and use layers to determine draw order.

```rust
pub struct EntityToRender {
    pub tile: Tile,
    pub location: Location,
}

impl GameState {
    ...
    pub fn entities_to_render<'a>(&'a self) -> impl 'a + Iterator<Item = EntityToRender> {
        let tile_component = &self.components.tile;
        let spatial_table = &self.spatial_table;
        tile_component.iter().filter_map(move |(entity, &tile)| {
            let &location = spatial_table.location_of(entity)?;
            Some(EntityToRender { tile, location })
        })
    }
    ...
}
```

Finally, update the rendering logic in `app.rs` to understand the new `location` field of `EntityToRender`.
```rust
// app.rs

impl<'a> View<&'a AppData> for AppView {
    fn view<F: Frame, C: ColModify>(
        &mut self,
        data: &'a AppData,
        context: ViewContext<C>,
        frame: &mut F,
    ) {
        for entity_to_render in data.game_state.entities_to_render() {
            let view_cell = ...;
            frame.set_cell_relative(entity_to_render.location.coord, 0, view_cell, context);
        }
    }
}
```

Reference implementation branch: [part-2.3](https://github.com/gridbugs/chargrid-roguelike-tutorial-2020/tree/part-2.3)

## Walls and Floors

Let's add walls and floors, and make it so the player can't walk through walls.

Add `Tile`s for walls and floors:
```rust
// game.rs

pub enum Tile {
    Player,
    Floor,
    Wall,
}
```

So that we can spawn new entities in addition to the player, add the `EntityAllocator` created in `GameState::new`
to `GameState`:
```rust
pub struct GameState {
    screen_size: Size,
    entity_allocator: EntityAllocator,
    components: Components,
    spatial_table: SpatialTable,
    player_entity: Entity,
}


impl GameState {
    ...
    pub fn new(screen_size: Size) -> Self {
        let mut entity_allocator = EntityAllocator::default();
        let components = Components::default();
        let spatial_table = SpatialTable::new(screen_size);
        let player_entity = entity_allocator.alloc();
        let mut game_state = Self {
            screen_size,
            entity_allocator,
            components,
            spatial_table,
            player_entity,
        };
        game_state.populate(screen_size.to_coord().unwrap() / 2);
        game_state
    }
    ...
}
```

Add methods for spawning walls and floors, and update `GameState::populate` to place floor tiles everywhere, and
walls in a few select locations.
```rust
impl GameState {
    fn spawn_wall(&mut self, coord: Coord) {
        let entity = self.entity_allocator.alloc();
        self.spatial_table
            .update(
                entity,
                Location {
                    coord,
                    layer: Some(Layer::Feature),
                },
            )
            .unwrap();
        self.components.tile.insert(entity, Tile::Wall);
    }
    fn spawn_floor(&mut self, coord: Coord) {
        let entity = self.entity_allocator.alloc();
        self.spatial_table
            .update(
                entity,
                Location {
                    coord,
                    layer: Some(Layer::Floor),
                },
            )
            .unwrap();
        self.components.tile.insert(entity, Tile::Floor);
    }
    ...
    fn populate(&mut self, player_coord: Coord) {
        self.spawn_player(player_coord);
        for coord in self.screen_size.coord_iter_row_major() {
            self.spawn_floor(coord);
        }
        self.spawn_wall(player_coord + Coord::new(-1, 2));
        self.spawn_wall(player_coord + Coord::new(0, 2));
        self.spawn_wall(player_coord + Coord::new(1, 2));
    }
    ...
}
```

To prevent the player walking through walls, update `GameState::maybe_move_player`. For now, treat all cells with a feature or
a character as solid. This will change in future parts.

```rust
impl GameState {
    ...
    pub fn maybe_move_player(&mut self, direction: CardinalDirection) {
        let player_coord = self
            .spatial_table
            .coord_of(self.player_entity)
            .expect("player has no coord");
        let new_player_coord = player_coord + direction.coord();
        if new_player_coord.is_valid(self.screen_size) {
            let dest_layers = self.spatial_table.layers_at_checked(new_player_coord);
            if dest_layers.character.is_none() && dest_layers.feature.is_none() {
                self.spatial_table
                    .update_coord(self.player_entity, new_player_coord)
                    .unwrap();
            }
        }
    }
    ...
}
```

Finally, update the rendering logic to render wall and floor tiles. The cell containing the player will also contain a floor.
We need to make sure that the floor is drawn "below" the player. The `set_cell_relative` method (which draws a cell)
takes a `depth` argument. Thus far we've been passing 0, but now we'll derive it from the layer.

```rust
// app.rs
...
use crate::game::{GameState, Layer, Tile};

...

impl<'a> View<&'a AppData> for AppView {
    fn view<F: Frame, C: ColModify>(
        &mut self,
        data: &'a AppData,
        context: ViewContext<C>,
        frame: &mut F,
    ) {
        for entity_to_render in data.game_state.entities_to_render() {
            let view_cell = match entity_to_render.tile {
                Tile::Player => ViewCell::new()
                    .with_character('@')
                    .with_foreground(Rgb24::new_grey(255)),
                Tile::Floor => ViewCell::new()
                    .with_character('.')
                    .with_foreground(Rgb24::new_grey(63))
                    .with_background(Rgb24::new(0, 0, 63)),
                Tile::Wall => ViewCell::new()
                    .with_character('#')
                    .with_foreground(Rgb24::new(0, 63, 63))
                    .with_background(Rgb24::new(63, 127, 127)),
            };
            let depth = match entity_to_render.location.layer {
                None => -1,
                Some(Layer::Floor) => 0,
                Some(Layer::Feature) => 1,
                Some(Layer::Character) => 2,
            };
            frame.set_cell_relative(entity_to_render.location.coord, depth, view_cell, context);
        }
    }
}
```

Now run the game! It should look like this:

![screenshot-end.png](screenshot-end.png)

Try to move the player character through the walls (`#`)!

Reference implementation branch: [part-2.4](https://github.com/gridbugs/chargrid-roguelike-tutorial-2020/tree/part-2.4)

[Click here for the next part!](@/roguelike-tutorial-2020/part3/index.md)
