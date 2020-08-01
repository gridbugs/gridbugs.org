---
layout: series-part
series: roguelike-tutorial-2020
index: 9
date: 2020-07-29 19:00:00 +1000
title: "Part 9 - Ranged Scrolls and Targeting"
permalink: /roguelike-tutorial-2020-part-9/
og_image: screenshot-end.png
---

In this part we'll introduce ranged scrolls and targeting.

By the end of this part it will be possible to launch fireballs and confusion spells.

{% image launch.png %}

This part is loosely based on [this part](http://rogueliketutorials.com/tutorials/tcod/part-9/) of the
python tcod tutorial.

Reference implementation branch for starting point: [part-8-end](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-8-end)

In this post:
 - [Examine Command](#examine-command)
 - [Fireball Scroll](#fireball-scroll)
 - [Launching Fireballs](#launching-fireballs)
 - [Confusion Scroll](#confusion-scroll)

## {% anchor examine-command | Examine Command %}

As a first step towards ranged abilities, add an examine command that lets th player
use the arrow keys and mouse to move a cursor over the game area.
We'll add a section to the UI for showing the name of the character or item at the
current cursor position.

We'll also allow the player to use the mouse to examine a cell during normal gameplay.

Add a type enumerating all the different results of examining a cell.

{% pygments rust %}
// game.rs
...
#[derive(Clone, Copy, Debug)]
pub enum ExamineCell {
    Npc(NpcType),
    NpcCorpse(NpcType),
    Item(ItemType),
    Player,
}
...
{% endpygments %}

Add a method to `World` for examining a cell.

{% pygments rust %}
// world.rs
...
use crate::game::{ExamineCell, LogMessage};
...
impl World {
...
    pub fn examine_cell(&self, coord: Coord) -> Option<ExamineCell> {
        let layers = self.spatial_table.layers_at(coord)?;
        layers
            .character
            .or_else(|| layers.object)
            .and_then(|entity| {
                self.components
                    .tile
                    .get(entity)
                    .and_then(|&tile| match tile {
                        Tile::Npc(npc_type) => Some(ExamineCell::Npc(npc_type)),
                        Tile::NpcCorpse(npc_type) => Some(ExamineCell::NpcCorpse(npc_type)),
                        Tile::Item(item_type) => Some(ExamineCell::Item(item_type)),
                        Tile::Player => Some(ExamineCell::Player),
                        _ => None,
                    })
            })
    }
}
{% endpygments %}

Add a method to `GameState` for examining a cell at a coordinate **if it is currently visible to the player**.
Also add a method returning the player's current coordinate which will come in handy soon.

{% pygments rust %}
// game.rs
...
impl GameState {
    ...
    pub fn player_coord(&self) -> Coord {
        self.world
            .entity_coord(self.player_entity)
            .expect("player has no coord")
    }
    ...
    pub fn examine_cell(&self, coord: Coord) -> Option<ExamineCell> {
        match self.visibility_grid.cell_visibility(coord) {
            CellVisibility::Currently => self.world.examine_cell(coord),
            _ => None,
        }
    }
}
{% endpygments %}

Update the UI to have it render the currently-examined cell (if any).
Also, when the cursor is controlled by the arrow keys, we'll display a string
to indicate what the cursor is for. Currently it will just be for examining cells,
but later it will be for aiming spells as well.

{% pygments rust %}
// ui.rs
...
use crate::game::{ExamineCell, LogMessage};
use chargrid::{
    decorator::{AlignView, Alignment, AlignmentX, AlignmentY, BoundView},
    text::{wrap, RichTextPartOwned, RichTextViewSingleLine, StringView, StringViewSingleLine},
    ...
};
...
fn examine_cell_str(examine_cell: ExamineCell) -> &'static str {
    match examine_cell {
        ExamineCell::Npc(npc_type) | ExamineCell::NpcCorpse(npc_type) => npc_type.name(),
        ExamineCell::Item(item_type) => item_type.name(),
        ExamineCell::Player => "yourself",
    }
}
...
pub struct UiData<'a> {
    ...
    pub name: Option<&'static str>,
    pub examine_cell: Option<ExamineCell>,
}
...
impl<'a> View<UiData<'a>> for UiView {
    fn view<F: Frame, C: ColModify>(
        &mut self,
        data: UiData,
        context: ViewContext<C>,
        frame: &mut F,
    ) {
        ...
        if let Some(name) = data.name {
            BoundView {
                size: Size::new(HEALTH_WIDTH, 1),
                view: AlignView {
                    alignment: Alignment::centre(),
                    view: StringViewSingleLine::new(
                        Style::new().with_foreground(Rgb24::new_grey(255)),
                    ),
                },
            }
            .view(name, context.add_offset(Coord::new(0, 1)), frame);
        }
        if let Some(examine_cell) = data.examine_cell {
            BoundView {
                size: Size::new(HEALTH_WIDTH, 2),
                view: AlignView {
                    alignment: Alignment {
                        x: AlignmentX::Centre,
                        y: AlignmentY::Bottom,
                    },
                    view: StringView::new(
                        Style::new().with_foreground(Rgb24::new_grey(187)),
                        wrap::Word::new(),
                    ),
                },
            }
            .view(
                examine_cell_str(examine_cell),
                context.add_offset(Coord::new(0, 2)),
                frame,
            );
        }
    }
}
{% endpygments %}

Add a field to `AppState` containing the current cursor position if any.

{% pygments rust %}
// app.rs
...
struct AppData {
    ...
    cursor: Option<Coord>,
}

impl AppData {
    fn new(screen_size: Size, rng_seed: u64, visibility_algorithm: VisibilityAlgorithm) -> Self {
        ...
        Self {
            ...
            cursor: None,
        }
    }
}
...
{% endpygments %}

Update `AppView::render_ui` to take the name of the current cursor mode, and have it render the cursor
and pass the result of examining the cell under the cursor to the UI renderer.

{% pygments rust %}
// app.rs
use chargrid::{
    render::{blend_mode, ColModify, ColModifyMap, Frame, Style, View, ViewCell, ViewContext},
}
...
impl AppView {
    ...
    fn render_ui<F: Frame, C: ColModify>(
        &mut self,
        name: Option<&'static str>,
        data: &AppData,
        context: ViewContext<C>,
        frame: &mut F,
    ) {
        ...
        let examine_cell = if let Some(cursor) = data.cursor {
            frame.blend_cell_background_relative(
                cursor,
                1,
                Rgb24::new_grey(255),
                127,
                blend_mode::LinearInterpolate,
                context,
            );
            data.game_state.examine_cell(cursor)
        } else {
            None
        };
        self.ui_view.view(
            UiData {
                player_hit_points,
                messages,
                name,
                examine_cell,
            },
            context.add_offset(Coord::new(0, self.ui_y_offset)),
            frame,
        );
    }
}
...
{% endpygments %}

Now go update all the places where `AppView::render_ui` gets called and pass `None` as its `name` argument.

Update `AppData::handle_input` so that moving the mouse during normal gameplay sets the cursor position,
and pressing a key clears the cursor. This will let the player use the mouse to examine cells, even when
not in "examine" mode.

{% pygments rust %}
// app.rs
...
use chargrid::{
    ...
    input::{keys, Input, KeyboardInput, MouseButton, MouseInput},
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
                }
                self.cursor = None;
            }
            Input::Mouse(mouse_input) => match mouse_input {
                MouseInput::MouseMove { coord, .. } => self.cursor = Some(coord),
                _ => (),
            },
        }
        ...
    }
}
{% endpygments %}

