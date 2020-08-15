---
layout: series-part
series: roguelike-tutorial-2020
index: 13
date: 2020-08-15 19:40:00 +1000
title: "Part 13 - Equipment"
permalink: /roguelike-tutorial-2020-part-13/
og_image: inventory.png
---

This is the final part of the tutorial, in which we'll add equipment.

{% image inventory.png %}

This part is loosely based on [this part](http://rogueliketutorials.com/tutorials/tcod/part-13/) of the
python tcod tutorial.

Reference implementation branch for starting point: [part-12-end](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-12-end)

In this post:
 - [Equipment Entities](#equipment-entities)
 - [Equipable Equipment](#equipable-equipment)
 - [Modifying Stats with Equipment](#modifying-stats-with-equipment)
 - [Balance Item Distribution](#balance-item-distribution)
 - [Log Message for Equipment](#log-message-for-equipment)

## {% anchor equipment-entities | Equipment Entities %}

Add additional item types to represent equipment.

```rust
// world.rs
...
pub enum ItemType {
    ...
    Sword,
    Staff,
    Armour,
    Robe,
}

impl ItemType {
    pub fn name(self) -> &'static str {
        match self {
            ...
            Self::Sword => "sword",
            Self::Staff => "staff",
            Self::Armour => "armour",
            Self::Robe => "robe",
        }
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
        ...
        let usage = match item_type {
            ItemType::HealthPotion => {
                ...
            }
            ItemType::FireballScroll | ItemType::ConfusionScroll => ItemUsage::Aim,
            ItemType::Sword | ItemType::Staff | ItemType::Armour | ItemType::Robe => todo!(),
        };
        ...
    }

    pub fn maybe_use_item_aim(
        &mut self,
        character: Entity,
        inventory_index: usize,
        target: Coord,
        message_log: &mut Vec<LogMessage>,
    ) -> Result<(), ()> {
        ...
        match item_type {
            ItemType::HealthPotion
            | ItemType::Sword
            | ItemType::Staff
            | ItemType::Armour
            | ItemType::Robe => panic!("invalid item for aim"),
            ItemType::FireballScroll => {
                ...
            }
            ItemType::ConfusionScroll => {
                ...
            }
        }
        ...
    }
    ...
}
```

Add equipment to the item probability distribution. Set the probability of each to 1000
for now so it's highly likely that all items will be equipment. This will help us test.

```rust
// terrain.rs
...
fn make_item_probability_distribution(level: u32) -> Vec<(ItemType, u32)> {
    use ItemType::*;
    vec![
        (HealthPotion, 20),
        (
            FireballScroll,
            match level {
                0..=1 => 1,
                2..=4 => 5,
                _ => 10,
            },
        ),
        (
            ConfusionScroll,
            match level {
                0..=1 => 1,
                2..=4 => 3,
                _ => 5,
            },
        ),
        (Sword, 1000),
        (Staff, 1000),
        (Armour, 1000),
        (Robe, 1000),
    ]
}
...
```

Add some code for rendering the new item types.

```rust
// app.rs
...
pub mod colours {
    ...
    pub const SWORD: Rgb24 = Rgb24::new(187, 187, 187);
    pub const STAFF: Rgb24 = Rgb24::new(187, 127, 255);
    pub const ARMOUR: Rgb24 = Rgb24::new(127, 127, 127);
    pub const ROBE: Rgb24 = Rgb24::new(127, 127, 187);
    ...
    pub fn item_colour(item_type: ItemType) -> Rgb24 {
        match item_type {
            ItemType::HealthPotion => HEALTH_POTION,
            ItemType::FireballScroll => FIREBALL_SCROLL,
            ItemType::ConfusionScroll => CONFUSION_SCROLL,
            ItemType::Sword => SWORD,
            ItemType::Staff => STAFF,
            ItemType::Armour => ARMOUR,
            ItemType::Robe => ROBE,
        }
    }
    ...
}

fn currently_visible_view_cell_of_tile(tile: Tile) -> ViewCell {
    match tile {
        ...
        Tile::Item(ItemType::Sword) => ViewCell::new()
            .with_bold(true)
            .with_character('/')
            .with_foreground(colours::SWORD),
        Tile::Item(ItemType::Staff) => ViewCell::new()
            .with_bold(true)
            .with_character('\\')
            .with_foreground(colours::STAFF),
        Tile::Item(ItemType::Armour) => ViewCell::new()
            .with_bold(true)
            .with_character(']')
            .with_foreground(colours::ARMOUR),
        Tile::Item(ItemType::Robe) => ViewCell::new()
            .with_bold(true)
            .with_character('}')
            .with_foreground(colours::ROBE),
        ...
    }
}

```

The game will now populate levels with equipment.
Since equipment are just regular items, they can already be picked up, dropped, and viewed in
the inventory. Attempting to use a piece of equipment will panic at the moment (the `todo!()` macro).

{% image items.png %}

Reference implementation branch: [part-13.0](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-13.0)

## {% anchor equipable-equipment | Equipable Equipment %}

We'll allow equipment to be equipped in two slots. Armour and robes go in the "worn" slot,
and swords and staffs go in the "held" slot.
We'll keep track of whit is equipped by adding two components - `equipment_worn_inventory_index` and
`equipment_held_inventory_index` - which will store the index in the player's inventory containing the
items equipped in the respective slots.

```rust
// world.rs
...
entity_table::declare_entity_module! {
    components {
        ...
        equipment_worn_inventory_index: usize,
        equipment_held_inventory_index: usize,
    }
}
...
```

Replace the `todo!()` from the previous section to allow equipment items to be used from the inventory menu,
which will cause the item to be equipped.

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
    ) -> Result<ItemUsage, ()> {
        ...
        let usage = match item_type {
            ItemType::HealthPotion => {
                ...
            }
            ItemType::FireballScroll | ItemType::ConfusionScroll => ItemUsage::Aim,
            ItemType::Sword | ItemType::Staff => {
                self.components
                    .equipment_held_inventory_index
                    .insert(character, inventory_index);
                ItemUsage::Immediate
            }
            ItemType::Armour | ItemType::Robe => {
                self.components
                    .equipment_worn_inventory_index
                    .insert(character, inventory_index);
                ItemUsage::Immediate
            }
        };
        ...
    }
    ...
}
```

Update the logic for dropping items so that equipped items are unequipped if they are dropped.
```rust
// world.rs
...
impl World {
    ...
    pub fn maybe_drop_item(
        &mut self,
        character: Entity,
        inventory_index: usize,
        message_log: &mut Vec<LogMessage>,
    ) -> Result<(), ()> {
        ...
        if self
            .components
            .equipment_held_inventory_index
            .get(character)
            .cloned()
            == Some(inventory_index)
        {
            self.components
                .equipment_held_inventory_index
                .remove(character);
        }
        if self
            .components
            .equipment_worn_inventory_index
            .get(character)
            .cloned()
            == Some(inventory_index)
        {
            self.components
                .equipment_worn_inventory_index
                .remove(character);
        }
        ...
    }
    ...
}
```

To tell the player what they currently have equipped, we'll update the inventory menu to display
the equipment slot occupied by equipped items. Add a type to `world.rs` representing the inventory
slot indices corresponding to equipped items (if any), and a method for returning the equipment
inventory slots of a given entity.

```rust
// world.rs
...
pub struct EquippedInventoryIndices {
    pub worn: Option<usize>,
    pub held: Option<usize>,
}
...
impl World {
    ...
    pub fn equipped_inventory_indices(&self, entity: Entity) -> EquippedInventoryIndices {
        let held = self
            .components
            .equipment_held_inventory_index
            .get(entity)
            .cloned();
        let worn = self
            .components
            .equipment_worn_inventory_index
            .get(entity)
            .cloned();
        EquippedInventoryIndices { held, worn }
    }
    ...
}
```

Add a method to `GameState` for querying the player's `EquippedInventoryIndices`.

```rust
// game.rs
...
use crate::world::{
    EquippedInventoryIndices, HitPoints, Inventory, ItemType, ItemUsage, Location, NpcType,
    Populate, ProjectileType, Tile, World,
};
...
impl GameState {
    ...
    pub fn player_equipped_inventory_indices(&self) -> EquippedInventoryIndices {
        self.world.equipped_inventory_indices(self.player_entity)
    }
}
```

Update the rendering logic for the inventory menu to show the equipment slots corresponding
to equipped items.

```rust
// app.rs
...
impl<'a> View<&'a AppData> for InventorySlotMenuView {
    fn view<F: Frame, C: ColModify>(
        &mut self,
        data: &'a AppData,
        context: ViewContext<C>,
        frame: &mut F,
    ) {
        ...
        let equipped_indices = data.game_state.player_equipped_inventory_indices();
        for ((i, entry, maybe_selected), &slot) in data
            .inventory_slot_menu
            .menu_instance()
            .enumerate()
            .zip(player_inventory_slots.into_iter())
        {
            ...
            let prefix = format!("{} {}) ", selected_prefix, entry.key);
            let equipment_suffix = if equipped_indices.held == Some(i) {
                " (held)"
            } else if equipped_indices.worn == Some(i) {
                " (worn)"
            } else {
                ""
            };
            let text = &[
                ...
                RichTextPart {
                    text: equipment_suffix,
                    style: name_style,
                },
            ];
            ...
        }
    }
}
```

Now you can equip items by selecting them from the inventory. The name of their occupied equipment slot
will appear next to items in the inventory menu.

{% image inventory.png %}

Reference implementation branch: [part-13.1](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-13.1)

## {% anchor modifying-stats-with-equipment | Modifying Stats with Equipment %}

Right now you can equip items, but equipping an item doesn't actually change the game at all.
Let's make each item increase combat stats by a flat amount.

Add some methods to `World` for computing modifiers to various combat stats based on equipment.
The effect of equipping different items will be hard-coded into these methods.

```rust
// world.rs
...
impl World {
    ...
    fn inventory_item_type(&self, entity: Entity, index: usize) -> Option<ItemType> {
        self.components.inventory.get(entity).and_then(|inventory| {
            inventory
                .get(index)
                .ok()
                .and_then(|held_entity| self.components.item.get(held_entity).cloned())
        })
    }
    fn damage_modifier(&self, entity: Entity) -> i32 {
        self.components
            .equipment_held_inventory_index
            .get(entity)
            .and_then(|&held_index| {
                self.inventory_item_type(entity, held_index)
                    .map(|item_type| match item_type {
                        ItemType::Sword => 1,
                        _ => 0,
                    })
            })
            .unwrap_or(0)
    }
    fn defense_modifier(&self, entity: Entity) -> i32 {
        self.components
            .equipment_worn_inventory_index
            .get(entity)
            .and_then(|&held_index| {
                self.inventory_item_type(entity, held_index)
                    .map(|item_type| match item_type {
                        ItemType::Armour => 1,
                        _ => 0,
                    })
            })
            .unwrap_or(0)
    }
    fn magic_modifier(&self, entity: Entity) -> i32 {
        let held = self
            .components
            .equipment_held_inventory_index
            .get(entity)
            .and_then(|&held_index| {
                self.inventory_item_type(entity, held_index)
                    .map(|item_type| match item_type {
                        ItemType::Staff => 1,
                        _ => 0,
                    })
            })
            .unwrap_or(0);
        let worn = self
            .components
            .equipment_worn_inventory_index
            .get(entity)
            .and_then(|&held_index| {
                self.inventory_item_type(entity, held_index)
                    .map(|item_type| match item_type {
                        ItemType::Robe => 1,
                        _ => 0,
                    })
            })
            .unwrap_or(0);
        held + worn
    }
    ...
}
```

Update `World::character_bump_attack` to take modifiers into account.

```rust
// world.rs
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
        let attacker_damage_modifier = self.damage_modifier(attacker);
        let &victim_dexterity = self.components.dexterity.get(victim).unwrap();
        let victim_defense_modifier = self.defense_modifier(victim);
        let gross_damage = attacker_base_damage
            + rng.gen_range(0, attacker_strength + 1)
            + attacker_damage_modifier;
        let damage_reduction = rng.gen_range(0, victim_dexterity + 1) + victim_defense_modifier;
        let net_damage = gross_damage.saturating_sub(damage_reduction).max(0) as u32;
        ...
    }
    ...
}
```

Add a method `World::magic` which computes a magic score based on intelligence and the magic modifier,
and use this to determine the power of spells.
```rust
// world.rs
...
impl World {
    ...
    fn magic(&self, entity: Entity) -> i32 {
        self.components
            .intelligence
            .get(entity)
            .cloned()
            .unwrap_or(0)
            + self.magic_modifier(entity)
    }
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
                    damage: self.magic(character).max(0) as u32,
                };
                message_log.push(LogMessage::PlayerLaunchesProjectile(fireball));
                self.spawn_projectile(character_coord, target, fireball);
            }
            ItemType::ConfusionScroll => {
                let confusion = ProjectileType::Confusion {
                    duration: self.magic(character).max(0) as u32 * 3,
                };
                message_log.push(LogMessage::PlayerLaunchesProjectile(confusion));
                self.spawn_projectile(character_coord, target, confusion);
            }
        }
        ...
    }
    ...
}
```

Reference implementation branch: [part-13.2](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-13.2)

## {% anchor balance-item-distribution | Balance Item Distribution %}

Replace the debugging values in `make_item_probability_distribution` with smaller values.
To further reduce the odds of an item being a piece of equipment, increase the probability of
the other items too. Make the odds of finding equipment go up the deeper the player is in the dungeon.

```rust
// terrain.rs
...
fn make_item_probability_distribution(level: u32) -> Vec<(ItemType, u32)> {
    use ItemType::*;
    let item_chance = match level {
        0..=1 => 5,
        2..=3 => 10,
        _ => 20,
    };
    vec![
        (HealthPotion, 200),
        (
            FireballScroll,
            match level {
                0..=1 => 10,
                2..=4 => 50,
                _ => 100,
            },
        ),
        (
            ConfusionScroll,
            match level {
                0..=1 => 10,
                2..=4 => 30,
                _ => 50,
            },
        ),
        (Sword, item_chance),
        (Staff, item_chance),
        (Armour, item_chance),
        (Robe, item_chance),
    ]
}
...
```

These numbers were chosen fairly arbitrarily. Tune these based on the result of play-testing.

Reference implementation branch: [part-13.3](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-13.3)

## {% anchor log-message-for-equipment | Log Message for Equipment %}

One final touch - adding a log message when the player equips an item.

```rust
// game.rs
...
pub enum LogMessage {
    ...
    PlayerEquips(ItemType),
}
```

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
    ) -> Result<ItemUsage, ()> {
        ...
        let usage = match item_type {
            ItemType::HealthPotion => {
                ...
            }
            ItemType::FireballScroll | ItemType::ConfusionScroll => ItemUsage::Aim,
            ItemType::Sword | ItemType::Staff => {
                self.components
                    .equipment_held_inventory_index
                    .insert(character, inventory_index);
                message_log.push(LogMessage::PlayerEquips(item_type));
                ItemUsage::Immediate
            }
            ItemType::Armour | ItemType::Robe => {
                self.components
                    .equipment_worn_inventory_index
                    .insert(character, inventory_index);
                message_log.push(LogMessage::PlayerEquips(item_type));
                ItemUsage::Immediate
            }
        };
        ...
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
                PlayerEquips(item_type) => {
                    write!(&mut buf[0].text, "You equip the ").unwrap();
                    write!(&mut buf[1].text, "{}", item_type.name()).unwrap();
                    buf[1].style.foreground = Some(colours::item_colour(item_type));
                    write!(&mut buf[2].text, ".").unwrap();
                }
            }
        }
        ...
    }
}
...
```

{% image message.png %}

That concludes the tutorial series. There's still a lot more work to do before this game can be considered complete.
It has no ending, and is very light on content and mechanics. Hopefully by now you have enough of a handle on
`chargrid` that you can extend the project we made here into the roguelike of your dreams.

Reference implementation branch: [part-13.4](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-13.4)
