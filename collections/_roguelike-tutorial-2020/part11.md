---
layout: series-part
series: roguelike-tutorial-2020
index: 11
date: 2020-08-09 21:00:00 +1000
title: "Part 11 - Descending the Stairs"
permalink: /roguelike-tutorial-2020-part-11/
og_image: screenshot-end.png
---

In this part we'll add stairs, and multiple dungeon levels, as well as the ability to upgrade the
player character as they descend the stairs.

{% image screenshot-end.png %}

This part is loosely based on [this part](http://rogueliketutorials.com/tutorials/tcod/part-11/) of the
python tcod tutorial.

Reference implementation branch for starting point: [part-10-end](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-10-end)

In this post:
 - [Placing Stairs](#placing-stairs)
 - [Descending Stairs](#descending-stairs)
 - [Add Combat Stats](#add-combat-stats)
 - [Use Combat Stats](#use-combat-stats)
 - [Upgrade when Descending Stairs](#upgrade-when-descending-stairs)

## {% anchor placing-stairs | Placing Stairs %}

Start by adding an entity to each floor representing the stairs to the next floor down.
For this game, stairs only lead downwards, and there's no way to get back to earlier
floors of the dungeon.

Update the terrain generator to add stairs to the last room it creates.

```rust
// terrain.rs
...
pub enum TerrainTile {
    ...
    Stairs,
}
...
pub fn generate_dungeon<R: Rng>(size: Size, rng: &mut R) -> Grid<TerrainTile> {
    let mut grid = Grid::new_copy(size, None);
    let mut room_centres = Vec::new();
    ...
    // Add stairs to the centre of the last room placed
    *grid.get_checked_mut(*room_centres.last().unwrap()) = Some(TerrainTile::Stairs);

    grid.map(|t| t.unwrap_or(TerrainTile::Wall))
}
```

Add a stairs tile, a stairs component, and spawn stairs according to the map produced by terrain generation.

```rust
// world.rs
...
pub enum Tile {
    ...
    Stairs,
}
...
entity_table::declare_entity_module! {
    components {
        ...
        stairs: (),
    }
}
...
impl World {
    ...
    fn spawn_stairs(&mut self, coord: Coord) {
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
        self.components.tile.insert(entity, Tile::Stairs);
        self.components.stairs.insert(entity, ());
    }
    ...
    pub fn populate<R: Rng>(&mut self, rng: &mut R) -> Populate {
        ...
        for (coord, &terrain_tile) in terrain.enumerate() {
            match terrain_tile {
                ...
                TerrainTile::Stairs => self.spawn_stairs(coord),
                ...
            }
        }
        ...
    }
    ...
}
```

Add a case to the renderer to handle stairs.

```rust
// app.rs
...
fn currently_visible_view_cell_of_tile(tile: Tile) -> ViewCell {
    match tile {
        ...
        Tile::Stairs => ViewCell::new()
            .with_character('>')
            .with_bold(true)
            .with_foreground(Rgb24::new_grey(255))
            .with_background(Rgb24::new(0, 0, 63)),
        ...
    }
}
...
```
Levels now contain stairs!

{% image stairs.png %}

Reference implementation branch: [part-11.0](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-11.0)

## {% anchor descending-stairs | Descending Stairs %}

To approach the problem of descending stairs top down, start by adding a new control such that
when the '>' key is pressed, attempt to have the player descend to the next dungeon level.
Of course this will not do anything unless the player is currently standing on the stairs.

```rust
// app.rs
...
impl AppData {
    ...
    fn handle_input(&mut self, input: Input) -> Option<GameReturn> {
        match input {
            Input::Keyboard(key) => {
                match key {
                    ...
                    KeyboardInput::Char('>') => self.game_state.maybe_player_descend(),
                    ...
                }
                ...
            }
            ...
        }
        ...
    }
    ...
}
...
```

The `maybe_player_descend` method will check whether the player is on the stairs, and call `player_descend` if they are.
```rust
// game.rs
...
impl GameState {
    ...
    pub fn maybe_player_descend(&mut self) {
        if self.world.coord_contains_stairs(self.player_coord()) {
            self.player_descend();
        }
    }
    ...
}
```

`player_descend` contains the interesting logic relating to descending the stairs.
Comments inline.

```rust
// game.rs
...
impl GameState {
    ...
    fn player_descend(&mut self) {

        // remove and return the player's data
        let player_data = self.world.remove_entity_data(self.player_entity);

        // remove and discard all entities from the world
        self.world.clear();

        // generate a fresh level
        let Populate {
            player_entity,
            ai_state,
        } = self.world.populate(&mut self.rng);

        // insert the old player data into the new level
        self.world.update_entity_data(player_entity, player_data);

        // the player's entity may have changed
        self.player_entity = player_entity;

        // replace ai state to match the new level
        self.ai_state = ai_state;
    }
    ...
}
```
This code depends on several not-yet-implemented methods of `World`. Let's implement them now.

```rust
// world.rs
...
pub use components::EntityData;
...
impl World {
    ...
    pub fn clear(&mut self) {
        self.entity_allocator.clear();
        self.components.clear();
        self.spatial_table.clear();
    }

    pub fn remove_entity_data(&mut self, entity: Entity) -> EntityData {
        self.entity_allocator.free(entity);
        self.spatial_table.remove(entity);
        self.components.remove_entity_data(entity)
    }

    pub fn update_entity_data(&mut self, entity: Entity, data: EntityData) {
        self.components.update_entity_data(entity, data);
    }

    pub fn coord_contains_stairs(&self, coord: Coord) -> bool {
        self.spatial_table
            .layers_at_checked(coord)
            .floor
            .map(|floor_entity| self.components.stairs.contains(floor_entity))
            .unwrap_or(false)
    }
}
```
You can now move onto a staircase, and press '>', and you'll find yourself in a brand-new level.

Reference implementation branch: [part-11.1](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-11.1)

## {% anchor add-combat-stats | Add Combat Stats %}

Soon we'll allow the player to level up when descending the stairs, but first we need to
make our combat system more complex, so that the player can be improved on several different axes.
We'll add 4 combat stats to the player:
- base damage: the minimum amount of damage dealt in a melee attack
- strength: a random number between 0 and strength is added to the damage dealth in a melee attack
- dexterity: if the character would receive melee damage, it is reduced by a random number between 0 and dexterity
- intelligence: determines the effectiveness of spells

NPCs can only deal melee damage, so they don't have an intelligence stat, but they still get the other three.

Base damage is an innate property of the character, so it doesn't increase when you level up.
Of the other 3 stats, the player may choose one to increment when descending the stairs.
Alternatively, we'll let the player choose to increase their max health by 5.

In this section we'll add components for each of the stats, and update the UI to display the character's stats.
In the next section we'll update the combat system to make use of these stats.

Add components for the stats, add the stats components to the player and NPCs, and expose getters for strength, dexterity and intelligence.

```rust
// world.rs
...
entity_table::declare_entity_module! {
    components {
        ...
        base_damage: i32,
        strength: i32,
        dexterity: i32,
        intelligence: i32,
    }
}
...
impl World {
    ...
    fn spawn_player(&mut self, coord: Coord) -> Entity {
        ...
        self.components.base_damage.insert(entity, 1);
        self.components.strength.insert(entity, 1);
        self.components.dexterity.insert(entity, 1);
        self.components.intelligence.insert(entity, 1);
        ...
    }

    fn spawn_npc(&mut self, coord: Coord, npc_type: NpcType) -> Entity {
        ...
        self.components.base_damage.insert(entity, 1);
        let (strength, dexterity) = match npc_type {
            NpcType::Orc => (1, 1),
            NpcType::Troll => (2, 0),
        };
        self.components.strength.insert(entity, strength);
        self.components.dexterity.insert(entity, dexterity);
        ...
    }
    ...
    pub fn strength(&self, entity: Entity) -> Option<i32> {
        self.components.strength.get(entity).cloned()
    }
    pub fn dexterity(&self, entity: Entity) -> Option<i32> {
        self.components.dexterity.get(entity).cloned()
    }
    pub fn intelligence(&self, entity: Entity) -> Option<i32> {
        self.components.intelligence.get(entity).cloned()
    }
}
```

Add some getters for the player's stats to `GameState`, and also keep track of the current dungeon level.

```rust
// game.rs
...
pub struct GameState {
    ...
    dungeon_level: u32,
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
            dungeon_level: 1,
        };
        ...
    }
    ...
    fn player_descend(&mut self) {
        ...
        self.dungeon_level += 1;
    }
    ...
    pub fn player_strength(&self) -> i32 {
        self.world
            .strength(self.player_entity)
            .expect("player missing strength")
    }
    pub fn player_dexterity(&self) -> i32 {
        self.world
            .dexterity(self.player_entity)
            .expect("player missing dexterity")
    }
    pub fn player_intelligence(&self) -> i32 {
        self.world
            .intelligence(self.player_entity)
            .expect("player missing intelligence")
    }
    pub fn dungeon_level(&self) -> u32 {
        self.dungeon_level
    }
}
```

In `app.rs`, pass the player's stats to the ui renderer. Also reduce the padding around
the ui to make space for the extra information.

```rust
// app.rs
use crate::ui::{StatsData, UiData, UiView};
...
impl AppView {
    fn new(screen_size: Size) -> Self {
        const UI_Y_PADDING: u32 = 0;
        ...
    }
    fn render_ui<F: Frame, C: ColModify>(
        &mut self,
        name: Option<&'static str>,
        data: &AppData,
        context: ViewContext<C>,
        frame: &mut F,
    ) {
        ...
        self.ui_view.view(
            UiData {
                player_hit_points,
                messages,
                name,
                examine_cell,
                stats_data: StatsData {
                    strength: data.game_state.player_strength(),
                    dexterity: data.game_state.player_dexterity(),
                    intelligence: data.game_state.player_intelligence(),
                },
                dungeon_level: data.game_state.dungeon_level(),
            },
            context.add_offset(Coord::new(0, self.ui_y_offset)),
            frame,
        );
    }
}
...
```

Add a ui component for showing the player's stats.

```rust
// ui.rs
...
#[derive(Default)]
struct StatsView {
    buf: String,
}

pub struct StatsData {
    pub strength: i32,
    pub dexterity: i32,
    pub intelligence: i32,
}

impl<'a> View<&'a StatsData> for StatsView {
    fn view<F: Frame, C: ColModify>(
        &mut self,
        data: &'a StatsData,
        context: ViewContext<C>,
        frame: &mut F,
    ) {
        use std::fmt::Write;
        self.buf.clear();
        write!(
            &mut self.buf,
            "str: {}, dex: {}, int: {}",
            data.strength, data.dexterity, data.intelligence
        )
        .unwrap();
        StringViewSingleLine::new(Style::new().with_foreground(Rgb24::new_grey(187)))
            .view(&self.buf, context, frame);
    }
}
...
```

And another component for the current dungeon level.

```rust
// ui.rs
...
#[derive(Default)]
struct DungeonLevelView {
    buf: String,
}

impl View<u32> for DungeonLevelView {
    fn view<F: Frame, C: ColModify>(
        &mut self,
        dungeon_level: u32,
        context: ViewContext<C>,
        frame: &mut F,
    ) {
        use std::fmt::Write;
        self.buf.clear();
        write!(&mut self.buf, "Level: {}", dungeon_level).unwrap();
        StringViewSingleLine::new(Style::new().with_foreground(Rgb24::new_grey(187)))
            .view(&self.buf, context, frame);
    }
}
...
```

Add fields for stats and dungeon level to `UiData` and `UiView`.

```rust
// ui.rs
...
pub struct UiData<'a> {
    ...
    pub stats_data: StatsData,
    pub dungeon_level: u32,
}

#[derive(Default)]
pub struct UiView {
    ...
    stats_view: StatsView,
    dungeon_level_view: DungeonLevelView,
}
...
```

Finally update `UiView::view` to draw the new components.
The whole function is shown here as it's changed significantly.
Also note the new helper function `centre_health_width` for centering
text within the width of the health bar.

```rust
// ui.rs
...
fn centre_health_width<T: Clone>(view: impl View<T>, height: u32) -> impl View<T> {
    BoundView {
        size: Size::new(HEALTH_WIDTH, height),
        view: AlignView {
            alignment: Alignment {
                x: AlignmentX::Centre,
                y: AlignmentY::Bottom,
            },
            view,
        },
    }
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
        self.stats_view.view(
            &data.stats_data,
            context.add_offset(Coord::new(HEALTH_WIDTH as i32 + 1, 0)),
            frame,
        );
        centre_health_width(&mut self.dungeon_level_view, 1).view(
            data.dungeon_level,
            context.add_offset(Coord::new(0, 1)),
            frame,
        );
        let message_log_offset = Coord::new(HEALTH_WIDTH as i32 + 1, 1);
        self.messages_view
            .view(data.messages, context.add_offset(message_log_offset), frame);
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
            .view(name, context.add_offset(Coord::new(0, 2)), frame);
        }
        if let Some(examine_cell) = data.examine_cell {
            centre_health_width(
                StringView::new(
                    Style::new().with_foreground(Rgb24::new_grey(187)),
                    wrap::Word::new(),
                ),
                2,
            )
            .view(
                examine_cell_str(examine_cell),
                context.add_offset(Coord::new(0, 3)),
                frame,
            );
        }
    }
}
```

Running the game, the ui changes should be visible. The level counter will increase
as you descend deeper into the dungeon.

{% image stats.png %}

Reference implementation branch: [part-11.2](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-11.2)

## {% anchor use-combat-stats | Use Combat Stats %}

We'll start by replacing the logic for handling bump attacks to take the new stats into account.

```rust
// world.rs
...
enum BumpAttackOutcome {
    Hit,
    Dodge,
    Kill,
}
...
impl World {
    ...
    fn character_bump_attack<R: Rng>(
        &mut self,
        victim: Entity,
        attacker: Entity,
        rng: &mut R,
    ) -> BumpAttackOutcome {
        let &attacker_base_damage = self.components.base_damage.get(attacker).unwrap();
        let &attacker_strength = self.components.strength.get(attacker).unwrap();
        let &victim_dexterity = self.components.dexterity.get(victim).unwrap();
        let gross_damage = attacker_base_damage + rng.gen_range(0, attacker_strength + 1);
        let damage_reduction = rng.gen_range(0, victim_dexterity + 1);
        let net_damage = gross_damage.saturating_sub(damage_reduction) as u32;
        if net_damage == 0 {
            BumpAttackOutcome::Dodge
        } else {
            if self.character_damage(victim, net_damage).is_some() {
                BumpAttackOutcome::Kill
            } else {
                BumpAttackOutcome::Hit
            }
        }
    }
    ...
}
```

Note that if an attack would deal 0 damage, we say that it was dodged instead, to add some flavour.
Also note that `character_bump_attack` now takes an additional argument - a random number generator.
Its return type has also changed.

Update `maybe_move_character` to account for this function's new signature.

```rust
// world.rs
impl World {
    ...
    pub fn maybe_move_character<R: Rng>(
        &mut self,
        character_entity: Entity,
        direction: CardinalDirection,
        message_log: &mut Vec<LogMessage>,
        rng: &mut R,
    ) {
        ...
        if new_character_coord.is_valid(self.spatial_table.grid_size()) {
            let dest_layers = self.spatial_table.layers_at_checked(new_character_coord);
            if let Some(dest_character_entity) = dest_layers.character {
                let character_is_npc = self.components.npc_type.get(character_entity).cloned();
                let dest_character_is_npc =
                    self.components.npc_type.get(dest_character_entity).cloned();
                if character_is_npc.is_some() != dest_character_is_npc.is_some() {
                    let outcome =
                        self.character_bump_attack(dest_character_entity, character_entity, rng);
                    let npc_type = character_is_npc.or(dest_character_is_npc).unwrap();
                    Self::write_combat_log_messages(
                        character_is_npc.is_none(),
                        outcome,
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
    ...
}
```

The `BumpAttackOutcome` is now being passed to `write_combat_log_messages`, so update that too.

```rust
// world.rs
...
impl World {
    ...
    fn write_combat_log_messages(
        attacker_is_player: bool,
        outcome: BumpAttackOutcome,
        npc_type: NpcType,
        message_log: &mut Vec<LogMessage>,
    ) {
        if attacker_is_player {
            match outcome {
                BumpAttackOutcome::Kill => message_log.push(LogMessage::PlayerKillsNpc(npc_type)),
                BumpAttackOutcome::Hit => message_log.push(LogMessage::PlayerAttacksNpc(npc_type)),
                BumpAttackOutcome::Dodge => message_log.push(LogMessage::NpcDodges(npc_type)),
            }
        } else {
            match outcome {
                BumpAttackOutcome::Kill => message_log.push(LogMessage::NpcKillsPlayer(npc_type)),
                BumpAttackOutcome::Hit => message_log.push(LogMessage::NpcAttacksPlayer(npc_type)),
                BumpAttackOutcome::Dodge => message_log.push(LogMessage::PlayerDodges(npc_type)),
            }
        }
    }
    ...
}
```

This makes use of two new `LogMessage`s. Define them.

```rust
// game.rs
...
pub enum LogMessage {
    ...
    PlayerDodges(NpcType),
    NpcDodges(NpcType),
}
...
```

And update the ui code to print out the messages.

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
                PlayerDodges(npc_type) => {
                    write!(&mut buf[0].text, "You dodge the ").unwrap();
                    write!(&mut buf[1].text, "{}'s", npc_type.name()).unwrap();
                    buf[1].style.foreground = Some(colours::npc_colour(npc_type));
                    write!(&mut buf[2].text, "attack.").unwrap();
                }
                NpcDodges(npc_type) => {
                    write!(&mut buf[0].text, "The ").unwrap();
                    write!(&mut buf[1].text, "{}", npc_type.name()).unwrap();
                    buf[1].style.foreground = Some(colours::npc_colour(npc_type));
                    write!(&mut buf[2].text, " dodges your attack.").unwrap();
                }
            }
        }
        ...
    }
}
```

That's all that's required to get melee stats working. All that's left is intelligence.

There are currently two types of spell: fireball and confusion. The damage dealt by fireball,
and the duration of confusion, will both be determined by the intelligence stat.
The control flow around casting the spells involves giving the player a chance to aim,
then launching a projectile which moves, animated in realtime. If it collides with a character,
it has some effect based on which spell it was. Only at the point of impact does the
efficacy of the spell (determined by the caster's intelligence) need to be known.
The problem is that right now we don't store an association between the projectile and the
entity which cast it. To make this easy, add fields to the `Fireball` and `Confusion ` `ProjectileType`s
storing the damage and duration respectively.

```rust
// world.rs
...
pub enum ProjectileType {
    Fireball { damage: u32 },
    Confusion { duration: u32 },
}
...
```
Try to compile the code. Any place we pattern-match on a `ProjectileType` needs to be updated from
```rust
  ProjectileType::Fireball => ...
  ProjectileType::Confusion => ...
```
to
```rust
  ProjectileType::Fireball { .. } => ...
  ProjectileType::Confusion { .. } => ...
```

Update `World::maybe_use_item_aim` to set these new fields based on the caster's intelligence.

```rust
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
        ...
        match item_type {
            ...
            ItemType::FireballScroll => {
                let fireball = ProjectileType::Fireball {
                    damage: (*self.components.intelligence.get(character).unwrap()).max(0) as u32,
                };
                message_log.push(LogMessage::PlayerLaunchesProjectile(fireball));
                self.spawn_projectile(character_coord, target, fireball);
            }
            ItemType::ConfusionScroll => {
                let confusion = ProjectileType::Confusion {
                    duration: (*self.components.intelligence.get(character).unwrap()).max(0) as u32
                        * 3,
                };
                message_log.push(LogMessage::PlayerLaunchesProjectile(confusion));
                self.spawn_projectile(character_coord, target, confusion);
            }
        }
        Ok(())
    }
    ...
}
```

When a projectile collides with a character, use the information in these fields to affect the character.

```rust
// world.rs
...
impl World {
    ...
    pub fn move_projectiles(&mut self, message_log: &mut Vec<LogMessage>) {
        let mut entities_to_remove = Vec::new();
        let mut fireball_hit = Vec::new();
        let mut confusion_hit = Vec::new();
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
                            ProjectileType::Fireball { damage } => {
                                fireball_hit.push((character, damage));
                            }
                            ProjectileType::Confusion { duration } => {
                                confusion_hit.push((character, duration));
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
        for (entity, damage) in fireball_hit {
            let maybe_npc = self.components.npc_type.get(entity).cloned();
            if let Some(VictimDies) = self.character_damage(entity, damage) {
                if let Some(npc) = maybe_npc {
                    message_log.push(LogMessage::NpcDies(npc));
                }
            }
        }
        for (entity, duration) in confusion_hit {
            self.components.confusion_countdown.insert(entity, duration);
            if let Some(&npc_type) = self.components.npc_type.get(entity) {
                message_log.push(LogMessage::NpcBecomesConfused(npc_type));
            }
        }
    }
    ...
}
```

Now the higher your intelligence, the more powerful the effects of your spells.

Reference implementation branch: [part-11.3](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-11.3)

## {% anchor upgrade-when-descending-stairs | Upgrade when Descending Stairs %}

Define a type to represent the different ways the player can level up.

```rust
// game.rs
...
#[derive(Clone, Copy, Debug)]
pub enum LevelUp {
    Strength,
    Dexterity,
    Intelligence,
    Health,
}
...
```
Add a method to `World` for leveling up a character.

```rust
// world.rs
...
use crate::game::{ExamineCell, LevelUp, LogMessage};
...
impl World {
    ...
    pub fn level_up_character(&mut self, character_entity: Entity, level_up: LevelUp) {
        match level_up {
            LevelUp::Strength => {
                *self
                    .components
                    .strength
                    .get_mut(character_entity)
                    .expect("character lacks strength") += 1;
            }
            LevelUp::Dexterity => {
                *self
                    .components
                    .dexterity
                    .get_mut(character_entity)
                    .expect("character lacks dexterity") += 1;
            }
            LevelUp::Intelligence => {
                *self
                    .components
                    .intelligence
                    .get_mut(character_entity)
                    .expect("character lacks intelligence") += 1;
            }
            LevelUp::Health => {
                let hit_points = self
                    .components
                    .hit_points
                    .get_mut(character_entity)
                    .expect("character lacks hit points");
                const INCREASE: u32 = 5;
                hit_points.current += INCREASE;
                hit_points.max += INCREASE;
            }
        }
    }
}
```

Earlier in this section we defined a method `GameState::maybe_player_descend` which checked
whether the player is on the stairs, and if so, have them descend to the next dungeon level.
We now need to move this check outside of `GameState`. This is because when the player is on
the stairs and presses the '>' key, we now want to display a level-up menu, which the player
may cancel. If they select stat to level up, only then will the player be taken to the next
level, and leveled-up, in a single atomic operation.

Thus replace `GameState::maybe_player_descend` with the following two methods:

```rust
// game.rs
...
impl GameState {
    ...
    pub fn player_level_up_and_descend(&mut self, level_up: LevelUp) {
        assert!(self.is_player_on_stairs());
        self.world.level_up_character(self.player_entity, level_up);
        let player_data = self.world.remove_entity_data(self.player_entity);
        self.world.clear();
        let Populate {
            player_entity,
            ai_state,
        } = self.world.populate(&mut self.rng);
        self.world.update_entity_data(player_entity, player_data);
        self.player_entity = player_entity;
        self.ai_state = ai_state;
        self.dungeon_level += 1;
    }
    pub fn is_player_on_stairs(&self) -> bool {
        self.world.coord_contains_stairs(self.player_coord())
    }
    ...
}
```

Now we need to describe the level-up menu.

Start with a function that creates a menu instance, listing all the different ways to level up.
Make it a `MenuInstanceChooseOrEscape` so that it's sensitive to the escape key being pressed,
allowing the user to cancel the menu and not descend the stairs yet.

```rust
// app.rs
use crate::game::{GameState, LevelUp};
...
fn level_up_menu_instance() -> MenuInstanceChooseOrEscape<LevelUp> {
    use LevelUp::*;
    MenuInstanceBuilder {
        items: vec![Strength, Dexterity, Intelligence, Health],
        hotkeys: None,
        selected_index: 0,
    }
    .build()
    .unwrap()
    .into_choose_or_escape()
}
...
```

Describe how to render the level-up menu.

```rust
// app.rs
...
#[derive(Default)]
struct LevelUpMenuView {
    mouse_tracker: MenuInstanceMouseTracker,
}

impl MenuIndexFromScreenCoord for LevelUpMenuView {
    fn menu_index_from_screen_coord(&self, len: usize, coord: Coord) -> Option<usize> {
        self.mouse_tracker.menu_index_from_screen_coord(len, coord)
    }
}

impl<'a> View<&'a AppData> for LevelUpMenuView {
    fn view<F: Frame, C: ColModify>(
        &mut self,
        data: &'a AppData,
        context: ViewContext<C>,
        frame: &mut F,
    ) {
        self.mouse_tracker.new_frame(context.offset);
        for (i, &level_up, maybe_selected) in data.level_up_menu.menu_instance().enumerate() {
            let (prefix, style) = if maybe_selected.is_some() {
                (
                    ">",
                    Style::new()
                        .with_foreground(Rgb24::new_grey(255))
                        .with_bold(true),
                )
            } else {
                (" ", Style::new().with_foreground(Rgb24::new_grey(187)))
            };
            let text = match level_up {
                LevelUp::Strength => "Strength",
                LevelUp::Dexterity => "Dexterity",
                LevelUp::Intelligence => "Intelligence",
                LevelUp::Health => "Constitution",
            };
            let size = StringViewSingleLine::new(style).view_size(
                format!("{} {}", prefix, text),
                context.add_offset(Coord::new(0, i as i32)),
                frame,
            );
            self.mouse_tracker.on_entry_view_size(size);
        }
    }
}
...
```

Describe a "selector" for the menu that selects the fields of `AppData` and `AppView` for
using and rendering the menu.

```rust
// app.rs
...
struct LevelUpMenuSelect;

impl ChooseSelector for LevelUpMenuSelect {
    type ChooseOutput = MenuInstanceChooseOrEscape<LevelUp>;
    fn choose_mut<'a>(&self, input: &'a mut Self::DataInput) -> &'a mut Self::ChooseOutput {
        &mut input.level_up_menu
    }
}