Add `TargetEventRoutine` - an `EventRoutine` in which the cursor can be controlled using the arrow keys as well
as the mouse. It has a string field which is the name of the target mode. This is the string that we'll show in
the bottom-left corner.

{% pygments rust %}
// app.rs
...
struct TargetEventRoutine {
    name: &'static str,
}

impl EventRoutine for TargetEventRoutine {
    type Return = Option<Coord>;
    type Data = AppData;
    type View = AppView;
    type Event = CommonEvent;

    fn handle<EP>(
        self,
        data: &mut Self::Data,
        _view: &Self::View,
        event_or_peek: EP,
    ) -> Handled<Self::Return, Self>
    where
        EP: EventOrPeek<Event = Self::Event>,
    {
        event_routine::event_or_peek_with_handled(event_or_peek, self, |s, event| {
            match event {
                CommonEvent::Input(input) => match input {
                    Input::Keyboard(key) => {
                        let delta = match key {
                            KeyboardInput::Left => Coord::new(-1, 0),
                            KeyboardInput::Right => Coord::new(1, 0),
                            KeyboardInput::Up => Coord::new(0, -1),
                            KeyboardInput::Down => Coord::new(0, 1),
                            keys::RETURN => {
                                let cursor = data.cursor;
                                data.cursor = None;
                                return Handled::Return(cursor);
                            }
                            keys::ESCAPE => {
                                data.cursor = None;
                                return Handled::Return(None);
                            }
                            _ => Coord::new(0, 0),
                        };
                        data.cursor = Some(
                            data.cursor
                                .unwrap_or_else(|| data.game_state.player_coord())
                                + delta,
                        );
                    }
                    Input::Mouse(mouse_input) => match mouse_input {
                        MouseInput::MouseMove { coord, .. } => data.cursor = Some(coord),
                        MouseInput::MousePress {
                            button: MouseButton::Left,
                            coord,
                        } => {
                            data.cursor = None;
                            return Handled::Return(Some(coord));
                        }
                        _ => (),
                    },
                },
                CommonEvent::Frame(_period) => (),
            };
            Handled::Continue(s)
        })
    }

    fn view<F, C>(
        &self,
        data: &Self::Data,
        view: &mut Self::View,
        context: ViewContext<C>,
        frame: &mut F,
    ) where
        F: Frame,
        C: ColModify,
    {
        view.game_view.view(&data.game_state, context, frame);
        view.render_ui(Some(self.name), &data, context, frame);
    }
}
...
{% endpygments %}

Now update `AppData::handle_input` again so that when the 'x' key is pressed, we run the `TargetEventRoutine`
so the player can examine cells moving the cursor with the arrow keys.

