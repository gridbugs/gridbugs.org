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

Reference implementation branch: [part-2.1](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-2.1)

## {% anchor general-rendering | General Rendering %}

Reference implementation branch: [part-2.2](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-2.2)

## {% anchor spatial-table | Spatial Table %}

Reference implementation branch: [part-2.3](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-2.3)

## {% anchor walls-and-floors | Walls and Floors %}

Reference implementation branch: [part-2-4](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-2-4)

{% local roguelike-tutorial-2020-part-3 | Click here for the next part! %}
