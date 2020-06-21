---
layout: post
title: "Roguelike Tutorial 2020: Part 2 - Generic Entities, Rendering, and the Map"
date: 2020-06-19 20:00:00 +1000
categories: gamedev roguelikes tutorial
permalink: /roguelike-tutorial-2020-part-2/
excerpt_separator: <!--more-->
og_image: screenshot-end.png
---

In the {% local roguelike-tutorial-2020-part-1 | previous part %} we got a single '@' sign moving
around the screen. The player character was represented by a coordinate stored directly in
the game state. In this part, we'll define a generic "entity" type, of which the player character
is merely one instance. The rendering logic will be generalized to draw arbitrary game entities.
Finally, we'll use the generic entity type to define map components - namely walls and
floor tiles.

By the end of this part, the game will look like this:
{% image screenshot-end.png %}

<!--more-->

This part is loosely based on [this part](http://rogueliketutorials.com/tutorials/tcod/part-2/) of the
python tcod tutorial.

Reference implementation branch for starting point: [part-1-end](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-1-end)

In this post:

- [Refactor](#refactor)
- [Generic Entities](#generic-entities)
- [General Rendering](#general-rendering)
- [Spatial Table](#spatial-table)
- [Walls and Floors](#walls-and-floors)

## {% anchor refactor | Refactor %}

But first, a minor refactor to split the code into 3 files. This will make future changes easier to talk about.

A new file `game.rs` will contain all the game-specific logic, mostly agnostic of the fact that it is a chargrid application.
For now this will look a lot like the `AppData` type. Note the `player_coord` method. For now this will just return the value
in the `player_coord` field but this will change later in this part.

{% pygments rust %}
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
{% endpygments %}

A new file `app.rs` will contain the definitions of `AppData`, `AppView`, and `App`.
`AppData` is now a wrapper of the `GameState` type from `game.rs`.
Keep the `handle_input` method here, interpreting `chargrid::input::Input`s
and calling the appropriate method of `GameState` (currently just `maybe_move_player`).
`GameState` doesn't expose its `player_coord` field, so update the implementation of `chargrid::render::View`
to call the `player_coord` method instead.

{% pygments rust %}
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
{% endpygments %}

After this change, `main.rs` will contain the `main` function and nothing else.
Also note the lack of `chargrid::...` qualifiers on types from the `chargrid` library.
All the types from `chargrid` are now explicitly imported at the top of each file.

Here's how the code should look after the refactor: [part-2.0](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-2.0)

## {% anchor generic-entities | Generic Entities %}

At the moment the player is represented by a `Coord` in a field of the game state.
Eventually we will want to add other characters to the game, as well as other game objects such as walls, doors, and items.
To this end, we need a generic way of representing a game entity.

The general idea is this: For each property that an entity can have, we'll make a table associating an entity's id (just a number)
with the property value. Each entity's data will be "spread out" over a number of tables corresponding to all the properties
which the entity has. This is based on the idea of "components" from [Entity Component Systems](https://en.wikipedia.org/wiki/Entity_component_system).
From now on in this and further parts, the term "component" will refer to a property of a game entity.

Add a dependency to help represent game state as a collection of component tables:
{% pygments toml %}
# Cargo.toml
...
[dependencies]
entity_table = "0.2"
{% endpygments %}

Now we need to think about which components we will need. So far, the only entity is the player.
We can think of the player as having a location and a tile. The `Coord` type is suitable for representing
a location. As for tiles, let's start with this:

{% pygments rust %}
// game.rs

#[derive(Clone, Copy, Debug)]
pub enum Tile {
    Player,
}
{% endpygments %}

Rather than storing how to draw the player (which symbol, colour, etc to use), store an abstract value in the game state,
and let the rendering logic decide how to draw the player.

Now to define our components:
{% pygments rust %}
entity_table::declare_entity_module! {
    components {
        coord: Coord,
        tile: Tile,
    }
}

use components::Components;
{% endpygments %}

This invocation of the `declare_entity_module` macro generates code resembling:
{% pygments rust %}
mod components {
    pub struct Components {
        pub coord: ComponentTable<Coord>,
        pub tile: ComponentTable<Tile>,
    }
}
{% endpygments %}

The `ComponentTable<T>` type is defined in the `entity_table` crate, and associates entity ids with values of type `T`.
The `Entity` type from `entity_table` is an entity id, and contains no data of its own.

Here's part of the interface exposed by `ComponentTable` relevant to this post. Read more in [`entity_table`'s documentation](https://docs.rs/entity_table/0.2.1/entity_table/struct.ComponentTable.html).
{% pygments rust %}
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
{% endpygments %}

Update the `GameState` type to store a `Components` and the `Entity` representing the player character:
{% pygments rust %}
pub struct GameState {
    screen_size: Size,
    components: Components,
    player_entity: Entity,
}
{% endpygments %}

Add a method to `GameState` for spawning the player character, which adds entries to component tables
such that the player character is inserted at a specified location. Then add a second method which populates
the map, which for now will just spawn the player (we'll add more to this method shortly).
{% pygments rust %}
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
{% endpygments %}

The existing methods of `GameState` need to be updated to match its new definition.

So far we haven't talked about how new values of `Entity` are created. The are effectively just numbers, but
their numerical representation is opaque. They must be created with an `EntityAllocator` - another type
defined in `entity_table` which allows entity ids to be created and destroyed. Update `GameState::new` to create a `Components`,
and use an `EntityAllocator` to allocate an `Entity` representing the player. Then populate the `GameState` by calling
the `populate` method we just defined.
{% pygments rust %}
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
{% endpygments %}

The logic for moving the player must be updated to operate on the `coord` component table rather than a single
`coord` value. It take a mutable reference to the player's current position, panicking if the player has no
current position. This mut ref is used to both check whether the movement is valid, and update the player's
position.
{% pygments rust %}
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
{% endpygments %}

Finally, the `player_coord` method, which returns the coordinate of the player character, must be updated to
work with the `coord` component, rather than just returning the value of the `player_coord` field (now removed):
{% pygments rust %}
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
{% endpygments %}

Note that we didn't change the public api of the `GameState` type, so no code outside of this file is affected by
changing the representation of game state.

Reference implementation branch: [part-2.1](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-2.1)

## {% anchor general-rendering | General Rendering %}

The rendering logic in `app.rs` is still hard-coded to only render the player character at the location returned by
`player_coord`. Before we can add additional entities to the game, rendering logic needs to be generalized to render
all entities which can be rendered.

Start by giving a way for `GameState` to tell the renderer what needs to be rendered.
Define a new type in `game.rs`:
{% pygments rust %}
// game.rs
...
pub struct EntityToRender {
    pub tile: Tile,
    pub coord: Coord,
}
{% endpygments %}

This tells the renderer to draw a given tile at a given position on the screen.

Add a method to `GameState` which returns an `Iterator` over `EntityToRender`s for all the entities which
need to be rendered. For now, let's say that an entity needs to be rendered if it has both a `coord` and a `tiile`
component.
{% pygments rust %}
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
{% endpygments %}

Now in `app.rs`, update the `view` method of `AppView` to call `entities_to_render` instead of `player_coord`:
{% pygments rust %}
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
{% endpygments %}

Note that the `ViewCell` which is rendered is obtained by matching on `entity_to_render.tile`. As we add new `Tile` variants,
we'll update this match statement to tell the renderer how to draw the new `Tile`s.

Now remove the `player_coord` method from `GameState` as it's no longer needed.

Reference implementation branch: [part-2.2](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-2.2)

## {% anchor spatial-table | Spatial Table %}

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
but it also provides the reverse association - a mapping from `Coord` to `Entity` indicating which entities are
at a given `Coord`.

Add a dependency on `spatial_table`:
{% pygments toml %}
# Cargo.toml
...
[dependencies]
spatial_table = "0.2"
{% endpygments %}


Multiple entities may share a single location (e.g. a floor entity and a character entity may
co-exist). To represent this fact, a `SpatialTable` associates each coordinate with a collection of `Entity`s
where each entity is on a separate "layer". At each coordinate, there are a fixed number of layers, and each layer
may contain one or zero entities. It might help to visualize a `SpatialTable` as a 2D array of a `Layers` type defined
as:
{% pygments rust %}
struct Layers {
    floor: Option<Entity>,
    character: Option<Entity>,
    feature: Option<Entity>,
}
{% endpygments %}

In this scenario, every cell of the 2D grid _may_ contain a floor, a character, and a feature (walls, doors, furniture, etc).
`SpatialTable` doesn't care which entities are stored in a layer. When adding or updating an entity's location, you may also
set which layer it is on. `SpatialTable` doesn't allow you to update the coordinate or layer of an entity if its destination
coordinate and feature is already occupied.

`SpatialTable` doesn't assume anything about which layers you will use. Start by defining which layers we will be using for our game:
{% pygments rust %}
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
{% endpygments %}

The `declare_layers_module` macro produces code resembling:
{% pygments rust %}
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
{% endpygments %}

The `Layers` type represents which entities are on which layer. There will be one `Layers` value for each cell of the grid
representing the world.
The `Layer` type lets you refer to layers at runtime.

After the macro invocation, create type aliases to make it convenient to work with `SpatialTable` for our specified set of layers.
The `Location` type is a `Coord` plus a `Layer`.
It's defined as:
{% pygments rust %}
struct Location<L> {
    pub coord: Coord,
    pub layer: Option<L>,
}
{% endpygments %}

Note that `layer` is an `Option` - an `Entity` doesn't need to be associated with a layer.
Only entities associated with layers will be returned when querying which entities are at a given coordinate.

Here's the relevant part of the api to `SpatialTable`. Note that it's generic over the type of layers in each cell.
The full documentation is in [`spatial_table`'s documentation](https://docs.rs/spatial_table/0.2.0/spatial_table/struct.SpatialTable.html).
{% pygments rust %}
impl<L: Layers> SpatialTable<L> {
    // creates a new SpatialTable<L> with given dimensions
    pub fn new(size: Size) -> Self { ... }

    // Returns the location (coord and layer) of a given entity
    pub fn location_of(&self, entity: Entity) -> Option<&Location<L::Layer>> { ... }

    // Returns the coord of a given entity
    pub fn coord_of(&self, entity: Entity) -> Option<Coord> { ... }

    // Returns the layers at a given coord, panicking if coord is out of bounds
    pub fn layers_at_checked(&self, coord: Coord) -> &L { ... }

    // Update the coord associated with an entity to a given value
    pub fn update_coord(&mut self, entity: Entity, coord: Coord) -> Result<(), UpdateError> { ... }
}

pub enum UpdateError {
    OccupiedBy(Entity),
    DestinationOutOfBounds,
}
{% endpygments %}


Reference implementation branch: [part-2.3](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-2.3)

## {% anchor walls-and-floors | Walls and Floors %}

Reference implementation branch: [part-2-4](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-2-4)

{% local roguelike-tutorial-2020-part-3 | Click here for the next part! %}