{% pygments rust %}
// app.rs
...
enum GameReturn {
    ...
    Examine,
}
...
impl AppData {
    ...
    fn handle_input(&mut self, input: Input) -> Option<GameReturn> {
        match input {
            Input::Keyboard(key) => {
                match key {
                    KeyboardInput::Char('x') => {
                        if self.cursor.is_none() {
                            self.cursor = Some(self.game_state.player_coord());
                        }
                        return Some(GameReturn::Examine);
                    }
                    ...
                }
                ...
            }
            ...
        }
        ...
    }
}
...
fn game_loop() -> impl EventRoutine<Return = (), Data = AppData, View = AppView, Event = CommonEvent>
{
    make_either!(Ei = A | B | C | D | E);
    Loop::new(|| {
        GameEventRoutine.and_then(|game_return| match game_return {
            ...
            GameReturn::Examine => Ei::E(TargetEventRoutine { name: "EXAMINE" }.map(|_| None)),
        })
    }).return_on_exit(|_| ())
}
...
{% endpygments %}

{% image examine.png %}

Reference implementation branch: [part-9.0](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-9.0)

## {% anchor place-fireball-scrolls | Place Fireball Scrolls %}

The first ranged item we'll add will be fireball scrolls. Add `FireballScroll` as a new item type.
{% pygments rust %}
// world.rs
...
pub enum ItemType {
    ...
    FireballScroll,
}

impl ItemType {
    pub fn name(self) -> &'static str {
        match self {
            ...
            Self::FireballScroll => "fireball scroll",
        }
    }
}

impl World {
    ...
    pub fn maybe_use_item(
        &mut self,
        character: Entity,
        inventory_index: usize,
        message_log: &mut Vec<LogMessage>,
    ) -> Result<(), ()> {
        ...
        match item_type {
            ...
            ItemType::FireballScroll => {
                println!("todo");
            }
        }
        Ok(())
    }
    ...
}
{% endpygments %}

{% pygments rust %}
// app.rs
...
pub mod colours {
    ...
    pub const FIREBALL_SCROLL: Rgb24 = Rgb24::new(255, 127, 0);
    ...
    pub fn item_colour(item_type: ItemType) -> Rgb24 {
        match item_type {
            ...
            ItemType::FireballScroll => FIREBALL_SCROLL,
        }
    }
}

fn currently_visible_view_cell_of_tile(tile: Tile) -> ViewCell {
    match tile {
        ...
        Tile::Item(ItemType::FireballScroll) => ViewCell::new()
            .with_character('♫')
            .with_foreground(colours::FIREBALL_SCROLL),
    }
}
...
{% endpygments %}

Update the dungeon generator to place fireball scrolls.
Generalize the logic which places health potions to place all items.
For now gives fireball scrolls a 100% chance of spawning to make it easier to test.

{% pygments rust %}
// terrain.rs
...
impl Room {
    ...
    // Place `n` items at random positions within the room
    fn place_items<R: Rng>(&self, n: usize, grid: &mut Grid<Option<TerrainTile>>, rng: &mut R) {
        for coord in self
            .coords()
            .filter(|&coord| grid.get_checked(coord).unwrap() == TerrainTile::Floor)
            .choose_multiple(rng, n)
        {
            let item = match rng.gen_range(0, 100) {
                0..=100 => ItemType::FireballScroll,
                _ => ItemType::HealthPotion,
            };
            *grid.get_checked_mut(coord) = Some(TerrainTile::Item(item));
        }
    }
}

pub fn generate_dungeon<R: Rng>(size: Size, rng: &mut R) -> Grid<TerrainTile> {
    ...
    const ITEMS_PER_ROOM_DISTRIBUTION: &[usize] = &[0, 0, 1, 1, 1, 1, 1, 2, 2];
    ...
    for _ in 0..NUM_ATTEMPTS {
        ...
        if room.only_intersects_empty(&grid) {
            ...
            // Add items to the room
            let &num_items = ITEMS_PER_ROOM_DISTRIBUTION.choose(rng).unwrap();
            room.place_items(num_items, &mut grid, rng);
        }
    }
    ...
}
{% endpygments %}

At this point you should be able to pick up fireball scrolls. When you use them the game will
just print the text "todo" to stdout.

{% image fireball-scroll.png %}

Reference implementation branch: [part-9.1](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-9.1)

## {% anchor launching-fireballs | Launching Fireballs %}

Now let's make it possible to shoot fireballs when a fireball scroll is read.
Rather than just teleporting the fireball to its target, let's animate it moving along its trajectory.

In the previous section we just printed "todo" when a fireball scroll was used.
Instead, we'd like the game to bring up the targeting AI, and when the user selects a target,
shoot a fireball towards it. If the fireball hits a solid object along the way it should stop,
and if the solid object is a character they should take damage.

When a health potion is used it is used immediately, but when a fireball scroll is used we display a UI.
Let's codify the different ways in which an item can be used:

{% pygments rust %}
// world.rs
...
#[derive(Clone, Copy)]
pub enum ItemUsage {
    Immediate,
    Aim,
}
...
{% endpygments %}

Update item-usage methods to return the `ItemUsage` of the item being used.
Previously we made the assumption that when an item is used, it is immediately
removed from the inventory, but this is only true for items whose usage is `Immediate`.
Update `maybe_use_item` to reflect this while we're at it.
We'll need to implement `Inventory::get`.

