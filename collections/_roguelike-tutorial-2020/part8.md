---
layout: series-part
series: roguelike-tutorial-2020
index: 8
date: 2020-07-29 18:00:00 +1000
title: "Part 8 - Items and Inventory"
permalink: /roguelike-tutorial-2020-part-8/
og_image: item-menu.png
---

In this part we'll introduce items, and add an inventory menu.

By the end of this part you'll be able to pick up, use, and drop items.

{% image item-menu.png %}

<!--more-->

This part is loosely based on [this part](http://rogueliketutorials.com/tutorials/tcod/part-8/) of the
python tcod tutorial.

Reference implementation branch for starting point: [part-7-end](https://github.com/gridbugs/chargrid-roguelike-tutorial-2020/tree/part-7-end)

In this post:
 - [Placing Health Potions](#placing-health-potions)
 - [Adding Items to Inventory](#adding-items-to-inventory)
 - [Using and Dropping Items](#using-and-dropping-items)
 - [Event Routine Intro](#event-routine-intro)
 - [State Machine Management with Event Routines](#state-machine-management-with-event-routines)
 - [Death Screen](#death-screen)

## {% anchor placing-health-potions | Placing Health Potions %}

In a previous section we added a layer to the spatial grid for corpses.
Generalize this into what we'll call "objects", which consist of corpses and items, which will be introduced in this part.
The implication of this is that corpses and items cannot exist in the same game cell, which will simplify some gameplay logic.

```rust
// world.rs
...
spatial_table::declare_layers_module! {
    layers {
        floor: Floor,
        character: Character,
        object: Object,
        feature: Feature,
    }
}
...
impl World {
    ...
    fn character_die(&mut self, entity: Entity) {
        if let Some(occpied_by_entity) = self
            .spatial_table
            .update_layer(entity, Layer::Object)
            .err()
            .map(|e| e.unwrap_occupied_by())
        {
            // If a character dies on a cell which contains an object, remove the existing object
            // from existence and replace it with the character's corpse.
            self.remove_entity(occpied_by_entity);
            self.spatial_table
                .update_layer(entity, Layer::Object)
                .unwrap();
        }
        ...
    }
    ...
}
```

```rust
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
                None => -1,
                Some(Layer::Floor) => 0,
                Some(Layer::Feature) => 1,
                Some(Layer::Object) => 2,
                Some(Layer::Character) => 3,
            };
            ...
        }
    }
}
```

Now make it possible to represent items, using health potions as our first item.

```rust
// world.rs
...
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ItemType {
    HealthPotion,
}

impl ItemType {
    pub fn name(self) -> &'static str {
        match self {
            Self::HealthPotion => "health potion",
        }
    }
}
...
#[derive(Clone, Copy, Debug)]
pub enum Tile {
    ...
    Item(ItemType),
}
...
entity_table::declare_entity_module! {
    components {
        item: ItemType,
    }
}
...
impl World {
    ...
    fn spawn_item(&mut self, coord: Coord, item_type: ItemType) {
        let entity = self.entity_allocator.alloc();
        self.spatial_table
            .update(
                entity,
                Location {
                    coord,
                    layer: Some(Layer::Object),
                },
            )
            .unwrap();
        self.components.tile.insert(entity, Tile::Item(item_type));
        self.components.item.insert(entity, item_type);
    }
    ...
}
...
```

Place health potions during terrain generation.

```rust
// terrain.rs
use crate::world::{ItemType, NpcType};
...
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum TerrainTile {
    ...
    Item(ItemType),
}
...
impl Room {
    ...
    // Place `n` health potions random positions within the room
    fn place_health_potions<R: Rng>(
        &self,
        n: usize,
        grid: &mut Grid<Option<TerrainTile>>,
        rng: &mut R,
    ) {
        for coord in self
            .coords()
            .filter(|&coord| grid.get_checked(coord).unwrap() == TerrainTile::Floor)
            .choose_multiple(rng, n)
        {
            *grid.get_checked_mut(coord) = Some(TerrainTile::Item(ItemType::HealthPotion));
        }
    }
}
...
pub fn generate_dungeon<R: Rng>(size: Size, rng: &mut R) -> Grid<TerrainTile> {
    ...
    const HEALTH_POTIONS_PER_ROOM_DISTRIBUTION: &[usize] = &[0, 0, 1, 1, 1, 1, 1, 2, 2];
    ...
    for _ in 0..NUM_ATTEMPTS {
        ...
        // Add health potions to the room
        let &num_health_potions = HEALTH_POTIONS_PER_ROOM_DISTRIBUTION.choose(rng).unwrap();
        room.place_health_potions(num_health_potions, &mut grid, rng);
    }
}
```

```rust
// world.rs
...
impl World {
    ...
    pub fn populate<R: Rng>(&mut self, rng: &mut R) -> Populate {
        ...
        for (coord, &terrain_tile) in terrain.enumerate() {
            match terrain_tile {
                ...
                TerrainTile::Item(item_type) => {
                    self.spawn_item(coord, item_type);
                    self.spawn_floor(coord);
                }
            }
        }
        ...
    }
    ...
}
```

Add rendering logic for health potions:

```rust
// app.rs
...
pub mod colours {
    ...
    pub const HEALTH_POTION: Rgb24 = Rgb24::new(255, 0, 255);
    ...
}

fn currently_visible_view_cell_of_tile(tile: Tile) -> ViewCell {
    match tile {
        ...
        Tile::Item(ItemType::HealthPotion) => ViewCell::new()
            .with_character('!')
            .with_foreground(colours::HEALTH_POTION),
    }
}
...
```

Run the game. There should be health potions on the ground, but you won't be able to pick them up or use them yet.

{% image health-potions.png %}

Reference implementation branch: [part-8.0](https://github.com/gridbugs/chargrid-roguelike-tutorial-2020/tree/part-8.0)

## {% anchor adding-items-to-inventory | Adding Items to Inventory %}

Define a data structure to represent the player's inventory.
The inventory has a finite number of slots, and each slot may contain an item.
We'll just store the entity (remember, just a numeric identifier) of items in
inventory slots.

```rust
// world.rs
...
#[derive(Clone, Debug)]
pub struct Inventory {
    slots: Vec<Option<Entity>>,
}

pub struct InventoryIsFull;

#[derive(Debug)]
pub struct InventorySlotIsEmpty;

#[derive(Clone, Copy)]
pub enum ItemUsage {
    Immediate,
    Aim,
}

impl Inventory {
    pub fn new(capacity: usize) -> Self {
        let slots = vec![None; capacity];
        Self { slots }
    }
    pub fn slots(&self) -> &[Option<Entity>] {
        &self.slots
    }
    pub fn insert(&mut self, item: Entity) -> Result<(), InventoryIsFull> {
        if let Some(slot) = self.slots.iter_mut().find(|s| s.is_none()) {
            *slot = Some(item);
            Ok(())
        } else {
            Err(InventoryIsFull)
        }
    }
    pub fn remove(&mut self, index: usize) -> Result<Entity, InventorySlotIsEmpty> {
        if let Some(slot) = self.slots.get_mut(index) {
            slot.take().ok_or(InventorySlotIsEmpty)
        } else {
            Err(InventorySlotIsEmpty)
        }
    }
    pub fn get(&self, index: usize) -> Result<Entity, InventorySlotIsEmpty> {
        self.slots
            .get(index)
            .cloned()
            .flatten()
            .ok_or(InventorySlotIsEmpty)
    }
}
...
```

Introduce an inventory component and give the player a 10-slot inventory.

```rust
// world.rs
...
entity_table::declare_entity_module! {
    components {
        ...
        inventory: Inventory,
    }
}
...

impl World {
    ...
    fn spawn_player(&mut self, coord: Coord) -> Entity {
        ...
        self.components.inventory.insert(entity, Inventory::new(10));
        ...
    }
    ...
}
```

Make it possible for the player to get the item they are standing on.
Print inventory-related messages to the game's message log.

```rust
// world.rs
...
impl World {
    ...
    pub fn maybe_get_item(
        &mut self,
        character: Entity,
        message_log: &mut Vec<LogMessage>,
    ) -> Result<(), ()> {
        let coord = self
            .spatial_table
            .coord_of(character)
            .expect("character has no coord");
        if let Some(object_entity) = self.spatial_table.layers_at_checked(coord).object {
            if let Some(&item_type) = self.components.item.get(object_entity) {
                // this assumes that the only character that can get items is the player
                let inventory = self
                    .components
                    .inventory
                    .get_mut(character)
                    .expect("character has no inventory");
                if inventory.insert(object_entity).is_ok() {
                    self.spatial_table.remove(object_entity);
                    message_log.push(LogMessage::PlayerGets(item_type));
                    return Ok(());
                } else {
                    message_log.push(LogMessage::PlayerInventoryIsFull);
                    return Err(());
                }
            }
        }
        message_log.push(LogMessage::NoItemUnderPlayer);
        Err(())
    }
    ...
}
```

```rust
// game.rs
...
use crate::world::{HitPoints, ItemType, Location, NpcType, Populate, Tile, World};
...
pub enum LogMessage {
    ...
    PlayerGets(ItemType),
    PlayerInventoryIsFull,
    NoItemUnderPlayer,
}
...
impl GameState {
    ...
    pub fn maybe_player_get_item(&mut self) {
        if self
            .world
            .maybe_get_item(self.player_entity, &mut self.message_log)
            .is_ok()
        {
            self.ai_turn();
        }
    }
    ...
}
```

```rust
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
                PlayerGets(item_type) => {
                    write!(&mut buf[0].text, "You get the ").unwrap();
                    write!(&mut buf[1].text, "{}", item_type.name()).unwrap();
                    buf[1].style.foreground = Some(colours::item_colour(item_type));
                    write!(&mut buf[2].text, ".").unwrap();
                }
                PlayerInventoryIsFull => {
                    write!(&mut buf[0].text, "Inventory is full!").unwrap();
                }
                NoItemUnderPlayer => {
                    write!(&mut buf[0].text, "Nothing to get!").unwrap();
                }
            }
        }
        ...
    }
}
...
```

```rust
// app.rs
...
pub mod colours {
    ...
    pub fn item_colour(item_type: ItemType) -> Rgb24 {
        match item_type {
            ItemType::HealthPotion => HEALTH_POTION,
        }
    }
}
...
```

Finally set up the controls such that pressing 'g' picks up the item under the player.

```rust
// app.rs
...
impl AppData {
    ...
    fn handle_input(&mut self, input: Input) {
        ...
        match input {
            Input::Keyboard(key) => match key {
                ...
                KeyboardInput::Char('g') => self.game_state.maybe_player_get_item(),
                ...
            },
            _ => (),
        }
        ...
    }
}
...
```

Now you can pick items but you can't use them, drop them, or view your inventory.

{% image get-health-potion.png %}

Reference implementation branch: [part-8.1](https://github.com/gridbugs/chargrid-roguelike-tutorial-2020/tree/part-8.1)

## {% anchor using-and-dropping-items | Using and Dropping Items %}

Start by defining what it means to use and drop an item.
In the interface for using and dropping items, items will be specified by inventory slot index
rather than (say) by their `Entity`. This will simplify plugging this logic into the game's ui
later. While reading this, keep in mind that using or dropping an item can fail for a number
of ways, and if an attempt to use or drop an item fails, we don't want NPCs to take their turn
afterwards.

Also expose some getters and helper functions which will come in handy shortly.

```rust
// world.rs
...
impl World {
    ...
    pub fn maybe_use_item(
        &mut self,
        character: Entity,
        inventory_index: usize,
        message_log: &mut Vec<LogMessage>,
    ) -> Result<(), ()> {
        let inventory = self
            .components
            .inventory
            .get_mut(character)
            .expect("character has no inventory");
        let item = match inventory.remove(inventory_index) {
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
        match item_type {
            ItemType::HealthPotion => {
                let mut hit_points = self
                    .components
                    .hit_points
                    .get_mut(character)
                    .expect("character has no hit points");
                const HEALTH_TO_HEAL: u32 = 5;
                hit_points.current = hit_points.max.min(hit_points.current + HEALTH_TO_HEAL);
                message_log.push(LogMessage::PlayerHeals);
            }
        }
        Ok(())
    }

    pub fn maybe_drop_item(
        &mut self,
        character: Entity,
        inventory_index: usize,
        message_log: &mut Vec<LogMessage>,
    ) -> Result<(), ()> {
        let coord = self
            .spatial_table
            .coord_of(character)
            .expect("character has no coord");
        if self.spatial_table.layers_at_checked(coord).object.is_some() {
            message_log.push(LogMessage::NoSpaceToDropItem);
            return Err(());
        }
        let inventory = self
            .components
            .inventory
            .get_mut(character)
            .expect("character has no inventory");
        let item = match inventory.remove(inventory_index) {
            Ok(item) => item,
            Err(InventorySlotIsEmpty) => {
                message_log.push(LogMessage::NoItemInInventorySlot);
                return Err(());
            }
        };
        self.spatial_table
            .update(
                item,
                Location {
                    coord,
                    layer: Some(Layer::Object),
                },
            )
            .unwrap();
        let &item_type = self
            .components
            .item
            .get(item)
            .expect("non-item in inventory");
        message_log.push(LogMessage::PlayerDrops(item_type));
        Ok(())
    }

    pub fn inventory(&self, entity: Entity) -> Option<&Inventory> {
        self.components.inventory.get(entity)
    }

    pub fn item_type(&self, entity: Entity) -> Option<ItemType> {
        self.components.item.get(entity).cloned()
    }
    ...
}
```


```rust
// game.rs
...
pub enum LogMessage {
    ...
    NoItemInInventorySlot,
    PlayerHeals,
    PlayerDrops(ItemType),
    NoSpaceToDropItem,
}
...
impl GameState {
    ...
    pub fn maybe_player_use_item(&mut self, inventory_index: usize) -> Result<(), ()> {
        let result =
            self.world
                .maybe_use_item(self.player_entity, inventory_index, &mut self.message_log);
        if result.is_ok() {
            self.ai_turn();
        }
        result
    }

    pub fn maybe_player_drop_item(&mut self, inventory_index: usize) -> Result<(), ()> {
        let result =
            self.world
                .maybe_drop_item(self.player_entity, inventory_index, &mut self.message_log);
        if result.is_ok() {
            self.ai_turn();
        }
        result
    }

    pub fn player_inventory(&self) -> &Inventory {
        self.world
            .inventory(self.player_entity)
            .expect("player has no inventory")
    }

    pub fn item_type(&self, entity: Entity) -> Option<ItemType> {
        self.world.item_type(entity)
    }

    pub fn size(&self) -> Size {
        self.world.size()
    }
}
...
```

```rust
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
                NoItemInInventorySlot => {
                    write!(&mut buf[0].text, "No item in inventory slot!").unwrap();
                }
                PlayerHeals => {
                    write!(&mut buf[0].text, "You feel slightly better.").unwrap();
                    buf[0].style.foreground = Some(Rgb24::new(0, 187, 0));
                }
                PlayerDrops(item_type) => {
                    write!(&mut buf[0].text, "You drop the ").unwrap();
                    write!(&mut buf[1].text, "{}", item_type.name()).unwrap();
                    buf[1].style.foreground = Some(colours::item_colour(item_type));
                    write!(&mut buf[2].text, ".").unwrap();
                }
                NoSpaceToDropItem => {
                    write!(&mut buf[0].text, "No space to drop item!").unwrap();
                }
            }
        }
        ...
    }
}
...
```

Unlike all the actions players can currently take, using and dropping items won't be done with a single key press.
Instead, pressing a key will display a _menu_, from which the player can select the item they'd like to use or drop.

Here's how it will look when it's finished.

{% image item-menu.png %}

The `chargrid` library comes with some tools for working with menus, and rendering UI elements in general.
We've already seen some of this in the health bar and message log.

Update the `AppData` type to include a menu:

```rust
// app.rs
...
use chargrid::{
    app::{App as ChargridApp, ControlFlow},
    input::{keys, Input, KeyboardInput},
    menu::{MenuInstanceBuilder, MenuInstanceChooseOrEscape},
    render::{ColModify, Frame, ViewCell, ViewContext},
};
use std::collections::HashMap;
...
#[derive(Clone, Copy, Debug)]
struct InventorySlotMenuEntry {
    index: usize, // the index of the inventory slot
    key: char,    // a character corresponding to the slot so players can select with a key
}
...
struct AppData {
    ...
    inventory_slot_menu: MenuInstanceChooseOrEscape<InventorySlotMenuEntry>,
}

impl AppData {
    fn new(screen_size: Size, rng_seed: u64, visibility_algorithm: VisibilityAlgorithm) -> Self {
        ...
        let inventory_slot_menu = {
            let items = (0..player_inventory.slots().len())
                .zip('a'..)
                .map(|(index, key)| InventorySlotMenuEntry { index, key })
                .collect::<Vec<_>>();
            let hotkeys = items
                .iter()
                .map(|&entry| (entry.key, entry))
                .collect::<HashMap<_, _>>();
            MenuInstanceBuilder {
                items,
                hotkeys: Some(hotkeys),
                selected_index: 0,
            }
            .build()
            .unwrap()
            .into_choose_or_escape()
        };
        Self {
            ...
            inventory_slot_menu,
        }
    }
    ...
}
```

The menu types defined in `chargrid` can be `ticked` - fed input events, which updates their internal state,
and possibly resolves them to a selected value or an explicit cancellation.
Menus can be controlled by the arrow keys, the mouse, and by an optional list of hotkeys, as is done here so players
can use letter keys to make selections from the menu (a tradition in roguelike games!).

A `MenuInstanceChooseOrEscape<T>` is a menu which can be used to select a value of type `T` that is cancelled when the
escape key is pressed.
At the moment pressing the escape key quits the entire game, but if the inventory is open we'd like for it to close
the inventory instead. Update `impl ChargridApp for App` to pass escape keys into `AppData::handle_input` and let
that function decide whether to quit the game.

```rust
// app.rs
...
impl ChargridApp for App {
    fn on_input(&mut self, input: Input) -> Option<ControlFlow> {
        match input {
            Input::Keyboard(keys::ETX) => Some(ControlFlow::Exit),
            other => self.data.handle_input(other, &self.view),
        }
    }
    ...
}
```

Note that this change requires `AppData::handle_input` to return a `Option<ControlFlow>`. For now it can just return `None` to get
the code to compile.

The meaning of key presses is different depending on whether a menu is open, and we need a way of determining whether
an input event should go to the game state or a menu.

Add a new field to `AppData` for tracking the state of the application.

```rust
// app.rs
...
#[derive(Clone, Copy, Debug)]
enum AppStateMenu {
    UseItem,
    DropItem,
}

#[derive(Clone, Copy, Debug)]
enum AppState {
    Game,
    Menu(AppStateMenu),
}

struct AppData {
    ...
    app_state: AppState,
}

impl AppData {
    fn new(screen_size: Size, rng_seed: u64, visibility_algorithm: VisibilityAlgorithm) -> Self {
        ...
        Self {
            ...
            app_state: AppState::Game,
        }
    }
}
...
```

Now update `AppData::handle_input` to operate as before if the `app_state` is `Game`, and otherwise tick the menu.
Also add the 'i' and 'd' controls for opening the use and drop item menus respectively.

The logic for having the escape key quit the game is now in this function as well.

Note the code for ticking the menu includes handlers for what happens when a selection is made which call the
`maybe_player_use_item` and `maybe_player_drop_item` defined earlier.

```rust
// app.rs
...
impl AppData {
    ...
    fn handle_input(&mut self, input: Input, view: &AppView) -> Option<ControlFlow> {
        if !self.game_state.is_player_alive() {
            return None;
        }
        match self.app_state {
            AppState::Game => match input {
                Input::Keyboard(key) => match key {
                    KeyboardInput::Left => {
                        self.game_state.maybe_move_player(CardinalDirection::West)
                    }
                    KeyboardInput::Right => {
                        self.game_state.maybe_move_player(CardinalDirection::East)
                    }
                    KeyboardInput::Up => {
                        self.game_state.maybe_move_player(CardinalDirection::North)
                    }
                    KeyboardInput::Down => {
                        self.game_state.maybe_move_player(CardinalDirection::South)
                    }
                    KeyboardInput::Char(' ') => self.game_state.wait_player(),
                    KeyboardInput::Char('g') => self.game_state.maybe_player_get_item(),
                    KeyboardInput::Char('i') => {
                        self.app_state = AppState::Menu(AppStateMenu::UseItem)
                    }
                    KeyboardInput::Char('d') => {
                        self.app_state = AppState::Menu(AppStateMenu::DropItem)
                    }
                    keys::ESCAPE => return Some(ControlFlow::Exit),
                    _ => (),
                },
                _ => (),
            },
            AppState::Menu(menu) => match self
                .inventory_slot_menu
                .choose(&view.inventory_slot_menu_view, input)
            {
                None => (),
                Some(Err(menu::Escape)) => self.app_state = AppState::Game,
                Some(Ok(entry)) => match menu {
                    AppStateMenu::UseItem => {
                        if self.game_state.maybe_player_use_item(entry.index).is_ok() {
                            self.app_state = AppState::Game;
                        }
                    }
                    AppStateMenu::DropItem => {
                        if self.game_state.maybe_player_drop_item(entry.index).is_ok() {
                            self.app_state = AppState::Game;
                        }
                    }
                },
            },
        }
        self.game_state.update_visibility(self.visibility_algorithm);
        None
    }
}
...
```

Now we need to define how a menu will be _rendered_.
Chargrid doesn't prescribe how a menu should be rendered, but does provide some helper functions for
defining menu rendering logic. It's fairly easy to write a basic menu renderer,
but the api doesn't get in your way if you want to write something more complex.

Just for fun, let's make this menu complex. Entries will be coloured based on the `colours::item_colour` function
defined in a previous section. The selected entry will be bold, of a brighter colour, and be annotated with a ">".

The logic for rendering the menu is split into 2 parts - the list of menu items, and a _decorator_ which adds
a border and a title, and centres the menu on the screen.

Finally, we'll use the `ColModify` trait to modify the colour of the game area, dimming it while the menu is visible.

Here's the code for rendering the menu items:
```rust
// app.rs
use chargrid::{
    app::{App as ChargridApp, ControlFlow},
    input::{keys, Input, KeyboardInput},
    menu::{
        self, MenuIndexFromScreenCoord, MenuInstanceBuilder, MenuInstanceChoose,
        MenuInstanceChooseOrEscape, MenuInstanceMouseTracker,
    },
    render::{ColModify, ColModifyMap, Frame, Style, View, ViewCell, ViewContext},
    text::{RichTextPart, RichTextViewSingleLine},
};

...

#[derive(Default)]
struct InventorySlotMenuView {
    mouse_tracker: MenuInstanceMouseTracker,
}

impl MenuIndexFromScreenCoord for InventorySlotMenuView {
    fn menu_index_from_screen_coord(&self, len: usize, coord: Coord) -> Option<usize> {
        self.mouse_tracker.menu_index_from_screen_coord(len, coord)
    }
}

impl<'a> View<&'a AppData> for InventorySlotMenuView {
    fn view<F: Frame, C: ColModify>(
        &mut self,
        data: &'a AppData,
        context: ViewContext<C>,
        frame: &mut F,
    ) {
        let player_inventory_slots = data.game_state.player_inventory().slots();
        self.mouse_tracker.new_frame(context.offset);
        for ((i, entry, maybe_selected), &slot) in data
            .inventory_slot_menu
            .menu_instance()
            .enumerate()
            .zip(player_inventory_slots.into_iter())
        {
            let (name, name_colour) = if let Some(item_entity) = slot {
                let item_type = data
                    .game_state
                    .item_type(item_entity)
                    .expect("non-item in player inventory");
                (item_type.name(), colours::item_colour(item_type))
            } else {
                ("-", Rgb24::new_grey(187))
            };
            let (selected_prefix, prefix_style, name_style) = if maybe_selected.is_some() {
                (
                    ">",
                    Style::new()
                        .with_foreground(Rgb24::new_grey(255))
                        .with_bold(true),
                    Style::new().with_foreground(name_colour).with_bold(true),
                )
            } else {
                (
                    " ",
                    Style::new().with_foreground(Rgb24::new_grey(187)),
                    Style::new().with_foreground(name_colour.saturating_scalar_mul_div(2, 3)),
                )
            };
            let prefix = format!("{} {}) ", selected_prefix, entry.key);
            let text = &[
                RichTextPart {
                    text: &prefix,
                    style: prefix_style,
                },
                RichTextPart {
                    text: name,
                    style: name_style,
                },
            ];
            let size = RichTextViewSingleLine::new().view_size(
                text.into_iter().cloned(),
                context.add_offset(Coord::new(0, i as i32)),
                frame,
            );
            self.mouse_tracker.on_entry_view_size(size);
        }
    }
}

...
```

Of note here is the `MenuIndexFromScreenCoord` trait which is implemented by `InventorySlotMenuView`.
In order to support selecting from the menu with the mouse, the menu needs to know its absolute
position on the screen so it can be compared with the mouse position.
The `MenuInstanceMouseTracker` is a helper type which simplifies implementing this trait.

Add an `InventorySlotMenuView` to `AppView`.
```rust
// app.rs
...
struct AppView {
    ...
    inventory_slot_menu_view: InventorySlotMenuView,
}

impl AppView {
    fn new(screen_size: Size) -> Self {
        ...
        Self {
            ...
            inventory_slot_menu_view: InventorySlotMenuView::default(),
        }
    }
}
...
```

Now update the implementation of `View` for `AppView` to use a decorated version of this new view,
and dim the game area while the menu is visible. We'll use a type `chargrid::render::ColModifyMap` to
apply a function to colours selected in the game rendering logic.

```rust
// app.rs
...
use chargrid::{
    ...
    decorator::{
        AlignView, Alignment, BorderStyle, BorderView, BoundView, FillBackgroundView, MinSizeView,
    },
    render::{ColModify, ColModifyMap, Frame, Style, View, ViewCell, ViewContext},
};
...
impl<'a> View<&'a AppData> for AppView {
    fn view<F: Frame, C: ColModify>(
        &mut self,
        data: &'a AppData,
        context: ViewContext<C>,
        frame: &mut F,
    ) {
        fn col_modify_dim(num: u32, denom: u32) -> impl ColModify {
            ColModifyMap(move |col: Rgb24| col.saturating_scalar_mul_div(num, denom))
        }
        let game_col_modify = match data.app_state {
            AppState::Game => col_modify_dim(1, 1),
            AppState::Menu(menu) => {
                let title_text = match menu {
                    AppStateMenu::UseItem => "Use Item",
                    AppStateMenu::DropItem => "Drop Item",
                };
                BoundView {
                    size: data.game_state.size(),
                    view: AlignView {
                        alignment: Alignment::centre(),
                        view: FillBackgroundView {
                            rgb24: Rgb24::new_grey(0),
                            view: BorderView {
                                style: &BorderStyle {
                                    title: Some(title_text.to_string()),
                                    title_style: Style::new().with_foreground(Rgb24::new_grey(255)),
                                    ..Default::default()
                                },
                                view: MinSizeView {
                                    size: Size::new(12, 0),
                                    view: &mut self.inventory_slot_menu_view,
                                },
                            },
                        },
                    },
                }
                .view(data, context.add_depth(10), frame);
                col_modify_dim(1, 2)
            }
        };
        self.game_view.view(
            &data.game_state,
            context.compose_col_modify(game_col_modify),
            frame,
        );
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

It's now possible to view, use, and drop items from your inventory.
Here's what it looks like when you use a health potion.

{% image use-health-potion.png %}

Reference implementation branch: [part-8.2](https://github.com/gridbugs/chargrid-roguelike-tutorial-2020/tree/part-8.2)

## {% anchor event-routine-intro | Event Routine Intro %}

In the previous section we introduced an `AppState` type which keeps track of whether a menu is open.
Chargrid apps must be event-driven, so while a menu is displayed, each input must be routed to the correct place
Based on the state of the game. Also note that depending on the state of the application, rendering logic must
behave differently. For a game of this scale, we can manage the app state reasonably well using our
`app_state` flag, but as the game grow, keeping track of input routing and app state can become painful.

Chargrid contains a module `chargrid::event_routine`, which is an attempt to simplify the management of state machines
where input routing and rendering is dependent on the application state. For a motivating example, consider menus.
In the explicitly event-driven code we just wrote, each input must be explicitly handed to the menu, and then we must
check whether the menu declares that a selection has been made. It would be nice if we could call a function that
blocked until a selection is made, and then the function just returns the selection. Then we could call this function
directly from (say) the `i` key handler, and process the "use item" command then and there. Blocking isn't possible in
this context, but we can do something "kind of like blocking" that gives us some of the convenience while remaining
fully event-driven.

At the core of `chargrid::event_routine` is the `EventRoutine` trait. Implementations of `EventRoutine` know
render themselves and  handle events. While handling an event, an `EventRoutine` may complete and "return"
a value.

Chargrid comes with `EventRoutine` definitions for menus which tick the menu as events come in, and return
the selected value when a selection is made. `EventRoutine`s have several combinators defined which allow
them to be composed with other computations or other `EventRoutine`s.

The idea of `EventRoutine`s is very similar to that of [`Future`s](https://doc.rust-lang.org/stable/std/future/trait.Future.html)
in that they are asynchronous, composable values which represent a computation.

This section will show very basic usage of `EventRoutine` - wrapping up all our event-driven logic inside a giant `EventRoutine`.
The next section will pull apart the existing event-driven explicit state machine, and replace parts of it with smaller `EventRoutine`s
which are composed to form the application.

```rust
// app.rs
...
use chargrid::{
    app::App as ChargridApp,
    event_routine::{self, common_event::CommonEvent, EventOrPeek, EventRoutine, Handled},
};
...
```

Stop depending on `std::time::Duration` and `chargrid::app::ControlFlow`.

Instead of using `ControlFlow::Exit`, define our own `Exit` unit type.

```rust
// app.rs
...
struct Exit;
...
impl AppData {
    ...
    fn handle_input(&mut self, input: Input, view: &AppView) -> Option<Exit> {
        ...
        match self.app_state {
            AppState::Game => match input {
                Input::Keyboard(key) => match key {
                    ...
                    keys::ESCAPE => return Some(Exit),
                    ...
                }
                ...
            }
            ...
        }
        ...
    }
}
```

Remove the `App` type, and replace it with another unit type `AppEventRoutine`, which
implements `EventRoutine`. This type will wrap all our existing logic in a giant `EventRoutine`.
We'll totally replace `AppEventRoutine` in the next section with the composition of several simpler
`EventRoutine`s. It's a temporary measure to make the transition to `EventRoutine`s more gentle.

```rust
// app.rs
...
struct AppEventroutine;

impl EventRoutine for AppEventroutine {
    type Return = ();
    type Data = AppData;
    type View = AppView;
    type Event = CommonEvent;
    fn handle<EP>(
        self,
        data: &mut Self::Data,
        view: &Self::View,
        event_or_peek: EP,
    ) -> Handled<Self::Return, Self>
    where
        EP: EventOrPeek<Event = Self::Event>,
    {
        event_routine::event_or_peek_with_handled(event_or_peek, self, |s, event| match event {
            CommonEvent::Input(input) => match data.handle_input(input, view) {
                None => Handled::Continue(s),
                Some(Exit) => Handled::Return(()),
            },
            CommonEvent::Frame(_) => Handled::Continue(s),
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
        view.view(data, context, frame);
    }
}
```

The logic in `impl EventRoutine for AppEventroutine` is very similar to what used to be in `impl ChargridApp for App`,
just with a little more boilerplate.

Note the 4 associated types of the `EventRoutine` trait:
- `Return`: when the `EventRoutine` completes, this is the type of the value it "returns"
- `Data`: type of external mutable data which the event routine may modify when it handles events.
    Roughly corresponds to the type parameter of the `chargrid::render::View` trait.
- `View`: type of data necessary to render `Data`. This will often be an implementation of `chargrid::render::View<&Data>`.
- `Event`: type of event that the `EventRoutine` can handle.
    This will often be `chargrid::event_routine::common_event::CommonEvent` which is an `enum` of `chargrid::input::Input` and `std::time::Duration-
    to represent user input or an animation frame (to allow realtime animations).

Add a function `game_loop` which returns an `AppEventRoutine`.
Note the `return_on_exit` combinator which causes the event return to complete when the application is exited (e.g. by closing its window).
Its argument is a function that will be called when the application is closed. For now this will do nothing.
In the next section, we'll replace the body of this function with a composition of several `EventRoutine`s.

```rust
// app.rs
...
fn game_loop() -> impl EventRoutine<Return = (), Data = AppData, View = AppView, Event = CommonEvent>
{
    AppEventroutine.return_on_exit(|_| ())
}
...
```

Finally, define a public function `app` which instantiates `AppData` and `AppView`, and calls `game_loop`.

```rust
// app.rs
...
pub fn app(
    screen_size: Size,
    rng_seed: u64,
    visibility_algorithm: VisibilityAlgorithm,
) -> impl ChargridApp {
    let data = AppData::new(screen_size, rng_seed, visibility_algorithm);
    let view = AppView::new(screen_size);
    game_loop().app_one_shot_ignore_return(data, view)
}
```

Note the `app_one_shot_ignore_return` method which converts `EventRoutine`s into `ChargridApp`s.

Update `main.rs` to call the new `app` function:
```rust
// main.rs
use app::app;
...
fn main() {
    ...
    let app = app(screen_size, rng_seed, visibility_algorithm);
    context.run_app(app);
}
```

Reference implementation branch: [part-8.3](https://github.com/gridbugs/chargrid-roguelike-tutorial-2020/tree/part-8.3)

## {% anchor state-machine-management-with-event-routines | State Machine Management with Event Routines  %}

This section is a major refactor of `app.rs` to use `EventRoutine`s.

Grab some more dependencies from `chargrid::event_routine` and `chargrid::menu`.

```rust
// app.rs
...
use chargrid::{
    ...
    event_routine::{
        self, common_event::CommonEvent, make_either, DataSelector, Decorate, EventOrPeek,
        EventRoutine, EventRoutineView, Handled, Loop, SideEffect, Value, ViewSelector,
    },
    menu::{
        self, ChooseSelector, MenuIndexFromScreenCoord, MenuInstanceBuilder, MenuInstanceChoose,
        MenuInstanceChooseOrEscape, MenuInstanceMouseTracker, MenuInstanceRoutine,
    },
};
```

It will turn out convenient to move the ui-rendering logic into a method of `AppView`:
```rust
// app.rs
...
impl AppView {
    ...
    fn render_ui<F: Frame, C: ColModify>(
        &mut self,
        data: &AppData,
        context: ViewContext<C>,
        frame: &mut F,
    ) {
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
...
```


Define a unit type `InventorySlotMenuSelect` and implement the traits `ChooseSelector`, `DataSelector` and `ViewSelector`.
We're going to use `chargrid::menu`'s built-in `EventRoutine` for menus, and it needs to be told for a given `Data` and `View`
(`EventRoutine`'s associated types - in this case `AppData` and `AppView`), select a field containing the menu to display (`ChooseSelector`),
the data to use when rendering the menu (`DataSelector`) and the view to use when rendering the menu (`ViewSelector`).

```rust
// app.rs
...
struct InventorySlotMenuSelect;

impl ChooseSelector for InventorySlotMenuSelect {
    type ChooseOutput = MenuInstanceChooseOrEscape<InventorySlotMenuEntry>;
    fn choose_mut<'a>(&self, input: &'a mut Self::DataInput) -> &'a mut Self::ChooseOutput {
        &mut input.inventory_slot_menu
    }
}

impl DataSelector for InventorySlotMenuSelect {
    type DataInput = AppData;
    type DataOutput = AppData;
    fn data<'a>(&self, input: &'a Self::DataInput) -> &'a Self::DataOutput {
        input
    }
    fn data_mut<'a>(&self, input: &'a mut Self::DataInput) -> &'a mut Self::DataOutput {
        input
    }
}

impl ViewSelector for InventorySlotMenuSelect {
    type ViewInput = AppView;
    type ViewOutput = InventorySlotMenuView;
    fn view<'a>(&self, input: &'a Self::ViewInput) -> &'a Self::ViewOutput {
        &input.inventory_slot_menu_view
    }
    fn view_mut<'a>(&self, input: &'a mut Self::ViewInput) -> &'a mut Self::ViewOutput {
        &mut input.inventory_slot_menu_view
    }
}
```

Now define a decorator for the menu. Previously it was decorated inside `impl<'a> View<&'a AppData> for AppView`,
but since the menu will now be handled by an `EventRoutine` we need to implement the `chargrid::event_routine::Decorator` trait.
This code is largely cut'n'pasted from `impl<'a> View<&'a AppData> for AppView`.

```rust
// app.rs
...
struct InventorySlotMenuDecorate<'a> {
    title: &'a str,
}

impl<'a> Decorate for InventorySlotMenuDecorate<'a> {
    type View = AppView;
    type Data = AppData;
    fn view<E, F, C>(
        &self,
        data: &Self::Data,
        mut event_routine_view: EventRoutineView<E>,
        context: ViewContext<C>,
        frame: &mut F,
    ) where
        E: EventRoutine<Data = Self::Data, View = Self::View>,
        F: Frame,
        C: ColModify,
    {
        BoundView {
            size: data.game_state.size(),
            view: AlignView {
                alignment: Alignment::centre(),
                view: FillBackgroundView {
                    rgb24: Rgb24::new_grey(0),
                    view: BorderView {
                        style: &BorderStyle {
                            title: Some(self.title.to_string()),
                            title_style: Style::new().with_foreground(Rgb24::new_grey(255)),
                            ..Default::default()
                        },
                        view: MinSizeView {
                            size: Size::new(12, 0),
                            view: &mut event_routine_view,
                        },
                    },
                },
            },
        }
        .view(data, context.add_depth(10), frame);
        event_routine_view.view.game_view.view(
            &data.game_state,
            context.compose_col_modify(ColModifyMap(|c: Rgb24| c.saturating_scalar_mul_div(1, 2))),
            frame,
        );
        event_routine_view.view.render_ui(&data, context, frame);
    }
}
```

Note that the title displayed in the border is now in a field of the `InventorySlotMenuDecorate` type.

The point of the `Decorate` trait is to take the rendering logic from an `EventRoutine` (encapsulated as the `event_routine_view` argument)
and decorate it using existing decorator logic from `chargrid::decorators`, or custom logic that you define yourself.
This works because the `EventRoutineView` type implements `chargrid::render::View`.

Now define a function which creates the menu event routine. It will take the title of the inventory menu as an argument,
and run until the user makes a choice or explicitly cancels returning a `Result` of either the user's choice, or `menu::Escape`.

```rust
// app.rs
...
fn inventory_slot_menu<'a>(
    title: &'a str,
) -> impl 'a
       + EventRoutine<
    Return = Result<InventorySlotMenuEntry, menu::Escape>,
    Data = AppData,
    View = AppView,
    Event = CommonEvent,
> {
    MenuInstanceRoutine::new(InventorySlotMenuSelect)
        .convert_input_to_common_event()
        .decorated(InventorySlotMenuDecorate { title })
}
...
```

The `convert_input_to_common_event` converts an `EventRoutine` which expects only `chargrid::input::Input` as its events (the menu event routine)
into an `EventRoutine` which expects `CommonEvents` which can also include animation frames. These animation frame events will be ignored by the
resulting `EventRoutine`, but it's needed to make the types line up.

The `decorate` method applies the decorator we defined above, creating a new `EventRoutine` which behaves the same, but is rendered differently.

Add a unit type `GameEventRoutine` which represents the game running normally (with no menus open) where the player controls the player character
and the game area and ui are rendered. Implement `EventRoutine` for this type.

Also define a type `GameReturn` which enumerates all the conditions under which normal gameplay can be interrupted.

A `GameEventRoutine` will run until normal gameplay is interrupted.
Then, depending on the nature of interruption (as indicated by the returned `GameReturn`), some action will be taken
and then `GameEventRoutine` will be invoked again. This continues in a loop until an `Exit` or `GameOver` are returned,
in which case the program will terminate.
The game's state is stored in a field of `AppData` (as before),
so it will persist across invocations of `GameEventRoutine`.

```rust
// app.rs
...
struct GameEventRoutine;

enum GameReturn {
    Exit,
    UseItem,
    DropItem,
    GameOver,
}

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
                if let Some(game_return) = data.handle_input(input) {
                    Handled::Return(game_return)
                } else {
                    Handled::Continue(s)
                }
            }
            CommonEvent::Frame(_period) => Handled::Continue(s),
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
        view.render_ui(&data, context, frame);
    }
}
...
```

In the above code, input events are forwarded to `AppData::handle_input`.
Previously, this method handled both game inputs and menu inputs.
Now that menus will be handled by an `EventRoutine`, we can simplify `AppData::handle_input` to only be concerned with game inputs.
Remove the `AppState` type and `app_state` field of `AppData`. Instead of setting the `app_state` field to the appropriate menu,
when the 'i' or 'd' keys are pressed, return a `GameReturn` indicating which menu to switch to.

```rust
// app.rs
...
struct AppData {
    game_state: GameState,
    visibility_algorithm: VisibilityAlgorithm,
    inventory_slot_menu: MenuInstanceChooseOrEscape<InventorySlotMenuEntry>,
}

impl AppData {
    ...
    fn handle_input(&mut self, input: Input) -> Option<GameReturn> {
        if !self.game_state.is_player_alive() {
            return Some(GameReturn::GameOver);
        }
        match input {
            Input::Keyboard(key) => match key {
                KeyboardInput::Left => self.game_state.maybe_move_player(CardinalDirection::West),
                KeyboardInput::Right => self.game_state.maybe_move_player(CardinalDirection::East),
                KeyboardInput::Up => self.game_state.maybe_move_player(CardinalDirection::North),
                KeyboardInput::Down => self.game_state.maybe_move_player(CardinalDirection::South),
                KeyboardInput::Char(' ') => self.game_state.wait_player(),
                KeyboardInput::Char('g') => self.game_state.maybe_player_get_item(),
                KeyboardInput::Char('i') => return Some(GameReturn::UseItem),
                KeyboardInput::Char('d') => return Some(GameReturn::DropItem),
                keys::ESCAPE => return Some(GameReturn::Exit),
                _ => (),
            },
            _ => (),
        }
        self.game_state.update_visibility(self.visibility_algorithm);
        None
    }
}
```

All rendering logic is now contained within `GameEventRoutine` and the menu renderer and decorator.
Remove `impl<'a> View<&'a AppData> for AppView` (but keep the `AppView` type around as a place to store rendering-related state).

Define a pair of functions for running the `use_item` and `drop_item` menus.
```rust
// app.rs
...
fn use_item() -> impl EventRoutine<Return = (), Data = AppData, View = AppView, Event = CommonEvent>
{
    make_either!(Ei = A | B);
    Loop::new(|| {
        inventory_slot_menu("Use Item").and_then(|result| match result {
            Err(menu::Escape) => Ei::A(Value::new(Some(()))),
            Ok(entry) => Ei::B(SideEffect::new_with_view(
                move |data: &mut AppData, _: &_| {
                    if data.game_state.maybe_player_use_item(entry.index).is_ok() {
                        Some(())
                    } else {
                        None
                    }
                },
            )),
        })
    })
}

fn drop_item() -> impl EventRoutine<Return = (), Data = AppData, View = AppView, Event = CommonEvent>
{
    make_either!(Ei = A | B);
    Loop::new(|| {
        inventory_slot_menu("Drop Item").and_then(|result| match result {
            Err(menu::Escape) => Ei::A(Value::new(Some(()))),
            Ok(entry) => Ei::B(SideEffect::new_with_view(
                move |data: &mut AppData, _: &_| {
                    if data.game_state.maybe_player_drop_item(entry.index).is_ok() {
                        Some(())
                    } else {
                        None
                    }
                },
            )),
        })
    })
}
```

Each of these functions calls `inventory_slot_menu` until either a valid selection or explicit cancellation was made.
In the case of a valid selection, the appropriate action for each menu is taken (using or dropping).
Note the `make_either!` macro. These function both include logic which executes one of two possible event routines
depending on whether the user made a selection or cancelled the menu.

To pull one out:
```rust
match result {
    Err(menu::Escape) => Ei::A(Value::new(Some(()))),
    Ok(entry) => Ei::B(SideEffect::new_with_view(
        move |data: &mut AppData, _: &_| {
            if data.game_state.maybe_player_use_item(entry.index).is_ok() {
                Some(())
            } else {
                None
            }
        },
    )),
})
```

In the first case here, the use hit the escape key to cancel the menu, in which case we run the event routine:
```rust
Value::new(Some(()))
```
The `Value` `EventRoutine` returns immediately with a specified value. Returning `Some(())` in this case tells the `Loop` that we're inside to stop iterating.

In the second case the user made a selection, so we run the event routine:
```rust
SideEffect::new_with_view(
    move |data: &mut AppData, _: &_| {
        if data.game_state.maybe_player_use_item(entry.index).is_ok() {
            Some(())
        } else {
            None
        }
    },
)
```
`SideEffect` is an `EventRoutine` which lets you run arbitrary code on its `Data`. It's used here to update the game state by
attempting to have the player use an item.

The `EventRoutine`s executed in both cases implement the same _trait_, but they are not the same  _type_. Rust requires that
all branches of a conditional statement have the same _type_.
The `make_either!(Ei = A | B | ...)` macro creates a type:
```rust
enum Ei<AType, BType, ...> {
    A(AType),
    B(BType),
    ...
}
```

...and implements `EventRoutine` for the generated type. This macro is necessary whenever you have a conditional statement
where each branch is a different `EventRoutine`.

So far we've defined an `EventRoutine` for running the game and displaying inventory menus. Now we just need something to stitch
it all together. Remove the `AppEventRoutine` type defined in the previous section, and re-implement `game_loop` as:
```rust
// app.rs
...
fn game_loop() -> impl EventRoutine<Return = (), Data = AppData, View = AppView, Event = CommonEvent>
{
    make_either!(Ei = A | B | C | D);
    Loop::new(|| {
        GameEventRoutine.and_then(|game_return| match game_return {
            GameReturn::Exit => Ei::A(Value::new(Some(()))),
            GameReturn::GameOver => Ei::B(Value::new(Some(()))),
            GameReturn::UseItem => Ei::C(use_item().map(|_| None)),
            GameReturn::DropItem => Ei::D(drop_item().map(|_| None)),
        })
    }).return_on_exit(|_| ())
}
...
```

It repeatedly runs the game, handles any interruptions, and then resumes the game unless it has been quit or the game is over.

Reference implementation branch: [part-8.4](https://github.com/gridbugs/chargrid-roguelike-tutorial-2020/tree/part-8.4)

## {% anchor death-screen | Death Screen %}

To celebrate making it through the previous section, let's implement a death screen!

At the moment we check whether the player is alive at the begining of `AppData::handle_input`.
Because of this, when the player dies as a result of an NPCs action, the game doesn't exit until the next input is handled.
Let's change this to use a timeout, where a death screen is briefly displayed before exiting the game.

Move the code which checks whether the player is dead to the end of `AppData::handle_input` so we can react immediately to the player's demise:

```rust
// app.rs
...
impl AppData {
    fn handle_input(&mut self, input: Input) -> Option<GameReturn> {
        match input {
            ...
        }
        self.game_state.update_visibility(self.visibility_algorithm);
        if !self.game_state.is_player_alive() {
            return Some(GameReturn::GameOver);
        }
        None
    }
}
...
```

Implement a function returning an `EventRoutine` that displays a death screen for 2 seconds before completing with `()`.
There's a `Delay` `EventRoutine` already defined in `chargrid` so let's just use that, with a custom decorator that
replaces `Delay`'s rendering logic (which is to draw nothing) with rendering logic for our death screen.
```rust
// app.rs
...
use chargrid::{
    ...
    event_routine::{
        ...
        common_event::{CommonEvent, Delay},
        ...
    },
    ...
    text::{RichTextPart, RichTextViewSingleLine, StringViewSingleLine},
};
...
fn game_over() -> impl EventRoutine<Return = (), Data = AppData, View = AppView, Event = CommonEvent>
{
    struct GameOverDecorate;
    impl Decorate for GameOverDecorate {
        type View = AppView;
        type Data = AppData;
        fn view<E, F, C>(
            &self,
            data: &Self::Data,
            event_routine_view: EventRoutineView<E>,
            context: ViewContext<C>,
            frame: &mut F,
        ) where
            E: EventRoutine<Data = Self::Data, View = Self::View>,
            F: Frame,
            C: ColModify,
        {
            AlignView {
                alignment: Alignment::centre(),
                view: StringViewSingleLine::new(
                    Style::new()
                        .with_foreground(Rgb24::new(255, 0, 0))
                        .with_bold(true),
                ),
            }
            .view("YOU DIED", context.add_depth(10), frame);
            FillBackgroundView {
                rgb24: Rgb24::new(31, 0, 0),
                view: &mut event_routine_view.view.game_view,
            }
            .view(
                &data.game_state,
                context.compose_col_modify(ColModifyMap(|c: Rgb24| {
                    c.saturating_scalar_mul_div(1, 3)
                        .saturating_add(Rgb24::new(31, 0, 0))
                })),
                frame,
            );
            event_routine_view.view.render_ui(&data, context, frame);
        }
    }
    Delay::new(Duration::from_millis(2000)).decorated(GameOverDecorate)
}
...
```

Finally update `game_loop` to call `game_over` when the game is over:

```rust
// app.rs
...
fn game_loop() -> impl EventRoutine<Return = (), Data = AppData, View = AppView, Event = CommonEvent>
{
    make_either!(Ei = A | B | C | D);
    Loop::new(|| {
        GameEventRoutine.and_then(|game_return| match game_return {
            ..
            GameReturn::GameOver => Ei::B(game_over().map(|()| Some(()))),
            ...
        })
    }).return_on_exit(|_| ())
}
...
```

Switching to `EventRoutine` was a big change, but imagine how much messing about with state variables and countdown timers it would take
to implement a death screen with explicit state machines.

{% image death-screen.png %}

Reference implementation branch: [part-8.5](https://github.com/gridbugs/chargrid-roguelike-tutorial-2020/tree/part-8.5)

{% local roguelike-tutorial-2020-part-9 | Click here for the next part! %}