impl DataSelector for LevelUpMenuSelect {
    type DataInput = AppData;
    type DataOutput = AppData;
    fn data<'a>(&self, input: &'a Self::DataInput) -> &'a Self::DataOutput {
        input
    }
    fn data_mut<'a>(&self, input: &'a mut Self::DataInput) -> &'a mut Self::DataOutput {
        input
    }
}

impl ViewSelector for LevelUpMenuSelect {
    type ViewInput = AppView;
    type ViewOutput = LevelUpMenuView;
    fn view<'a>(&self, input: &'a Self::ViewInput) -> &'a Self::ViewOutput {
        &input.level_up_menu_view
    }
    fn view_mut<'a>(&self, input: &'a mut Self::ViewInput) -> &'a mut Self::ViewOutput {
        &mut input.level_up_menu_view
    }
}
...
```

Define a decorator which knows how to render the menu on top of the game, dimming the game in the background.

```rust
// app.rs
...
struct LevelUpMenuDecorate;

impl Decorate for LevelUpMenuDecorate {
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
                            title: Some("Level Up".to_string()),
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
        event_routine_view
            .view
            .render_ui(None, &data, context, frame);
    }
}
```

And define a function returning an `impl EventRoutine<...>` which runs the menu
and "returns" the level-up or cancellation selected by the player.

```rust
// app.rs
...
fn level_up_menu() -> impl EventRoutine<
    Return = Result<LevelUp, menu::Escape>,
    Data = AppData,
    View = AppView,
    Event = CommonEvent,