{% pygments rust %}
// world.rs
...
impl Inventory {
    ...
    pub fn get(&self, index: usize) -> Result<Entity, InventorySlotIsEmpty> {
        self.slots
            .get(index)
            .cloned()
            .flatten()
            .ok_or(InventorySlotIsEmpty)
    }
}
...
impl World {
    ...
    pub fn maybe_use_item(
        &mut self,
        character: Entity,
        inventory_index: usize,
        message_log: &mut Vec<LogMessage>,
    ) -> Result<ItemUsage, ()> {
        let inventory = self
            .components
            .inventory
            .get_mut(character)
            .expect("character has no inventory");
        let item = match inventory.get(inventory_index) {
            Ok(item) => item,
            Err(InventorySlotIsEmpty) => {
                message_log.push(LogMessage::NoItemInInventorySlot);
                return Err(());
            }
        };
        let &item_type = self
            .components
            .item
            .get(item)
            .expect("non-item in inventory");
        let usage = match item_type {
            ItemType::HealthPotion => {
                let mut hit_points = self
                    .components
                    .hit_points
                    .get_mut(character)
                    .expect("character has no hit points");
                const HEALTH_TO_HEAL: u32 = 5;
                hit_points.current = hit_points.max.min(hit_points.current + HEALTH_TO_HEAL);
                inventory.remove(inventory_index).unwrap();
                message_log.push(LogMessage::PlayerHeals);
                ItemUsage::Immediate
            }
            ItemType::FireballScroll => ItemUsage::Aim,
        };
        Ok(usage)
    }
    ...
}
{% endpygments %}

{% pygments rust %}
// game.rs
...
use crate::world::{
    HitPoints, Inventory, ItemType, ItemUsage, Location, NpcType, Populate, ProjectileType, Tile,
    World,
};
...
impl GameState {
    ...
    pub fn maybe_player_use_item(&mut self, inventory_index: usize) -> Result<ItemUsage, ()> {
        let result =
            self.world
                .maybe_use_item(self.player_entity, inventory_index, &mut self.message_log);
        if let Ok(usage) = result {
            match usage {
                ItemUsage::Immediate => self.ai_turn(),
                ItemUsage::Aim => (),
            }
        }
        result
    }
    ...
}
{% endpygments %}

Update the `use_item()` `EventRoutine` to invoke the target `EventRoutine` when the player uses an item
whose usage is `Aim`. Note the not-yet-implemented `GameState::maybe_player_use_item_aim` being called here,
which will actually launch the fireball.

{% pygments rust %}
// app.rs
...
use chargrid::{
    ...
    event_routine::{
        self,
        common_event::{CommonEvent, Delay},
        make_either, DataSelector, Decorate, EventOrPeek, EventRoutine, EventRoutineView, Handled,
        Loop, SideEffect, SideEffectThen, Value, ViewSelector,
    },
    ...
};
...
fn use_item() -> impl EventRoutine<Return = (), Data = AppData, View = AppView, Event = CommonEvent>
{
    make_either!(Ei = A | B);
    Loop::new(|| {
        inventory_slot_menu("Use Item").and_then(|result| match result {
            Err(menu::Escape) => Ei::A(Value::new(Some(()))),
            Ok(entry) => Ei::B(SideEffectThen::new_with_view(
                move |data: &mut AppData, _: &_| {
                    make_either!(Ei = A | B | C);
                    if let Ok(usage) = data.game_state.maybe_player_use_item(entry.index) {
                        match usage {
                            ItemUsage::Immediate => Ei::A(Value::new(Some(()))),
                            ItemUsage::Aim => Ei::B(TargetEventRoutine { name: "AIM" }.and_then(
                                move |maybe_coord| {
                                    SideEffect::new_with_view(move |data: &mut AppData, _: &_| {
                                        if let Some(coord) = maybe_coord {
                                            if data
                                                .game_state
                                                .maybe_player_use_item_aim(entry.index, coord)
                                                .is_ok()
                                            {
                                                Some(())
                                            } else {
                                                None
                                            }
                                        } else {
                                            None
                                        }
                                    })
                                },
                            )),
                        }
                    } else {
                        Ei::C(Value::new(None))
                    }
                },
            )),
        })
    })
}
...
{% endpygments %}

Implement `GameState::maybe_player_use_item_aim`.

{% pygments rust %}
// game.rs
...
impl GameState {
    ...
    pub fn maybe_player_use_item_aim(
        &mut self,
        inventory_index: usize,
        target: Coord,
    ) -> Result<(), ()> {
        self.world.maybe_use_item_aim(
            self.player_entity,
            inventory_index,
            target,
            &mut self.message_log,
        )
    }
    ...
}
{% endpygments %}

