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

Add a method to `GameState` for examining a cell at a coordinate *if it is currently visible to the player*.
Also add a method returning the player current coordinate which will come in handy soon.

{% pygments rust %}
// game.rs
...
impl GameState {
    ...
}
{% endpygments %}


{% image examine.png %}

Reference implementation branch: [part-9.0](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-9.0)

## {% anchor place-fireball-scrolls | Place Fireball Scrolls %}

{% image fireball-scroll.png %}

Reference implementation branch: [part-9.1](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-9.1)

## {% anchor launching-fireballs | Launching Fireballs %}

{% image aim.png %}
{% image launch.png %}
{% image hit.png %}

Reference implementation branch: [part-9.2](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-9.2)

## {% anchor confusion-scroll | Confusion Scroll %}

{% image confusion.png %}

Reference implementation branch: [part-9.3](https://github.com/stevebob/chargrid-roguelike-tutorial-2020/tree/part-9.3)
