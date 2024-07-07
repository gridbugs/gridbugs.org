+++
title = "Part 3 - Generating a Dungeon"
date = 2020-06-19T20:00:00+10:00
path = "roguelike-tutorial-2020-part-3"

[extra]
og_image = "screenshot-end.png"
+++

The definition of "roguelike" is [hotly debated](http://www.gamesofgrey.com/blog/?p=403)
but one aspect we can all agree on is that levels must be procedurally generated.
That is, rather than fixed, hand-crafted levels, players will explore levels generated
according to an algorithm; each playthrough will be unique, and it's _highly_ unlikely that
any other player will ever see the same levels as you.

In this part we'll implement an algorithm for procedurally generating a dungeon!

By the end of this part, the game will look like this:
![screenshot-end.png](screenshot-end.png)

<!-- more -->

This part is loosely based on [this part](http://rogueliketutorials.com/tutorials/tcod/part-3/) of the
python tcod tutorial.

Reference implementation branch for starting point: [part-2-end](https://github.com/gridbugs/chargrid-roguelike-tutorial-2020/tree/part-2-end)

In this post:

- [Framework](#framework)
- [Random Number Generator](#random-number-generator)
- [Rooms](#rooms)
- [Corridors](#corridors)

## Framework

Rather than generating the dungeon directly into the `GameState`, it will be more convenient to first populate
a 2D array of tiles, and then use the result to initialize the `GameState`. Grab a crate to help work with
2D arrays using the `Coord` and `Size` types we've seen in previous parts:

```toml
# Cargo.toml
grid_2d = "0.15"
```

Start by generating a single room and placing the player inside.
This starts with a `Grid<Option<TerrainTile>>`, and sets some of the cells to be `Some(...)`
to add walls, floors, and the player spawn point.
As the algorithm may not visit every cell of the grid, the final line of `generate_dungeon` (`grid.map(...)`)
creates a new grid by unwrapping every cell of the original grid,
replacing every `None`  with `TerrainTile::Wall`.

```rust
// terrain.rs

use grid_2d::{Coord, Grid, Size};

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum TerrainTile {
    Player,
    Floor,
    Wall,
}

pub fn generate_dungeon(size: Size) -> Grid<TerrainTile> {
    let mut grid = Grid::new_copy(size, None);
    for coord in Size::new(5, 5).coord_iter_row_major() {
        *grid.get_checked_mut(coord + Coord::new(1, 1)) = Some(TerrainTile::Floor);
    }
    *grid.get_checked_mut(Coord::new(3, 3)) = Some(TerrainTile::Player);
    grid.map(|t| t.unwrap_or(TerrainTile::Wall))
}
```

Update `GameState::populate` to spawn entities based on the contents of the a `Grid<TerrainTile>` returned
by `terrain::generate_dungeon`:

```rust
// game.rs

use crate::terrain::{self, TerrainTile};

...

impl GameState {
    ...
    fn populate(&mut self) {
        let terrain = terrain::generate_dungeon(self.screen_size);
        for (coord, &terrain_tile) in terrain.enumerate() {
            match terrain_tile {
                TerrainTile::Player => {
                    self.spawn_floor(coord);
                    self.spawn_player(coord);
                }
                TerrainTile::Floor => self.spawn_floor(coord),
                TerrainTile::Wall => {
                    self.spawn_floor(coord);
                    self.spawn_wall(coord);
                }
            }
        }
    }
    ...
}
```

Add the `terrain` module to `main.rs`:

```rust
// main.rs

...
mod terrain;
...
```

Run the game and it will generate this:

![screenshot-start.png](screenshot-start.png)

Reference implementation branch: [part-3.0](https://github.com/gridbugs/chargrid-roguelike-tutorial-2020/tree/part-3.0)

## Random Number Generator

Before proceeding with terrain generation, we need a source of randomness in the terrain generator.
Add dependencies on `rand` and `rand_isaac`:
```toml
# Cargo.toml
rand = "0.8"        # basic functionality for random number generators
rand_isaac = "0.3"  # a specific random number generator implementation
```

Initialize a random number generator and store it in a field of `GameState`.
Pass a reference to the RNG into `generate_dungeon`.

```rust
// game.rs

use rand::{Rng, SeedableRng};
use rand_isaac::Isaac64Rng;

...

impl GameState {
    ...
    fn populate<R: Rng>(&mut self, rng: &mut R) {
        let terrain = terrain::generate_dungeon(self.screen_size, rng);
        ...
    }
    ...
    pub fn new(screen_size: Size) -> Self {
        ...
        let mut rng = Isaac64Rng::from_entropy();
        game_state.populate(&mut rng);
        game_state
    }
    ...
}
```

Add the corresponding argument to `generate_dungeon`.

```rust
// terrain.rs

use rand::Rng;
...
pub fn generate_dungeon<R: Rng>(size: Size, rng: &mut R) -> Grid<TerrainTile> {
    println!("random int: {}", rng.next_u32());
    ...
}
```

Run this and it will print out a random number:
```
random int: 387460914
```

Reference implementation branch: [part-3.1](https://github.com/gridbugs/chargrid-roguelike-tutorial-2020/tree/part-3.1)

## Rooms

Add rooms in random locations by repeatedly creating rooms with random sizes and positions, but only adding them
to the map if they don't overlap any existing rooms. Here's the code:

```rust
// terrain.rs

...

// A rectangular area of the map
struct Room {
    top_left: Coord,
    size: Size,
}

impl Room {
    // Returns a randomly sized room at a random position within `bounds`
    fn choose<R: Rng>(bounds: Size, rng: &mut R) -> Self {
        let width = rng.gen_range(5..11);
        let height = rng.gen_range(5..9);
        let size = Size::new(width, height);
        let top_left_bounds = bounds - size;
        let left = rng.gen_range(0..top_left_bounds.width());
        let top = rng.gen_range(0..top_left_bounds.height());
        let top_left = Coord::new(left as i32, top as i32);
        Self { top_left, size }
    }

    // Returns a coord at the centre of the room, rounding down
    fn centre(&self) -> Coord {
        self.top_left + self.size.to_coord().unwrap() / 2
    }

    // Returns an iterator over all the coordinates in the room in row major order
    fn coords<'a>(&'a self) -> impl 'a + Iterator<Item = Coord> {
        self.size
            .coord_iter_row_major()
            .map(move |coord| self.top_left + coord)
    }

    // Returns true if and only if each cell of `grid` overlapping this room is `None`
    fn only_intersects_empty(&self, grid: &Grid<Option<TerrainTile>>) -> bool {
        self.coords().all(|coord| grid.get_checked(coord).is_none())
    }

    // Updates `grid`, setting each cell overlapping this room to `Some(TerrainTile::Floor)`.
    // The top and left sides of the room are set to `Some(TerrainTile::Wall)` instead.
    // This prevents a pair of rooms being placed immediately adjacent to one another.
    fn carve_out(&self, grid: &mut Grid<Option<TerrainTile>>) {
        for coord in self.coords() {
            let cell = grid.get_checked_mut(coord);
            if coord.x == self.top_left.x || coord.y == self.top_left.y {
                *cell = Some(TerrainTile::Wall);
            } else {
                *cell = Some(TerrainTile::Floor);
            }
        }
    }
}

pub fn generate_dungeon<R: Rng>(size: Size, rng: &mut R) -> Grid<TerrainTile> {
    let mut grid = Grid::new_copy(size, None);
    let mut player_placed = false;

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
            if !player_placed {
                *grid.get_checked_mut(room_centre) = Some(TerrainTile::Player);
                player_placed = true;
            }
        }
    }

    grid.map(|t| t.unwrap_or(TerrainTile::Wall))
}
```

Here's an example map produced by this algorithm:

![screenshot-rooms.png](screenshot-rooms.png)

Reference implementation branch: [part-3.2](https://github.com/gridbugs/chargrid-roguelike-tutorial-2020/tree/part-3.2)

## Corridors

To add corridors between rooms, keep track of the centre of every room that gets placed,
and then after all the rooms are placed, carve out corridors connecting every adjacent pair
of room centres.

```rust
// terrain.rs

...

// Carve out an L-shaped corridor between a pair of coordinates
fn carve_corridor(start: Coord, end: Coord, grid: &mut Grid<Option<TerrainTile>>) {
    for i in start.x.min(end.x)..=start.x.max(end.x) {
        let cell = grid.get_checked_mut(Coord { x: i, ..start });
        if *cell == None || *cell == Some(TerrainTile::Wall) {
            *cell = Some(TerrainTile::Floor);
        }
    }
    for i in start.y.min(end.y)..start.y.max(end.y) {
        let cell = grid.get_checked_mut(Coord { y: i, ..end });
        if *cell == None || *cell == Some(TerrainTile::Wall) {
            *cell = Some(TerrainTile::Floor);
        }
    }
}

pub fn generate_dungeon<R: Rng>(size: Size, rng: &mut R) -> Grid<TerrainTile> {
    let mut grid = Grid::new_copy(size, None);
    let mut room_centres = Vec::new();

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
        }
    }

    // Add corridors connecting every adjacent pair of room centres
    for window in room_centres.windows(2) {
        carve_corridor(window[0], window[1], &mut grid);
    }

    grid.map(|t| t.unwrap_or(TerrainTile::Wall))
}
```

After this change, the dungeon generator will produce fully-connected dungeons made up of
rooms and corridors.

![screenshot-end.png](screenshot-end.png)

Reference implementation branch: [part-3.3](https://github.com/gridbugs/chargrid-roguelike-tutorial-2020/tree/part-3.3)

[Click here for the next part!](@/roguelike-tutorial-2020/part4/index.md)