And implement `World::maybe_use_item_aim`. This function assumes it's called on a sensible
item (e.g. you don't try to aim a health potion). The game is implemented such that it should
be impossible to call this method on an invalid item, so this function panics in this case.
Should that panic ever execute, a bug has occurred at some point prior, and we shouldn't try
to continue running the game.

{% pygments rust %}
// world.rs
...
impl World {
    ...
    pub fn maybe_use_item_aim(
        &mut self,
        character: Entity,
        inventory_index: usize,
        target: Coord,
        message_log: &mut Vec<LogMessage>,
    ) -> Result<(), ()> {
        let character_coord = self.spatial_table.coord_of(character).unwrap();
        if character_coord == target {
            return Err(());
        }
        let inventory = self
            .components
            .inventory
            .get_mut(character)
            .expect("character has no inventory");
        let item_entity = inventory.remove(inventory_index).unwrap();
        let &item_type = self.components.item.get(item_entity).unwrap();
        match item_type {
            ItemType::HealthPotion => panic!("invalid item for aim"),
            ItemType::FireballScroll => {
                message_log.push(LogMessage::PlayerLaunchesProjectile(
                    ProjectileType::Fireball,
                ));
                self.spawn_projectile(character_coord, target, ProjectileType::Fireball);
            }
        }
        Ok(())
    }
    ...
}
{% endpygments %}

Two things in the above code haven't been defined yet:
- the `LogMessage::PlayerLaunchesProjectile` variant
- the `World::spawn_projectile` method

Add the log message types.

{% pygments rust %}
// game.rs
...
use crate::world::{
    HitPoints, Inventory, ItemType, ItemUsage, Location, NpcType, Populate, ProjectileType, Tile,
    World,
};
...
pub enum LogMessage {
    ...
    PlayerLaunchesProjectile(ProjectileType),
}
...
{% endpygments %}

This depends on a new type `ProjectileType`. Add it to `world.rs`.

{% pygments rust %}
// world.rs
...
#[derive(Clone, Copy, Debug)]
pub enum ProjectileType {
    Fireball,
}

impl ProjectileType {
    pub fn name(self) -> &'static str {
        match self {
            Self::Fireball => "fireball",
        }
    }
}
...
{% endpygments %}

Handle the new type of log message.

{% pygments rust %}
// ui.rs
...
impl<'a> View<&'a [LogMessage]> for MessagesView {
    fn view<F: Frame, C: ColModify>(
        &mut self,
        messages: &'a [LogMessage],
        context: ViewContext<C>,
        frame: &mut F,
    ) {
        fn format_message(buf: &mut [RichTextPartOwned], message: LogMessage) {
            ...
            match message {
                ...
                PlayerLaunchesProjectile(projectile) => {
                    write!(&mut buf[0].text, "You launch a ").unwrap();
                    write!(&mut buf[1].text, "{}", projectile.name()).unwrap();
                    buf[1].style.foreground = Some(colours::projectile_colour(projectile));
                    write!(&mut buf[2].text, "!").unwrap();
                }
            }
        }
        ...
    }
}
...
{% endpygments %}

This depends on `colour::projectile_colour`. Define it.

{% pygments rust %}
// app.rs
...
use crate::world::{ItemType, ItemUsage, Layer, NpcType, ProjectileType, Tile};
...
pub mod colours {
    pub fn projectile_colour(projcetile_type: ProjectileType) -> Rgb24 {
        match projcetile_type {
            ProjectileType::Fireball => FIREBALL_SCROLL,
        }
    }
}
...
{% endpygments %}

Jumping all over the codebase today.

Back in `world.rs`, define the `spawn_projectile` method.
Add a `projectile` component storing a `ProjectileType`, a `Projectile` tile, and a `projcetile` layer.
Also add a `trajectory` component for storing the motion path of a projectile.

{% pygments rust %}
// world.rs
...
use line_2d::CardinalStepIter;
...
pub enum Tile {
    ...
    Projectile(ProjectileType),
}

entity_table::declare_entity_module! {
    components {
        ...
        trajectory: CardinalStepIter,
        projectile: ProjectileType,
    }
}
...
spatial_table::declare_layers_module! {
    layers {
        ...
        projectile: Projectile,
    }
}
...
impl World {
    ...
    fn spawn_projectile(&mut self, from: Coord, to: Coord, projectile_type: ProjectileType) {
        let entity = self.entity_allocator.alloc();
        self.spatial_table
            .update(
                entity,
                Location {
                    coord: from,
                    layer: Some(Layer::Projectile),
                },
            )
            .unwrap();
        self.components
            .tile
            .insert(entity, Tile::Projectile(projectile_type));
        self.components.projectile.insert(entity, projectile_type);
        self.components
            .trajectory
            .insert(entity, CardinalStepIter::new(to - from));
    }
    ...
}
{% endpygments %}

Note the `CardinalStepIter` type. This is an iterator over the coordinates along
a line segment between 2 points, only taking steps in cardinal directions.
We'll use it to compute the path followed by a projectile.

Handle the new tile type and new layer in `app.rs`:

{% pygments rust %}
// app.rs
...
impl<'a> View<&'a GameState> for GameView {
    fn view<F: Frame, C: ColModify>(
        &mut self,
        game_state: &'a GameState,
        context: ViewContext<C>,
        frame: &mut F,
    ) {
        for entity_to_render in game_state.entities_to_render() {
            ...
            let depth = match entity_to_render.location.layer {
                ...
                Some(Layer::Projectile) => 4,
            };
            ...
        }
    }
}
...
fn currently_visible_view_cell_of_tile(tile: Tile) -> ViewCell {
    match tile {
        ...
        Tile::Projectile(ProjectileType::Fireball) => ViewCell::new()
            .with_character('*')
            .with_foreground(colours::FIREBALL_SCROLL),
    }
}
...
{% endpygments %}

Add a method to `World` for moving all projectiles one step along their motion path.

