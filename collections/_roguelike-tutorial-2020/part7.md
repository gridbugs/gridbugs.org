---
layout: series-part
series: roguelike-tutorial-2020
index: 7
date: 2020-07-12 17:00:00 +1000
title: "Part 7 - User Interface"
permalink: /roguelike-tutorial-2020-part-7/
og_image: screenshot-end.png
---

In this part we'll add a heads-up display consisting of a health bar and message log.

By the end of this part, the game will look like this:

{% image screenshot-end.png %}

<!--more-->

This part is loosely based on [this part](http://rogueliketutorials.com/tutorials/tcod/part-7/) of the
python tcod tutorial.

Reference implementation branch for starting point: [part-6-end](https://github.com/gridbugs/chargrid-roguelike-tutorial-2020/tree/part-6-end)

In this post:
 - [Basic Health Bar](#basic-health-bar)
 - [Pretty Health Bar](#pretty-health-bar)
 - [Mesage Log](#message-log)

## {% anchor basic-health-bar | Basic Health Bar %}

Right now all our drawing takes place in `AppView`'s implementation of the `View` trait.
One of the goals of the `chargrid` library is to allow drawing logic to be split up into
independent modules which can be composed into complex UI's.
Thus far the only thing we've needed to draw has been the game, but in this part we'll
add a UI as well, so start by moving the game-drawing logic into a new type:

```rust
// app.rs
...
#[derive(Default)]
struct GameView {}

impl<'a> View<&'a GameState> for GameView {
    fn view<F: Frame, C: ColModify>(
        &mut self,
        game_state: &'a GameState,
        context: ViewContext<C>,
        frame: &mut F,
    ) {
        for entity_to_render in game_state.entities_to_render() {
            let view_cell = match entity_to_render.visibility {
                CellVisibility::Currently => {
                    currently_visible_view_cell_of_tile(entity_to_render.tile)
                }
                CellVisibility::Previously => {
                    previously_visible_view_cell_of_tile(entity_to_render.tile)
                }
                CellVisibility::Never => ViewCell::new(),
            };
            let depth = match entity_to_render.location.layer {
                None => -1,
                Some(Layer::Floor) => 0,
                Some(Layer::Feature) => 1,
                Some(Layer::Corpse) => 2,
                Some(Layer::Character) => 3,
            };
            frame.set_cell_relative(entity_to_render.location.coord, depth, view_cell, context);
        }
    }
}
...
struct AppView {
    game_view: GameView,
}

impl AppView {
    fn new(screen_size: Size) -> Self {
        Self {
            game_view: GameView::default(),
        }
    }
}

impl<'a> View<&'a AppData> for AppView {
    fn view<F: Frame, C: ColModify>(
        &mut self,
        data: &'a AppData,
        context: ViewContext<C>,
        frame: &mut F,
    ) {
        self.game_view.view(&data.game_state, context, frame);
    }
}
```

In a new file `ui.rs`, implement a simple UI consisting of just the player's health bar:

```rust
// ui.rs

use crate::world::HitPoints;
use chargrid::{
    render::{ColModify, Frame, Style, View, ViewContext},
    text::StringViewSingleLine,
};
use rgb24::Rgb24;

pub struct UiData {
    pub player_hit_points: HitPoints,
}

#[derive(Default)]
pub struct UiView {
    buf: String,
}

impl View<UiData> for UiView {
    fn view<F: Frame, C: ColModify>(
        &mut self,
        data: UiData,
        context: ViewContext<C>,
        frame: &mut F,
    ) {
        use std::fmt::Write;
        self.buf.clear();
        write!(
            &mut self.buf,
            "{}/{}",
            data.player_hit_points.current, data.player_hit_points.max
        )
        .unwrap();
        StringViewSingleLine::new(Style::new().with_foreground(Rgb24::new_grey(255)))
            .view(&self.buf, context, frame);
    }
}
```

Similarly to `GameView` and `AppView`, the new `UiView` type implements `chargrid::View`
for a specific type of data, in this case `UiData` which currently consists of just a `HitPoints`.
The `buf: String` field in `UiView` is to prevent needing to allocate a `String` each time
`UiView::view` gets called. This method `write`s a string into this buffer, and then uses
`StringViewSingleLine::view` to draw the string.

`StringViewSingleLine` comes from the `chargrid::text` module, which contains several
implementations of `chargrid::View` for rendering text.

Update `main.rs` to include the `ui` module:
```rust
// main.rs
...
mod ui;
...
```

Update `app.rs` to draw the UI.
The `UI_NUM_ROWS` constant configures how much of the screen to take up with the UI.
This reduces the size of the game area.

```rust
// app.rs
...
use crate::ui::{UiData, UiView};
use coord_2d::{Coord, Size};
...
const UI_NUM_ROWS: u32 = 2;
...
impl AppData {
    fn new(screen_size: Size, rng_seed: u64, visibility_algorithm: VisibilityAlgorithm) -> Self {
        let game_area_size = screen_size.set_height(screen_size.height() - UI_NUM_ROWS);
        Self {
            game_state: GameState::new(game_area_size, rng_seed, visibility_algorithm),
            visibility_algorithm,
        }
    }
    ...
}

struct AppView {
    ui_y_offset: i32,
    game_view: GameView,
    ui_view: UiView,
}

impl AppView {
    fn new(screen_size: Size) -> Self {
        const UI_Y_PADDING: u32 = 1;
        let ui_y_offset = (screen_size.height() - UI_NUM_ROWS + UI_Y_PADDING) as i32;
        Self {
            ui_y_offset,
            game_view: GameView::default(),
            ui_view: UiView::default(),
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
        self.game_view.view(&data.game_state, context, frame);
        let player_hit_points = data.game_state.player_hit_points();
        self.ui_view.view(
            UiData { player_hit_points },
            context.add_offset(Coord::new(0, self.ui_y_offset)),
            frame,
        );
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
            ...
            view: AppView::new(screen_size),
        }
    }
}
...
```

Update `game.rs` to expose a `player_hit_points` method:

```rust
// game.rs
...
use crate::world::{HitPoints, Location, Populate, Tile, World};
...
impl Game {
    ...
    pub fn player_hit_points(&self) -> HitPoints {
        self.world
            .hit_points(self.player_entity)
            .expect("player has no hit points")
    }
}
```

{% image health.png %}

Reference implementation branch: [part-7.0](https://github.com/gridbugs/chargrid-roguelike-tutorial-2020/tree/part-7.0)

## {% anchor pretty-health-bar | Pretty Health Bar %}

Now we'll colour the background of the health bar so it's filled based on the amount of health the player has.

```rust
// ui.rs
...
use chargrid::{
    decorator::{AlignView, Alignment, BoundView},
    render::{ColModify, Frame, Style, View, ViewCell, ViewContext},
    text::StringViewSingleLine,
};
use coord_2d::{Coord, Size};
use rgb24::Rgb24;

const HEALTH_WIDTH: u32 = 10;
const HEALTH_FILL_COLOUR: Rgb24 = Rgb24::new(200, 0, 0);
const HEALTH_EMPTY_COLOUR: Rgb24 = Rgb24::new(100, 0, 0);

...

impl View<UiData> for UiView {
    fn view<F: Frame, C: ColModify>(
        &mut self,
        data: UiData,
        context: ViewContext<C>,
        frame: &mut F,
    ) {
        use std::fmt::Write;
        self.buf.clear();
        write!(
            &mut self.buf,
            "{}/{}",
            data.player_hit_points.current, data.player_hit_points.max
        )
        .unwrap();
        let mut hit_points_text_view = BoundView {
            size: Size::new(HEALTH_WIDTH, 1),
            view: AlignView {
                alignment: Alignment::centre(),
                view: StringViewSingleLine::new(Style::new().with_foreground(Rgb24::new_grey(255))),
            },
        };
        hit_points_text_view.view(&self.buf, context.add_depth(1), frame);
        let mut health_fill_width =
            (data.player_hit_points.current * HEALTH_WIDTH) / data.player_hit_points.max;
        if data.player_hit_points.current > 0 {
            health_fill_width = health_fill_width.max(1);
        }
        for i in 0..health_fill_width {
            frame.set_cell_relative(
                Coord::new(i as i32, 0),
                0,
                ViewCell::new().with_background(HEALTH_FILL_COLOUR),
                context,
            );
        }
        for i in health_fill_width..HEALTH_WIDTH {
            frame.set_cell_relative(
                Coord::new(i as i32, 0),
                0,
                ViewCell::new().with_background(HEALTH_EMPTY_COLOUR),
                context,
            );
        }
    }
}
```

This shows an example of decorators. The `chargrid::decorator` module contains a collection
of implementations `chargrid::View` which wrap _other_ implementations of `chargrid::View`
and change the way they are rendered.

`BoundView` constrains the size of its contents.
`AlignView` centers its contents within its parent.
Together these are used to centre the text in the health bar.

{% image health-pretty.png %}

Reference implementation branch: [part-7.1](https://github.com/gridbugs/chargrid-roguelike-tutorial-2020/tree/part-7.1)

## {% anchor message-log | Message Log %}

Add a type representing the different types of messages that can appear in the log:

```rust
// game.rs
...
use crate::world::{HitPoints, Location, NpcType, Populate, Tile, World};
...

#[derive(Clone, Copy, Debug)]
pub enum LogMessage {
    PlayerAttacksNpc(NpcType),
    NpcAttacksPlayer(NpcType),
    PlayerKillsNpc(NpcType),
    NpcKillsPlayer(NpcType),
}
```

Add a message log to `GameState`, add an accessor method, and pass the message log to `maybe_move_character`.
At the moment all events worthy of the message log are triggered by `maybe_move_character`.

```rust
..
pub struct GameState {
    ...
    message_log: Vec<LogMessage>,
}

impl GameState {
    pub fn new(
        screen_size: Size,
        rng_seed: u64,
        initial_visibility_algorithm: VisibilityAlgorithm,
    ) -> Self {
        ...
        let mut game_state = Self {
            ...
            message_log: Vec::new(),
        };
        ...
    }
    ...
    pub fn maybe_move_player(&mut self, direction: CardinalDirection) {
        self.world
            .maybe_move_character(self.player_entity, direction, &mut self.message_log);
        self.ai_turn();
    }
    ...
    fn ai_turn(&mut self) {
        ...
        for (entity, agent) in self.ai_state.iter_mut() {
            ...
            match npc_action {
                NpcAction::Wait => (),
                NpcAction::Move(direction) => {
                    self.world
                        .maybe_move_character(entity, direction, &mut self.message_log)
                }
            }
        }
    }
    ...
    pub fn message_log(&self) -> &[LogMessage] {
        &self.message_log
    }
}
```

Update `maybe_move_character` to add to the message log:

```rust
// world.rs
...
use crate::game::LogMessage;
...
struct VictimDies;
...
impl World {
    ...
    fn write_combat_log_messages(
        attacker_is_player: bool,
        victim_dies: bool,
        npc_type: NpcType,
        message_log: &mut Vec<LogMessage>,
    ) {
        if attacker_is_player {
            if victim_dies {
                message_log.push(LogMessage::PlayerKillsNpc(npc_type));
            } else {
                message_log.push(LogMessage::PlayerAttacksNpc(npc_type));
            }
        } else {
            if victim_dies {
                message_log.push(LogMessage::NpcKillsPlayer(npc_type));
            } else {
                message_log.push(LogMessage::NpcAttacksPlayer(npc_type));
            }
        }
    }
    pub fn maybe_move_character(
        &mut self,
        character_entity: Entity,
        direction: CardinalDirection,
        message_log: &mut Vec<LogMessage>,
    ) {
        let character_coord = self
            .spatial_table
            .coord_of(character_entity)
            .expect("character has no coord");
        let new_character_coord = character_coord + direction.coord();
        if new_character_coord.is_valid(self.spatial_table.grid_size()) {
            let dest_layers = self.spatial_table.layers_at_checked(new_character_coord);
            if let Some(dest_character_entity) = dest_layers.character {
                let character_is_npc = self.components.npc_type.get(character_entity).cloned();
                let dest_character_is_npc =
                    self.components.npc_type.get(dest_character_entity).cloned();
                if character_is_npc.is_some() != dest_character_is_npc.is_some() {
                    let victim_dies = self.character_bump_attack(dest_character_entity).is_some();
                    let npc_type = character_is_npc.or(dest_character_is_npc).unwrap();
                    Self::write_combat_log_messages(
                        character_is_npc.is_none(),
                        victim_dies,
                        npc_type,
                        message_log,
                    );
                }
            } else if dest_layers.feature.is_none() {
                self.spatial_table
                    .update_coord(character_entity, new_character_coord)
                    .unwrap();
            }
        }
    }
    fn character_bump_attack(&mut self, victim: Entity) -> Option<VictimDies> {
        const DAMAGE: u32 = 1;
        if let Some(hit_points) = self.components.hit_points.get_mut(victim) {
            hit_points.current = hit_points.current.saturating_sub(DAMAGE);
            if hit_points.current == 0 {
                self.character_die(victim);
                return Some(VictimDies);
            }
        }
        None
    }
    ...
}
```

Now let's draw the message log.
Start by moving the rendering of the player's health bar into a new type `HealthView`:

```rust
// ui.rs
...
#[derive(Default)]
struct HealthView {
    buf: String,
}

impl View<HitPoints> for HealthView {
    fn view<F: Frame, C: ColModify>(
        &mut self,
        hit_points: HitPoints,
        context: ViewContext<C>,
        frame: &mut F,
    ) {
        use std::fmt::Write;
        self.buf.clear();
        write!(&mut self.buf, "{}/{}", hit_points.current, hit_points.max).unwrap();
        ...
    }
}
```

Add a simple helper function for mapping an NPC to a colour in `app.rs`, and make the `colours` mod public:
```rust
// app.rs
...
pub mod colours {
    use super::*;
    ...
    pub fn npc_colour(npc_type: NpcType) -> Rgb24 {
        match npc_type {
            NpcType::Orc => ORC,
            NpcType::Troll => TROLL,
        }
    }
}
```


Now define another type `MessageView` for rendering the message log:

```rust
// ui.rs
use crate::app::colours;
...
use crate::game::LogMessage;
...
use chargrid::{
    decorator::{AlignView, Alignment, BoundView},
    render::{ColModify, Frame, Style, View, ViewCell, ViewContext},
    text::{RichTextPartOwned, RichTextViewSingleLine, StringViewSingleLine},
};

...

struct MessagesView {
    buf: Vec<RichTextPartOwned>,
}

impl Default for MessagesView {
    fn default() -> Self {
        let common = RichTextPartOwned::new(String::new(), Style::new());
        Self {
            buf: vec![common.clone(), common.clone(), common],
        }
    }
}

impl<'a> View<&'a [LogMessage]> for MessagesView {
    fn view<F: Frame, C: ColModify>(
        &mut self,
        messages: &'a [LogMessage],
        context: ViewContext<C>,
        frame: &mut F,
    ) {
        fn format_message(buf: &mut [RichTextPartOwned], message: LogMessage) {
            use std::fmt::Write;
            use LogMessage::*;
            buf[0].text.clear();
            buf[1].text.clear();
            buf[2].text.clear();
            buf[0].style.foreground = Some(Rgb24::new_grey(255));
            buf[1].style.bold = Some(true);
            buf[2].style.foreground = Some(Rgb24::new_grey(255));
            match message {
                PlayerAttacksNpc(npc_type) => {
                    write!(&mut buf[0].text, "You attack the ").unwrap();
                    write!(&mut buf[1].text, "{}", npc_type.name()).unwrap();
                    buf[1].style.foreground = Some(colours::npc_colour(npc_type));
                    write!(&mut buf[2].text, ".").unwrap();
                }
                NpcAttacksPlayer(npc_type) => {
                    write!(&mut buf[0].text, "The ").unwrap();
                    write!(&mut buf[1].text, "{}", npc_type.name()).unwrap();
                    buf[1].style.foreground = Some(colours::npc_colour(npc_type));
                    write!(&mut buf[2].text, " attacks you.").unwrap();
                }
                PlayerKillsNpc(npc_type) => {
                    write!(&mut buf[0].text, "You kill the ").unwrap();
                    write!(&mut buf[1].text, "{}", npc_type.name()).unwrap();
                    buf[1].style.foreground = Some(colours::npc_colour(npc_type));
                    write!(&mut buf[2].text, ".").unwrap();
                }
                NpcKillsPlayer(npc_type) => {
                    write!(&mut buf[0].text, "THE ").unwrap();
                    buf[0].style.foreground = Some(Rgb24::new(255, 0, 0));
                    write!(&mut buf[1].text, "{}", npc_type.name()).unwrap();
                    buf[1].text.make_ascii_uppercase();
                    buf[1].style.foreground = Some(colours::npc_colour(npc_type));
                    write!(&mut buf[2].text, " KILLS YOU!").unwrap();
                    buf[2].style.foreground = Some(Rgb24::new(255, 0, 0));
                }
            }
        }
        const NUM_MESSAGES: usize = 4;
        let start_index = messages.len().saturating_sub(NUM_MESSAGES);
        for (i, &message) in (&messages[start_index..]).iter().enumerate() {
            format_message(&mut self.buf, message);
            let offset = Coord::new(0, i as i32);
            RichTextViewSingleLine.view(
                self.buf.iter().map(|part| part.as_rich_text_part()),
                context.add_offset(offset),
                frame,
            );
        }
    }
}
```

Similar to the `buf` field of `HealthView`, the `buf` field of `MessageView`
exists to prevent the need to allocate on each frame.
The `RichTextPartOwned` type from `chargrid::text` is a combination of a `String` and a `Style`
to apply to it. The `RichTextViewSingleLine` type, also from `chargrid::text`, implements
`chargrid::View` for iterators over rich text. It's used here to render messages about NPCs,
where the names of NPCs are colour coded to match their tiles.

The `UiView` type is now a combination of `HealthView` and `MessageView`:
```rust
pub struct UiData<'a> {
    pub player_hit_points: HitPoints,
    pub messages: &'a [LogMessage],
}

#[derive(Default)]
pub struct UiView {
    health_view: HealthView,
    messages_view: MessagesView,
}

impl<'a> View<UiData<'a>> for UiView {
    fn view<F: Frame, C: ColModify>(
        &mut self,
        data: UiData,
        context: ViewContext<C>,
        frame: &mut F,
    ) {
        self.health_view
            .view(data.player_hit_points, context, frame);
        let message_log_offset = Coord::new(HEALTH_WIDTH as i32 + 1, 0);
        self.messages_view
            .view(data.messages, context.add_offset(message_log_offset), frame);
    }
}
```

Update `app.rs` to leave room below for the message log. When calling `UiView::view`
inside `AppView::view`, populate the new `messages` field.

```rust
// app.rs
...
const UI_NUM_ROWS: u32 = 5;
...
impl<'a> View<&'a AppData> for AppView {
    fn view<F: Frame, C: ColModify>(
        &mut self,
        data: &'a AppData,
        context: ViewContext<C>,
        frame: &mut F,
    ) {
        self.game_view.view(&data.game_state, context, frame);
        let player_hit_points = data.game_state.player_hit_points();
        let messages = data.game_state.message_log();
        self.ui_view.view(
            UiData {
                player_hit_points,
                messages,
            },
            context.add_offset(Coord::new(0, self.ui_y_offset)),
            frame,
        );
    }
}
```

{% image screenshot-end.png %}

Reference implementation branch: [part-7.2](https://github.com/gridbugs/chargrid-roguelike-tutorial-2020/tree/part-7.2)

{% local roguelike-tutorial-2020-part-8 | Click here for the next part! %}
