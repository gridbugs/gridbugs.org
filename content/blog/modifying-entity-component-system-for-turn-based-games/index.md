+++
title = "Modifying Entity Component System for Turn-Based Games"
date = 2017-04-01T19:28:01+10:00
path = "modifying-entity-component-system-for-turn-based-games"

[taxonomies]
tags = ["gamedev", "roguelikes"]
+++

This article describes my modifications to the
[Entity Component System (ECS)](https://en.wikipedia.org/wiki/Entity%E2%80%93component%E2%80%93system)
architecture pattern to better support a turn-based game loop.
This involves implementing game logic in **actions** which describe
changes to the game's state, and **rules** which prevent certain actions, and
trigger additional reactions. The combination of actions and rules replace the
traditional idea of **systems**.

I implemented these changes in the engine I used for my 7DRL: [Apocalypse
Post](https://gridbugs.itch.io/apocalypse-post).

## Entity Component Systems

**Entities** are objects in the game world. Each entity has a collection of
**components** that define what that entity is. A component is a piece of typed
data. All the data making up the game state is in the form of components, each
belonging to exactly one entity. Some example components:
 - a **position** which stores the location of an entity
 - a **velocity** which stores the speed and direction in which an entity is
   moving
 - a **solid** flag, which denotes an entity as being solid for the purposes of
   collision detection
 - a **tile** which tells the renderer how to draw a component
 - a **controlled** flag which denotes that this entity is controlled by the
   player

All game logic is implemented in the form of **systems**. Each system is
interested in a particular set of components. Typically, systems are described
as running continuously, or having periodic ticks, where they iterate over all
the entities that possess its interested set of components, and performing some
system-specific operation. Some example systems:
 - **movement:** For each entity with a **position** and **velocity**, move the entity by
   changing its **position** based on its **velocity**.
 - **collision:** For each entity with a **position**, **velocity** and **solid**, if it
   attempted to move through another entity with **solid**, apply some collision
   resolution policy.
 - **input:** If a button is currently pressed, corresponding to some
   game control, apply the effect of that control to each entity with a
   **controlled** component.
 - **renderer:** For each entity with a **position** and a **tile**, draw the
   image described by the entity's **tile** at a location on the screen based on
   the entity's **position**.

## Game Loops

Here's a straw-person implementation for the game loop of an ECS game engine.

```javascript
function game_loop(game_state) {
    forever {

        time_delta = wait_for_frame();

        for each system in systems {
            system.tick(game_state, time_delta);
        }
    }
}
```

This is perhaps an over-simplification, though most of the literature I've read
about ECS describes something resembling that game loop. I claim that this game
loop is more suited for real-time games than turn-based games.

In a real-time
game, you must constantly re-render the scene so the player can see changes to
the game's state. At any point, the player may press button, and the game state
must update immediately. Physics is constantly being enforced, non-player
characters are
constantly determining what to do next, animations are always being played.
Everything notionally happens at once, all the time, so the idea of a periodic
tick makes sense.

In a turn-based game, each character (player or non-player) acts on their turn.
Typically, they perform a single action, which may have some follow-on actions,
and then it's the next player's turn. The scene only needs to be rendered after
the state of the game has changed.

For my game, I wanted to have a game loop resembling:

```javascript
function game_loop(game_state) {
    forever {

        /* Figure out whose turn it is. */
        current_character = schedule.get_next_character();

        /* The character declares an action they will take.
         * This blocks waiting for input if it's the player's turn.
         * Otherwise the AI for the character is invoked. */
        action = current_character.determine_action();

        /* If the rules permit the action... */
        if rules.permit(action) {
            /* ...then actually do the action. */
            game_state.commit(action);
        }

        /* Schedule the character's next turn. */
        schedule.insert(current_character);

        /* Finally, render the scene. */
        renderer.render(game_state);
    }
}
```

Again, this is over-simplified. The key points are:
 - I want the ability to block waiting for input player's turn, rather than
   periodically sampling input. The motivation for this is power-saving.
 - I only want to re-draw the scene when necessary, rather than periodically.
   This is also to save power.
 - I want the ability to reason about the outcome of an action before it is
   committed.

These goals are incompatible with the idea of **systems** as they are typically
described in ECS literature. In my engine, I implement game logic in
**actions**, which describe changes to the game state, and **rules**, which
describe restrictions on which actions can be committed, as well as follow-on
action which happen in response to certain actions. In the remainder of this
post, I'll describe how actions and rules work.

## Storing Data: Entities and Components

These are unchanged from the traditional ECS pattern, but I'll introduce my
implementation of them to simplify the explanation of new concepts later.

I consider two kinds of component:
 - **Data Components** store typed data about an entity.
 - **Flag Components** store no data, but their presence in an entity is
   meaningful.

An entity is represented by a unique identifier - namely, a 64-bit integer.
For each type of component, there is a single data structure which stores
values of that component for all entities. For data components, values are
stored in a hash table, keyed by entity id. If an entity has a particular data
component, that component's value will be stored against the entity's id in that
component's hash table. For each flag component, there is a
set of entity ids, such that if an entity's id is in the set, then that entity
is considered to have that component.


Here's an example entity store:
```rust

type EntityId = u64;

struct EntityStore {
    position: HashMap<EntityId, (isize, isize)>,
    door_state: HashMap<EntityId, DoorState>,
    tile: HashMap<EntityId, TileType>,
    solid: HashSet<EntityId>,
    can_open_doors: HashSet<EntityId>,
}

// supporting types
enum DoorState {
    Open,
    Closed,
}

enum TileType {
    OpenDoor,
    ClosedDoor,
    ...
}

// getters
impl EntityStore {
    fn get_position(&self, id: EntityId) -> Option<(isize, isize)> {
        self.position.get(&id).map(|v| *v)
    }
    // repeated for each data component

    fn contains_solid(&self, id: EntityId) -> bool {
        self.solid.contains(&id)
    }
    // repeated for each flag component
}
```

## Mutating Data: Actions

An action describes a change to the game state. There are a small number of
ways the game state can be changed:
 - the value of an entity's data component can be set (added or changed)
 - an entity can gain a new flag component
 - an entity can lose a component

Note that the first two types of change both correspond to an entry being added
to a component store. Also note that I only talk about components -
not entities. There is no global list of entities, and no explicit way to add or
remove entities. Adding an entity is equivalent to adding some components with
the new entity's id. Removing an entity is equivalent to removing the entries
from all component stores with the entity's id.

An action is represented by an `EntityStore` (defined above), storing all
component values being added or changed by the action. Additionally, for each
component type, an action has a set of entity id's that are losing that
component.

Example implementation:

```rust
struct RemovedComponents {
    position: HashSet<EntityId>,
    tile: HashSet<EntityId>,
    door_state: HashSet<EntityId>,
    tile: HashSet<EntityId>,
    solid: HashSet<EntityId>,
    can_open_doors: HashSet<EntityId>,
}

struct Action {
    additions: EnityStore,
    removals: RemovedComponents,
}

impl Action {
    pub fn remove_position(&mut self, id: EntityId) { ... }
    // repeated for each component

    pub fn insert_position(&mut self, id: EntityID,
                           value: (isize, isize)) { ... }
    // repeated for each data component

    pub fn insert_solid(&mut self, id: EntityId) { ... }
    // repeated for each flag component
}
```

The engine also needs a way to commit actions:

```rust
// applies `action` to `state`, clearing `action` in the process
fn commit_action(state: &mut EntityStore, action: &mut Action) {

    // removals
    for id in action.removals.position.drain(..) {
        state.position.remove(id);
    }

    // repeated for each component type
    ...

    // data insertions
    for (id, value) in action.insertions.position.drain(..) {
        state.position.insert(id, value);
    }

    // repeated for each data component type
    ...

    // flag insertions
    for id in actions.insertions.solid.drain(..) {
        state.solid.insert(id);
    }

    // repeated for each flag component type
    ...
}
```

Here are some example actions. Each is expressed as an "action constructor" function which populates
an empty action.

```rust
fn move_character(character_id: EntityId, direction: Direction,
        state: &EntityStore, action: &mut Action) {

    let current_position = state.get_position(character_id)
        .expect("Attempt to move entity with no position");

    let new_position = current_position + direction.unit_vector();

    action.insert_position(character_id, new_position);
}

fn open_door(door_id: EntityId, action: &mut Action) {

    action.remove_solid(door_id);
    action.insert_tile(door_id, TileType::OpenDoor);
    action.insert_door_state(door_id, DoorState::Open);
}

fn close_door(door_id: EntityId, action: &mut Action) {

    action.insert_solid(door_id);
    action.insert_tile(door_id, TileType::ClosedDoor);
    action.insert_door_state(door_id, DoorState::Closed);
}
```

Note how none of the functions above modify the game's state directly, but
rather construct an `Action` which describes how the state will be modified.

It will be convenient to be able to talk about the type of an action without
instantiating it:
```rust
enum ActionType {
    MoveCharacter(EntityId, Direction),
    OpenDoor(EntityId),
    CloseDoor(EntityId),
}
```

Given an `ActionType`, a `&EntityStore`, and a `&mut Action`, it's possible to
call the appropriate action constructor with all its arguments:
```rust
fn create_action(action_type: ActionType, state: &EntityStore, action: &mut Action) {
    // `action` is assumed to be initially empty

    match action_type {
        MoveCharacter(entity_id, direction) => {
            move_character(entity_id, direction, state, action);
        }
        OpenDoor(entity_id) => {
            open_door(entity_id, state, action);
        }
        CloseDoor(entity_id) => {
            close_door(entity_id, state, action);
        }
    }
}
```

## Game Logic: Rules

A game can have many rules. Each rules contains some logic that examines the
current state of the game, and an action, and decides:
 - whether the action is allowed to occur
 - which additional actions should occur
 - whether additional rules should be checked

Here's an example that encodes the mechanic where bumping into a
closed door will open the door.

```rust
enum ActionStatus {
    Accept,
    Reject,
}

enum RuleStatus {
    KeepChecking,
    StopChecking,
}

fn bump_open_doors(action: &Action, state: &EntityStore,
                   reactions: &mut Vec<ActionType>)
                   -> (ActionStatus, RuleStatus) {

    // loop through all positions set by the action
    for (id, position) in action.insertions.position.iter() {

        // Only proceed if this entity can actually open doors
        if !state.contains_can_open_doors(id) {
            continue;
        }

        // I promise I'll explain this below!
        if let Some(door_id) = GET_DOOR_IN_CELL(position) {

            // if the entity would move into a cell with a door...

            // ...open the door...
            reactions.push(ActionType::OpenDoor(door_id));

            // ...and prevent the move from occuring.
            return (ActionStatus::Reject, RuleStatus::StopChecking);
        }
    }

    // no doors were bumped, so check other rules
    return (ActionStatus::Accept, RuleStatus::KeepChecking);
}
```

The first unusual thing one might notice is the fact that the rule loops over
all the entities that moved. Since actions can contain an arbitrary number of
changed components, this is required in case multiple entities move in an action.
Since an action can either be accepted or rejected, if multiple entities attempt
to move, and one of the moves is invalid, the action will still be rejected.
Having fine-grained actions (where each action represents a small change) allows
rules to be more powerful, without having to worry about "collateral damage",
where some valid parts of an action don't go ahead because of other invalid
parts of the same action.

The next thing to note is that the rule doesn't just open the door there and
then. Instead, it queues up an action that will open the door. This will be an
action just like any other, and will go through the same rule-checking, so
there's a possibility that the door won't open, such as if the door is locked.

Now, what's going on with that `GET_DOOR_IN_CELL` function. So far I haven't
talked at all about reasoning about individual cells - only individual entities
or components. The `EntityStore` described earlier has no notion of cells, and
could be used for non grid-based games. All my applications of this engine so
far *have* been for games on a 2d grid, and most rules want to talk about
properties of cells, as well as properties of entities. To enable this, I use a
spatial hash, which I'll introduce now, and elaborate more on rules later.

## Spatial Hashing Interlude

In games where the world is represented as a grid, it's useful to be able to
reason about entire cells in the grid. At the very least, it would be nice to
easily iterate through a list of entities in a particular cell. I also want to,
have properties of cells based on aggregating over components of the entities
in the cell. For example, if a cell contains at least one entity which has the
**solid** component, I want that cell to be considered solid.

There's nothing too exciting about implementing a 2d grid of cells. Suffice it
to say I have a type `SpatialHashTable` with the following interface:
```rust
impl SpatialHashTable {

    // Update the spatial hash table with an action that's about
    // to be applied. In order for the spatial hash table to
    // accurately reflect the state of its corresponding
    // EntityStore, this method must be called each time an
    // action is committed to said EntityStore.
    fn update(&mut self, action: &Action) { ... }

    // Returns a particular cell in the spatial hash table which
    // can be queried further.
    fn get(&self, x: usize, y: usize) -> &SpatialHashCell { ... }
}
```

The cells are more interesting. Each cell maintains a set containing the ids of
all entities in the cell. When an entity moves, the
entity id set of the source cell and destination cell must be updated.
Additionally, for aggregate values, each time an entity moves or the component
relevant to the aggregate changes, the aggregate value must be updated.

There are different ways to aggregate properties of cells, with different use
cases. This post will cover two different aggregates:
 - Booleans that are true if there is at least one entity with a
   certain component in a cell. The cell will maintain a count
   of the number of entities with the component.
 - Sets that store the ids of all the entities in a cell with a given
   component.

```rust
struct SpatialHashCell {

    // all the entities in this cell
    entities: HashSet<EntityId>,

    // keep track of the number of solid entities in this cell
    solid: usize,

    // maintain a set of entities with the `door_state` component
    // in this cell
    door_state: HashSet<EntityId>,
}

impl SpatialHashCell {

    // returns true iff there is at least one solid entity
    // in this cell
    fn is_solid(&self) -> bool {
        self.solid > 0
    }

    // returns the id of an arbitrarily chosen entity
    // in this cell with the `door_state` component
    fn any_door_state(&self) -> Option<EntityId> {
        self.door_state.iter().next().map(|s| *s)
    }
}
```

One may question the sense of allowing multiple entities with the **door_state**
component to exist in a single cell. There are unlikely to be any realistic
scenarios where there are multiple doors with the same position. However, the
simplest way to implement the entity store is allow it to store any combinations
of entities, and implement higher-level policy to be elsewhere (e.g. in actions
or rules).

## Back to Rules

Rules now take an additional argument: a `SpatialHashTable`!

```rust
fn bump_open_doors(action: &Action, state: &EntityStore,
                   spatial_hash: &SpatialHashTable, // <-- NEW!
                   reactions: &mut Vec<ActionType>)
                   -> (ActionStatus, RuleStatus) {

    // loop through all positions set by the action
    for (id, position) in action.insertions.position.iter() {

        // Only proceed if this entity can actually open doors
        if !state.contains_can_open_doors(id) {
            continue;
        }

        // NEW!
        if let Some(door_id) =
            spatial_hash.get(position).any_door_state() {

            // if the entity would move into a cell with a door...

            // ...open the door...
            reactions.push(ActionType::OpenDoor(door_id));

            // ...and prevent the move from occuring.
            return (ActionStatus::Reject, RuleStatus::StopChecking);
        }
    }

    // no doors were bumped, so check other rules
    return (ActionStatus::Accept, RuleStatus::KeepChecking);
}
```

How should we handle an action that moves an entity, and gives it the ability to
open doors at the same time? Suppose a character that could not open doors
gained the ability to open doors, and moved into a cell containing a door, as a
single action. I'd like the door to open in response.

Note that the check `if !state.contains_can_open_doors(id) {`
queries the current state of the game only. Since the character currently
can't open doors, this check will prevent the door from being opened.

I could add an additional check that examines the action, to see if the entity
moving into a door is about to gain the ability to open doors, but this feels
cumbersome. Instead, I want a way to talk about the state of the game after an
action has been committed, without actually committing the action.

Since the game state and actions are both described in terms of components, I
can turn a reference to a game state and a reference to an action into something
that looks like the state of the game following the action:

```rust
struct EntityStoreAfterAction<'a> {
    entity_store: &'a EntityStore,
    action: &'a Action,
}

// the same getters as an EntityStore
impl<'a> EntityStoreAfterAction<'a> {

    fn get_position(&self, id: EntityId) -> Option<(isize, isize)> {

        // if the component is being inserted, return it
        if let Some(value) = self.action.insertions.get_position(id) {
            return Some(value);
        }

        // if the component is being removed, prevent the original
        // value from being returned
        if self.action.removals.position.contains(&id) {
            return None;
        }

        // return the original value
        return self.entity_store.get_position(id);
    }

    ...
}
```

An `EntityStoreAfterAction` looks like an `EntityStore`! They both implement the
same query interface, but `EntityStoreAfterAction` lets us query the future.

Modifying the rule to use `EntityStoreAfterAction`:
```rust
fn bump_open_doors(action: &Action, state: &EntityStore,
                   spatial_hash: &SpatialHashTable,
                   reactions: &mut Vec<ActionType>)
                   -> (ActionStatus, RuleStatus) {

    // NEW!
    let future_state = EntityStoreAfterAction {
        entity_store: state,
        action: action,
    };

    // loop through all positions set by the action
    for (id, position) in action.insertions.position.iter() {

        // Only proceed if this entity can actually open doors
        if !future_state.contains_can_open_doors(id) { // <-- CHANGED!
            continue;
        }

        if let Some(door_id) =
            spatial_hash.get(position).any_door_state() {

            // if the entity would move into a cell with a door...

            // ...open the door...
            reactions.push(ActionType::OpenDoor(door_id));

            // ...and prevent the move from occuring.
            return (ActionStatus::Reject, RuleStatus::StopChecking);
        }
    }

    // no doors were bumped, so check other rules
    return (ActionStatus::Accept, RuleStatus::KeepChecking);
}
```

The order in which rules are checked effects their outcome. For example,
consider the following collision rule, that states that solid entities cannot
move through other solid entities.

```rust
fn collision(action: &Action, state: &EntityStore,
             spatial_hash: &SpatialHashTable,
             reactions: &mut Vec<ActionType>)
             -> (ActionStatus, RuleStatus) {

    let future_state = EntityStoreAfterAction {
        entity_store: state,
        action: action,
    };

    for (id, position) in action.insertions.position.iter() {

        if !future_state.contains_solid(id) {
            continue;
        }

        if spatial_hash.get(position).is_solid() {
            return (ActionStatus::Reject, RuleStatus::StopChecking);
        }
    }

    return (ActionStatus::Accept, RuleStatus::KeepChecking);
}
```

Since closed doors are solid, if the `collision` rule was checked before the
`bump_open_doors` rule, the action would be rejected and we'd stop checking
rules, so the logic that opens doors would never run. Thus, `bump_open_doors`
should be checked before `collision`.

## Putting it all together

This is roughly how my game loop works:

```
// the type of a rule function (e.g. collision)
type RuleFn = ...;

// knows which entity's turn it is
struct TurnSchedule { ... };

struct Game {
    // All entities and components in the game world.
    state: EntityStore,

    // List of rules in the order they will be checked.
    rules: Vec<RuleFn>,

    // Used to determine whose turn it is.
    schedule: TurnSchedule,

    // It turns out you only need to have a single action
    // instantiated at a time. Store this as part of the
    // game to remove the overhead of creating a new
    // action each time we need one.
    action: Action,

    // A queue of actions waiting to be processed in the
    // current turn.
    pending_actions: VecDeque<ActionType>,

    // Rules have the ability to enqueue follow-on actions,
    // which will also be processed by rules. The follow-on
    // actions enqueued by a rule as it checks an action
    // are only added to pending_actions if the action being
    // checked gets accepted. Follow-on actions are
    // temporarily stored here, and added to pending_actions
    // if the current action is accepted.
    //
    // There is a separate queue for actions enqueued by
    // accepting rules and rejecting rules. This allows
    // accepting rules to enqueue actions that will only
    // occur if the action ends up getting accepted.
    follon_on_accepted: VecDequeue<ActionType>,
    follon_on_rejected: VecDequeue<ActionType>,
    follon_on_current: VecDequeue<ActionType>,
}

impl Game {

    fn game_loop(&mut self) {
        loop {
            // Figure out whose turn it is.
            let entity_id: EntityId =
                self.schedule.next_turn();

            // The current entity decides an action.
            // This waits for player input if it's
            // the player's turn, and invokes the AI
            // if it's an NPC's turn.
            // The details of choosing an action are
            // out of scope.
            let action_type: ActionType =
                CHOOSE_ACTION(&self.state, entity_id);

            // Equeue the action for processing
            self.pending_actions.push_back(action_type);

            // Check rules, and handle any follow-on
            // actions.
            self.process_actions();

            // Allow the entity to take another turn
            // at some point in the future.
            self.schedule.insert(entity_id);
        }
    }

    fn process_actions(&mut self) {

        // Repeat until there are no pending actions.
        while let Some(action_type) =
            self.pending_actions.pop_front() {

            // Populate self.action based on the
            // value of action_type.
            self.action.instantiate_from(action_type,
                                         &self.state);

            let mut accepted = true;

            // For each rule
            for rule in self.rules.iter() {

                // Check the rule
                let (action_status, rule_status) =
                    rule(&self.action. &self.state,
                         &mut self.follow_on_current);

                // If a single rule rejects an action,
                // the action is rejected.
                if action_status == ActionStatus::Reject {
                    accepted = false;

                    // Drain follow-on actions into
                    // rejected queue.
                    for a in self.follow_on_current.drain(..) {
                        self.follow_on_rejected.push_back(a);
                    }
                } else {
                    // Drain follow-on actions into
                    // accepted queue.
                    for a in self.follow_on_current.drain(..) {
                        self.follow_on_accepted.push_back(a);
                    }
                }

                // Stop checking rules if the rule say so.
                if rule_status == RuleStatus::StopChecking {
                    break;
                }
            }

            if accepted {

                // Apply the action, clearing the action in the
                // process.
                commit_action(&mut self.state, &mut self.action);

                // It's only necessary to re-draw the scene after
                // something has changed.
                // The details of rendering are out of scope.
                RENDER();

                // Enqueue all the follow-on actions.
                for a in self.follow_on_accepted.drain(..) {
                    self.pending_actions.push_back(a);
                }

            } else {

                // The action was rejected.
                // Clear the action.
                self.action.clear();

                // Enqueue all the follow-on actions.
                for a in self.follow_on_rejected.drain(..) {
                    self.pending_actions.push_back(a);
                }
            }
        }
    }
}

```

## Limitations

While using this engine for the 7DRL, I noticed some problems with its current
design.

### Isolated Rules

Splitting up the game logic into many individual rules leads to high cognitive load.
The motivation for having lots of small, modular, isolated rules, was to
*decrease* cognitive load, but it ended up having the opposite effect. The problem
is that rules aren't completely isolated. If rules are checked in the wrong order
they can be unintentionally skipped. Rules have the ability to make the global decision
of whether or not to keep checking the remaining rules.

It's not even clear whether attempting to
isolate rules from one another is the right approach. A lot of the fun in turn-based
games comes from the interaction of different mechanics, so forcing the rules to
be isolated may be harmful, compared to a framework that allows rules to
explicitly cooperate.

Most of the rules reason about changes in position. This means, each rule must
loop over all the changes in position in the current action, and apply some
policy. The isolation between rules leads to several rules checking the same
component, and unnecessarily repeating work. This is more evidencing suggesting
I should stop isolating rules from one another.

### Intra-turn Real-time Animation

My engine allows a delay to be added between actions during a turn, to allow
real-time animations to be implemented as part of a turn's resolution. In the gif
below, the bullet
leaving the van and hitting the barrel, and the subsequent explosions, are all
part of a single turn.

![explosion.gif](explosion.gif)

This is implemented using rules. Entities can have a **velocity** component, and
there is a rule that detects when an entity moves because of their velocity, and
schedules an additional action to move them again, resulting in a chain of
repeated move actions being committed.

This is a testament to the expressive power of actions and rules, but it feels
unnecessarily complicated. Also, when something goes wrong, debugging this chain
of actions and rules is a nightmare.

To simplify this, I'm thinking about adding a hook to the turn-resolution loop
that is called at each discrete point in (real) time as a turn is resolved. It would allow some game logic to
be invoked periodically to implement real-time mechanics. For example, it would take
all the entities with a velocity, and update their position such that they move
under their velocity. Sound familiar? I guess there's a place for **systems** in
my engine after all.

## Summary

My turn-based game engine uses a modified form of ECS. I still store data using entities
and components, but I found the idea of systems to be more suited to real-time
games. In my engine, I replace **systems** with **actions** and **rules**. Actions
describe discrete changes to the game's state, in terms of entities and
components. Rules determine whether an action is allowed to happen, and which
additional actions will happen as a result.