{% pygments rust %}
// world.rs
...
impl World {
    ...
    pub fn move_projectiles(&mut self, message_log: &mut Vec<LogMessage>) {
        let mut entities_to_remove = Vec::new();
        let mut fireball_hit = Vec::new();
        for (entity, trajectory) in self.components.trajectory.iter_mut() {
            if let Some(direction) = trajectory.next() {
                let current_coord = self.spatial_table.coord_of(entity).unwrap();
                let new_coord = current_coord + direction.coord();
                let dest_layers = self.spatial_table.layers_at_checked(new_coord);
                if dest_layers.feature.is_some() {
                    entities_to_remove.push(entity);
                } else if let Some(character) = dest_layers.character {
                    entities_to_remove.push(entity);
                    if let Some(&projectile_type) = self.components.projectile.get(entity) {
                        match projectile_type {
                            ProjectileType::Fireball => {
                                fireball_hit.push(character);
                            }
                        }
                    }
                }

                // ignore collisiosns of projectiles
                let _ = self.spatial_table.update_coord(entity, new_coord);
            } else {
                entities_to_remove.push(entity);
            }
        }
        for entity in entities_to_remove {
            self.remove_entity(entity);
        }
        for entity in fireball_hit {
            let maybe_npc = self.components.npc_type.get(entity).cloned();
            if let Some(VictimDies) = self.character_damage(entity, 2) {
                if let Some(npc) = maybe_npc {
                    message_log.push(LogMessage::NpcDies(npc));
                }
            }
        }
    }
    ...
}
{% endpygments %}

This requires some generalizations of our combat logic,
in particular adding a `character_damage` method, extracting this logic from `character_bump_attack`.

{% pygments rust %}
// world.rs
...
impl World {
    ...
    fn character_bump_attack(&mut self, victim: Entity) -> Option<VictimDies> {
        self.character_damage(victim, 1)
    }

    fn character_damage(&mut self, victim: Entity, damage: u32) -> Option<VictimDies> {
        if let Some(hit_points) = self.components.hit_points.get_mut(victim) {
            hit_points.current = hit_points.current.saturating_sub(damage);
            if hit_points.current == 0 {
                self.character_die(victim);
                return Some(VictimDies);
            }
        }
        None
    }
    ...
}
{% endpygments %}

If an NPC is killed by a fireball, a new log message `NpcDies` is generated.
Add it.

{% pygments rust %}
// game.rs
...
pub enum LogMessage {
    ...
    NpcDies(NpcType),
}
...
{% endpygments %}

And handle it.

{% pygments rust %}
// ui.rs
...
impl<'a> View<&'a [LogMessage]> for MessagesView {
    fn view<F: Frame, C: ColModify>(
        &mut self,
        messages: &'a [LogMessage],
        context: ViewContext<C>,
        frame: &mut F,
    ) {
        fn format_message(buf: &mut [RichTextPartOwned], message: LogMessage) {
            ...
            match message {
                ...
                NpcDies(npc_type) => {
                    write!(&mut buf[0].text, "The ").unwrap();
                    write!(&mut buf[1].text, "{}", npc_type.name()).unwrap();
                    buf[1].style.foreground = Some(colours::npc_colour(npc_type));
                    write!(&mut buf[2].text, " dies.").unwrap();
                }
            }
        }
        ...
    }
}
...

{% endpygments %}

{% pygments rust %}
// world.rs
{% endpygments %}

Add a method to `World` for testing whether there are any projectiles.
We're about to add a simple realtime animation system, and we want an easy way to check
whether any animations are in progress so controls can be ignored while animations are playing.

{% pygments rust %}
// world.rs
...
impl World {
    ...
    pub fn has_projectiles(&self) -> bool {
        !self.components.trajectory.is_empty()
    }
    ...
}
{% endpygments %}

Add animation methods to `GameState`, and prevent the player from acting while animations are in progress.

{% pygments rust %}
// game.rs
...
impl GameState {
    pub fn tick_animations(&mut self) {
        self.world.move_projectiles(&mut self.message_log)
    }
    fn has_animations(&self) -> bool {
        self.world.has_projectiles()
    }
    ...
    pub fn wait_player(&mut self) {
        if self.has_animations() {
            return;
        }
        ...
    }
    pub fn maybe_move_player(&mut self, direction: CardinalDirection) {
        if self.has_animations() {
            return;
        }
        ...
    }
    pub fn maybe_player_get_item(&mut self) {
        if self.has_animations() {
            return;
        }
        ...
    }
    pub fn maybe_player_use_item(&mut self, inventory_index: usize) -> Result<ItemUsage, ()> {
        if self.has_animations() {
            return Err(());
        }
        ...
    }
    ...
}
{% endpygments %}

Now we need to periodically tick animations by calling `GameState::tick_animations`.
Let's only progress animations during normal gameplay, at a rate of 30 FPS (regardless of the game's actual framerate).
Since the game is likely running at a higher framerate, we need to keep track of the passage of time, and only progress
animations very 33ms. Game ticks are sent to `EventRoutine`s in the form of `CommonEvent::Frame(period)` events,
where `period` is a `std::time::Duration` containing the amount of time that has passed since the previous frame.
Ticks are generally synchronized to the display's framerate, but this is not a necessity and you shouldn't rely on it.

{% pygments rust %}
// app.rs
...
const BETWEEN_ANIMATION_TICKS: Duration = Duration::from_millis(33);
...
struct AppData {
    ...
    until_next_animation_tick: Duration,
}

impl AppData {
    fn new(screen_size: Size, rng_seed: u64, visibility_algorithm: VisibilityAlgorithm) -> Self {
        ...
        Self {
            ...
            until_next_animation_tick: Duration::from_millis(0),
        }
    }
    ...
}
...
impl EventRoutine for GameEventRoutine {
    type Return = GameReturn;
    type Data = AppData;
    type View = AppView;
    type Event = CommonEvent;