> {
    MenuInstanceRoutine::new(LevelUpMenuSelect)
        .convert_input_to_common_event()
        .decorated(LevelUpMenuDecorate)
}
...
```

Phew. Developer note: Adding menus currently requires a lot of boilerplate. The common patterns should be encapsulated
into helpers inside the `chargrid` library.

Add the data and view fields to `AppData` and `AppView`.

```rust
// app.rs
...
struct AppData {
    ...
    level_up_menu: MenuInstanceChooseOrEscape<LevelUp>,
    ...
}

impl AppData {
    fn new(screen_size: Size, rng_seed: u64, visibility_algorithm: VisibilityAlgorithm) -> Self {
        ...
        Self {
            ...
            level_up_menu: level_up_menu_instance(),
            ...
        }
    }
    ...
}

struct AppView {
    ...
    level_up_menu_view: LevelUpMenuView,
}

impl AppView {
    fn new(screen_size: Size) -> Self {
        ...
        Self {
            ...
            level_up_menu_view: LevelUpMenuView::default(),
        }
    }
    ...
}
...
```

Update `AppData::handle_input` such that when '>' is pressed, rather than immediately descending,
return a new `GameReturn` representing the fact that a level-up menu should be run.

```rust
// app.rs
...
enum GameReturn {
    ...
    LevelUpAndDescend,
}
...
impl AppData {
    ...
    fn handle_input(&mut self, input: Input) -> Option<GameReturn> {
        match input {
            Input::Keyboard(key) => {
                match key {
                    ...
                    KeyboardInput::Char('>') => {
                        if self.game_state.is_player_on_stairs() {
                            return Some(GameReturn::LevelUpAndDescend);
                        }
                    }
                    ...
                }
                ...
            }
            ...
        }
        ...
    }
    ...
}
```

And update `game_loop` to handle `LevelUpAndDescend`.
```rust
// app.rs
...
fn game_loop() -> impl EventRoutine<Return = (), Data = AppData, View = AppView, Event = CommonEvent>
{
    make_either!(Ei = A | B | C | D | E | F);
    Loop::new(|| {
        GameEventRoutine.and_then(|game_return| match game_return {
            ...
            GameReturn::LevelUpAndDescend => Ei::F(level_up_menu().and_then(|maybe_level_up| {
                SideEffect::new_with_view(move |data: &mut AppData, _: &_| {
                    match maybe_level_up {
                        Err(menu::Escape) => (),
                        Ok(level_up) => data.game_state.player_level_up_and_descend(level_up),
                    }
                    None
                })
            })),
        })
    })
    .return_on_exit(|data| data.save_game())
}
...
```
Now when the player hits '>' while standing on the stairs, they see a menu like this:

{% image screenshot-end.png %}

If they make a selection, the relevant stat will increase, and they'll descend to the next dungeon level.

Reference implementation branch: [part-11.4](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-11.4)
