+++
title = "Programming Languages Make Terrible Game Engines"
date = 2017-03-25T14:26:01+10:00
path = "programming-languages-make-terrible-game-engines"

[taxonomies]
tags = ["gamedev", "roguelikes"]
+++

This is the first of a series of posts I'm writing to explain the
inner workings of the game engine I used for my 7DRL: [Apocalypse
Post](https://gridbugs.itch.io/apocalypse-post). It motivates one of the
problems I set out to solve with the engine - how to represent the types of game
entities.

## Edit

In the [discussion](https://www.reddit.com/r/roguelikedev/comments/61elh1/programming_languages_make_terrible_game_engines/)
about this post, it was pointed out that the object-oriented examples below are
examples of bad object-oriented design. I agree with this, and I'm not trying to argue that
it's impossible to design a good game engine using object-oriented programming.
The examples illustrate how someone new to building game engines might attempt
to use class inheritance to describe the types of game entities. The article
demonstrates the problems with this approach, and suggests a non-object-oriented
alternative.

## You want types

You're making a game engine, and you want a way to categorize entities in your
game, so the engine knows what operations it can perform on an entity.
You want a way to express the fact that **Weapons** can be fired, **Characters** can act,
**Equipment** can be equipped, and so on.

## Your programming language *has* types!

Preface: Don't do this!

*Aha*, you say, *I just need to create abstract classes for **Weapon**, **Character**,
**Equipment**, and inherit them for concrete classes representing game entities*.

```java
class GameEntity { ... }

class Weapon extends GameEntity { int damage(); }
class Character extends GameEntity { Action act(); }
class Equipment extends GameEntity { void equip(Character); }

class Sword extends Weapon { ... }
class Human extends Character { ... }
class Zombie extends Character { ... }
```

But hang on, swords can also be equipped, we need multiple inheritance:

```java
class GameEntity { ... }

interface Weapon { int damage(); }
interface Character { Action act(); }
interface Equipment { void equip(Character); }

class Sword extends GameEntity implements Weapon, Equipable { ... }
class Human extends GameEntity implements Character { ... }
class Zombie extends GameEntity implements Character { ... }
```

When a human is bitten by a zombie, they should turn into a zombie. Wait **turn
into**?

Perhaps we can do something like:

```java
interface TurnsIntoZombie { Zombie turn_into(); }

class Human extends GameEntity
    implements Character, TurnsIntoZombie { ... }
```

This raises some questions:
 - What does `turn_into` actually do? It needs to take a bunch the fields from
   the **Human**, (equipment, physical stats), and create a new **Zombie** with
   those fields, since it would be nice if the re-animated human in some ways
   resembled their former self. Somehow we also need to make the original
   **Human** object unusable, and ensure that there are no references to it that
   might still try to treat the copied fields as if they were part of a human.
 - There will probably be other types of character besides humans and zombies,
   and some may implement **TurnsIntoZombie**.
   This implies that whenever *something* is bitten by a zombie, we need to
   check (at runtime) whether it turns into a zombie. Alternatively,
   `turn_into` could be moved into the **Character** interface, and do nothing for
   characters that shouldn't become zombies (should it return `null`?).

How should game entities be stored? One can imagine using a collection of
**GameEntity**.
The major problem is that the type information is lost from the
entities in the array, and upon pulling something out of the array, we need to
check what it is, and then cast it appropriately. An alternative may be to use a
separate collection of entities for each entity type. Entities may belong to
multiple types (e.g. a **Sword** is both **Equipable** and a **Weapon**), so
each may appear in several collections, and we would then have to manage the fact
that if an item is destroyed, it must be removed from all the lists that contain
it.

## Programming language types map poorly to game entities

The cracks are starting to show:
 - Programming language types are static, in the sense that an object's type
   does not change. In games you want the types of game entities to be mutable.
 - You're forced to use multiple inheritance if you want entities to fit into
   multiple categories. Not all languages support this, and it comes with
   its own set of problems.
 - You're forced to check types at runtime. There's nothing wrong with checking
   types at runtime, but if you're going to do it, why tie yourself to your
   programming language's type system?

## Composition over Inheritance!

The big problem with mapping language types onto game entities is that language
types are often concerned with describing what an object **is**, whereas game
entities are best described in terms of what an object **has**.

Here's how one might describe the example above, without trying to fit game
entities into language types. I'm switching from java to rust because I no
longer need to give examples of object-oriented programming (phew!).

```rust
struct GameEntity {
    weapon_damage: Option<u64>,
    actor_state: Option<ActorState>, // defined below
    human: bool,
    zombie: bool,

    // collection of keys into entity_table (below)
    equipment: Option<HashSet<u64>>,
}

struct GameState {
    entity_table: HashMap<u64, GameEntity>,
}

struct ActorState { ... }
impl ActorState {
    fn new_human_state() -> ActorState { ... }
    fn new_zombie_state() -> ActorState { ... }
    fn (&mut self) -> Action { ... }
}

fn new_sword(damage: u64) -> GameEntity {
    GameEntity {
        weapon_damage: Some(damage),
        actor_state: None, // a sword cannot act
        human: false,
        zombie: false,
        equipment: None,
    }
}

fn new_human() -> GameEntity {
    GameEntity {
        weapon_damage: None,
        actor_state: Some(ActorState::new_human_state()),
        human: true,
        zombie: false,
        equipment: Some(HashSet::new()),
    }
}
```

Every entity in the game is a `GameEntity`. A `GameEntity` is a collection of
properties that an entity might have, and the categorization of the entity is
based on which properties have values, and what those values are. Each field is
either an `Option` which may contain some data, or a `bool` denoting the
existence of a property with no associated data.

Note that there are more efficient ways to represent entities than structs of
`Options` and `bools`. I'll cover this in a later article.

Changing the type of an entity is now as simple as changing some of its fields:

```rust
fn become_zombie(entity: &mut GameEntity) {
    // replace human ai with zombie ai
    entity.actor_state = Some(ActorState::new_zombie_state());

    entity.human = false;
    entity.zombie = true;
}
```

The price one pays for this dynamism is there is much more flexibility possible,
not all of it desirable. What would happen if `become_zombie` was called on a
sword? The programmer must now think about these extra possibilities and
explicitly check for them, rather than the language doing this checking at
compile time. I argue that this is a reasonable trade-off, as you no longer need
to worry about the engine not being flexible enough to express a behaviour
you *do* want.

## So far so good

The first few game engines I developed used a class hierarchy to represent game
entities, and I was plagued by situations that I couldn't
represent. Since switching to this approach, I'm yet to encounter such a
situation.

## Further Reading

Representing entities by their constituent parts is how data is represented in
an [Entity Component
System](https://en.wikipedia.org/wiki/Entity%E2%80%93component%E2%80%93system).