    fn handle<EP>(
        self,
        data: &mut Self::Data,
        _view: &Self::View,
        event_or_peek: EP,
    ) -> Handled<Self::Return, Self>
    where
        EP: EventOrPeek<Event = Self::Event>,
    {
        event_routine::event_or_peek_with_handled(event_or_peek, self, |s, event| match event {
            CommonEvent::Input(input) => {
                ...
            }
            CommonEvent::Frame(period) => {
                if let Some(until_next_animation_tick) =
                    data.until_next_animation_tick.checked_sub(period)
                {
                    data.until_next_animation_tick = until_next_animation_tick;
                } else {
                    data.until_next_animation_tick = BETWEEN_ANIMATION_TICKS;
                    data.game_state.tick_animations();
                }
                Handled::Continue(s)
            }
        })
    }
    ...
}
{% endpygments %}

And that should do it.
Try picking up a fireball scroll and using it via the inventory menu.
You'll be presented with an "AIM" target ui.
Target an NPC and hit the enter key or press the left mouse button.

{% image aim.png %}

A fireball will appear, and in _realtime_ move towards the NPC.

{% image launch.png %}

When it hits them, they'll take damage and possibly die.

{% image hit.png %}

Reference implementation branch: [part-9.2](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-9.2)

## {% anchor confusion-scroll | Confusion Scroll %}

Add a `ConfusionScroll` item, and `Confusion` projectile.

{% pygments rust %}
// world.rs
...
pub enum ProjectileType {
    ...
    Confusion,
}
...
impl ProjectileType {
    pub fn name(self) -> &'static str {
        match self {
            ...
            Self::Confusion => "confusion spell",
        }
    }
}
pub enum ItemType {
    ...
    ConfusionScroll,
}
impl ItemType {
    pub fn name(self) -> &'static str {
        match self {
            ...
            Self::ConfusionScroll => "confusion scroll",
        }
    }
}
...
{% endpygments %}

Add rendering logic for the new item and projectile.

{% pygments rust %}
// app.rs
...
pub mod colours {
    ...
    pub const CONFUSION_SCROLL: Rgb24 = Rgb24::new(187, 0, 255);
    ...
    pub fn item_colour(item_type: ItemType) -> Rgb24 {
        match item_type {
            ...
            ItemType::ConfusionScroll => CONFUSION_SCROLL,
        }
    }

    pub fn projectile_colour(projcetile_type: ProjectileType) -> Rgb24 {
        match projcetile_type {
            ...
            ProjectileType::Confusion => CONFUSION_SCROLL,
        }
    }
}
...
fn currently_visible_view_cell_of_tile(tile: Tile) -> ViewCell {
    match tile {
        ...
        Tile::Item(ItemType::ConfusionScroll) => ViewCell::new()
            .with_character('♫')
            .with_foreground(colours::CONFUSION_SCROLL),
        Tile::Projectile(ProjectileType::Fireball) => ViewCell::new()
            .with_character('*')
            .with_foreground(colours::FIREBALL_SCROLL),
        Tile::Projectile(ProjectileType::Confusion) => ViewCell::new()
            .with_character('*')
            .with_foreground(colours::CONFUSION_SCROLL),
    }
}
{% endpygments %}

Place confusion scrolls during dungeon generation. Also rebalance the probabilities of items
such that health potions may appear again.

{% pygments rust %}
// terrain.rs
...
impl Room {
    ...
    // Place `n` items at random positions within the room
    fn place_items<R: Rng>(&self, n: usize, grid: &mut Grid<Option<TerrainTile>>, rng: &mut R) {
        for coord in self
            .coords()
            .filter(|&coord| grid.get_checked(coord).unwrap() == TerrainTile::Floor)
            .choose_multiple(rng, n)
        {
            let item = match rng.gen_range(0, 100) {
                0..=29 => ItemType::FireballScroll,
                30..=49 => ItemType::ConfusionScroll,
                _ => ItemType::HealthPotion,
            };
            *grid.get_checked_mut(coord) = Some(TerrainTile::Item(item));
        }
    }
}
{% endpygments %}

When a character becomes confused, they will move randomly for 5 turns. To keep track of the number of turns
until a confused character recovers, add a `confusion_countdown` component. Entities which have this component
will be considered to be confused, and it will also track the time until recovery.

{% pygments rust %}
// world.rs
...
entity_table::declare_entity_module! {
    components {
        ...
        confusion_countdown: u32,
    }
}
..
{% endpygments %}

Set the `UsageType` for confusion scrolls, spawn a projectile when a confusion scroll is used, and set what happens
when a confusion spell hits an NPC.

{% pygments rust %}
// world.rs
...
impl World {
    ...
    pub fn maybe_use_item(
        &mut self,
        character: Entity,
        inventory_index: usize,
        message_log: &mut Vec<LogMessage>,
    ) -> Result<ItemUsage, ()> {
        ...
        let usage = match item_type {
            ...
            ItemType::FireballScroll | ItemType::ConfusionScroll => ItemUsage::Aim,
        };
        ...
    }
    ...
    pub fn maybe_use_item_aim(
        &mut self,
        character: Entity,
        inventory_index: usize,
        target: Coord,
        message_log: &mut Vec<LogMessage>,
    ) -> Result<(), ()> {
        ...
        match item_type {
            ...
            ItemType::ConfusionScroll => {
                message_log.push(LogMessage::PlayerLaunchesProjectile(
                    ProjectileType::Confusion,
                ));
                self.spawn_projectile(character_coord, target, ProjectileType::Confusion);
            }
        }
        Ok(())
    }
    ...
    pub fn move_projectiles(&mut self, message_log: &mut Vec<LogMessage>) {
        ...
        let mut confusion_hit = Vec::new();
        for (entity, trajectory) in self.components.trajectory.iter_mut() {
            if let Some(direction) = trajectory.next() {
                if dest_layers.feature.is_some() {
                    ...
                } else if let Some(character) = dest_layers.character {
                    entities_to_remove.push(entity);
                    if let Some(&projectile_type) = self.components.projectile.get(entity) {
                        match projectile_type {
                            ...
                            ProjectileType::Confusion => {
                                confusion_hit.push(character);
                            }
                        }
                    }
                }
                ...
            }
        }
        ...
        for entity in confusion_hit {
            self.components.confusion_countdown.insert(entity, 5);
            if let Some(&npc_type) = self.components.npc_type.get(entity) {
                message_log.push(LogMessage::NpcBecomesConfused(npc_type));
            }
        }
    }
}
{% endpygments %}

Add and handle log messages for becoming confused and recovering.


{% pygments rust %}
// game.rs
...
pub enum LogMessage {
    ...
    NpcBecomesConfused(NpcType),
    NpcIsNoLongerConfused(NpcType),
}
...
{% endpygments %}

{% pygments rust %}
// ui.rs
...
impl<'a> View<&'a [LogMessage]> for MessagesView {
    fn view<F: Frame, C: ColModify>(
        &mut self,
        messages: &'a [LogMessage],
        context: ViewContext<C>,
        frame: &mut F,
    ) {
        fn format_message(buf: &mut [RichTextPartOwned], message: LogMessage) {
            ...
            match message {
                ...
                NpcBecomesConfused(npc_type) => {
                    write!(&mut buf[0].text, "The ").unwrap();
                    write!(&mut buf[1].text, "{}", npc_type.name()).unwrap();
                    buf[1].style.foreground = Some(colours::npc_colour(npc_type));
                    write!(&mut buf[2].text, " is confused.").unwrap();
                }
                NpcIsNoLongerConfused(npc_type) => {
                    write!(&mut buf[0].text, "The ").unwrap();
                    write!(&mut buf[1].text, "{}", npc_type.name()).unwrap();
                    buf[1].style.foreground = Some(colours::npc_colour(npc_type));
                    write!(&mut buf[2].text, "'s confusion passes.").unwrap();
                }
            }
        }
        ...
    }
}
{% endpygments %}

Now let's update movement logic such that confused characters move in random directions.
To use the `Rng` trait to select a random direction, we need to enable the optional `rand`
feature of the `direction` crate.

{% pygments toml %}
# Cargo.toml
[dependencies]
...
direction = { version = "0.17", features = ["rand"] }
{% endpygments %}

In `game.rs`, start passing a rng to `World::maybe_move_character`.

{% pygments rust %}
// game.rs
...
impl GameState {
    ...
    pub fn maybe_move_player(&mut self, direction: CardinalDirection) {
        ...
        self.world.maybe_move_character(
            self.player_entity,
            direction,
            &mut self.message_log,
            &mut self.rng,
        );
        ...
    }
    ...
    fn ai_turn(&mut self) {
        ...
        for (entity, agent) in self.ai_state.iter_mut() {
            ...
            match npc_action {
                ...
                NpcAction::Move(direction) => self.world.maybe_move_character(
                    entity,
                    direction,
                    &mut self.message_log,
                    &mut self.rng,
                ),
            }
        }
    }
    ...
}
{% endpygments %}

And update `World::maybe_move_character` to take an rng as an argument and use it
to move characters randomly when they are confused, also decreasing, and eventually removing,
their `confusion_countdown` component.

{% pygments rust %}
// world.rs
...
impl World {
    ...
    pub fn maybe_move_character<R: Rng>(
        &mut self,
        character_entity: Entity,
        direction: CardinalDirection,
        message_log: &mut Vec<LogMessage>,
        rng: &mut R,
    ) {
        let character_coord = self
            .spatial_table
            .coord_of(character_entity)
            .expect("character has no coord");
        let direction = if let Some(confusion_countdown) = self
            .components
            .confusion_countdown
            .get_mut(character_entity)
        {
            if *confusion_countdown == 0 {
                self.components.confusion_countdown.remove(character_entity);
                if let Some(&npc_type) = self.components.npc_type.get(character_entity) {
                    message_log.push(LogMessage::NpcIsNoLongerConfused(npc_type));
                }
            } else {
                *confusion_countdown -= 1;
            }
            rng.gen()
        } else {
            direction
        };
        let new_character_coord = character_coord + direction.coord();
        ...
    }
    ...
}
{% endpygments %}

It's now possible to launch confusion spells in the same way as you launch fireballs.
NPCs hit with confusion spells move randomly for their next 5 turns.

{% image confusion.png %}

Reference implementation branch: [part-9.3](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-9.3)
