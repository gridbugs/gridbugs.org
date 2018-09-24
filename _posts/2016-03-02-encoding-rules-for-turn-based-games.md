---
layout: post
title: "Encoding Rules for Turn-Based Games"
date: 2016-03-02 23:20:01 +1000
permalink: encoding-rules-for-turn-based-games
categories: gamedev roguelikes
---

A key consideration when designing a game engine is how rules of the game will
be encoded. The engine needs a way of enforcing statements such as "Doors can
only be passed through if they are open", and "If a burning character walks into
a pool of water, it stops burning". The expressiveness of a game engine's
rule-encoding is important, as it dictates the limitations of mechanics that can
be implemented in games. Nobody wants to discover late in development that their
engine can't be used to efficiently implement a certain feature.

This post will describe the framework I developed to encode rules in two games I
recently made: [Glacial](/glacial) and [Bugcatcher](/bugcatcher). It's based on
the idea of an Entity Component System (ECS), extended with the abstraction of
Actions.

## Entity Component System
Every object in the game (walls,
characters, doors, bullets, etc) is represented by an **entity**. An
entity is simply a container for storing **components**. Components store
information about objects in the world. The fact that an object is solid, that
an object is opaque, that it has health or that it can take actions are all
examples of components. The key idea of ECS is that all the information about
the state of the world is stored in components, and each entity is simply a
collection of various components.

The rules of the game are represented by various systems that operate on
components of entities.
An example of such a system is
a collision detector, that checks if an entity with a *Collider*
component is about to walk into an entity with a *Solid* component, and stops the
movement from going ahead.
Another example is a system that applies burning effects. Periodically, it loops
through each entity with a *Burning* component and a *Health* component, and reduce
their health by some amount.

This should serve as sufficient background in Entity Component Systems. The
previous paragraph was intentionally vague about the details of how systems
work. Rest assured that a more concrete explanation will follow. To learn more
about ECS:
- Wikipedia has an overview: [Entity component system](https://en.wikipedia.org/wiki/Entity_component_system)
- More detailed description and comparison to OOP:
[Understanding
Component-Entity-Systems](http://www.gamedev.net/page/resources/_/technical/game-programming/understanding-component-entity-systems-r3013)
- Another index of references from roguebasin:
[Entity Component System](http://www.roguebasin.com/index.php?title=Entity_Component_System)

## Actions
So far I've explained how wold state is represented - as a
collection of entities made up of components. What's missing from the picture is
how the world state gets updated. This engine is specifically designed for
turn-based games, so the world is updated in discrete, sequential steps.
This is where **actions** come in: an action
is a description of a change in the world state.
More concretely, actions can:
- change the parameters of components (of entities)
- add/remove components to/from entities

The only way the world state can change is by an action being committed.

## Systems

There are several different types of systems for encoding different types of
rule:
- Reactive Systems respond to actions
- Continuous Systems run periodically to simulate continuous processes
- Passive Systems don't affect the world state, but may update other parts of
  the game (e.g. a renderer). The don't encode game rules, but rather behaviour
  of the game itself. As they aren't particularly interesting in the context of
  this post, this is the last I will say about them.

### Reactive Systems
Systems can register an interest in certain
types of actions.
When an action is proposed, interested systems can examine it,
and possibly cause additional actions to occur in response, or cancel the current action.
If after all interested systems have had the chance to respond to an action, the
action hasn't been cancelled, the action is committed, and the change it
describes actually occurs. If during this process, a system
caused additional actions to be scheduled, these actions go through
the same process.

As an example, consider a *Walk* action. When the action is proposed (by a
character's AI or the player), it contains information about
how the walk will occur, such as the start coordinate, the destination
coordinate, the direction and the entity (character) who is walking. The
*Collision* system has registered an interest in *Walk* actions. When it sees one,
it checks to see if the entity who is walking has the *Collider* component
(indicating it's not, say, a ghost who can walk through walls), and if the
destination coordinate contains any entity with the *Solid* component. If these
conditions are met, the *Collision* system cancels the *Walk* action.

If an action is canceled, it is still presented to all other
interested systems. Systems have the ability to check if an action has been
cancelled, so if multiple systems conflict, this can be resolved in
the systems themselves, and by the game designer specifying the order in which
systems run. Consider a *SpiderWeb* system, that when presented with a *Walk*
action where the walker is stuck in a spider web (which can be represented by their
entity having a *StuckInWeb* component), the walk is cancelled and another
action is scheduled that breaks the spider web. If a character who is stuck in
a web walks into a wall, the first system to run out of the *StuckInWeb* system
and the *Collision* system will cancel the action. It wouldn't make much sense to
have the player struggle in the web, not moving, but then to also bump into a
wall. The decision of what should happen in this situation is up to the game
designer, and they are free to order systems as they please, and to check if an
action is cancelled before processing it.

### Continuous Systems
Continuous systems simulate continuous processes, such as recovering health over
time.
At the end of each turn, all continuous systems are invoked with the amount of
time that has passed since they were last invoked. This information, coupled
with a rate of change, can be used to change values in away that
appears continuous.

What actually happens when a continuous system runs is up to the implementation.
Typically, it will iterate over all entities with some component, and schedule
an action for the entity based on a rate of change specified by the component,
and the time delta since the last time the system ran.

Consider a mechanic where characters that are on fire take a certain amount of
damage each second. An *OnFire* component could be used to signify that an
entity is on fire. It could be parameterized with a *rate*, indicating the
damage taken per second. A *Burning* continuous system would iterate over all
the entities with an *OnFire* component, and for each entity, schedule an action
where the entity takes `timeDelta * damageRate` damage.

## Schedule and Game Loop
The engine uses a schedule to keep track of the order of turns.
Tasks can be added to the schedule, along with a relative time at which
they should occur. The schedule can be queried for the next task. It keeps track
of the current absolute time, which increases as tasks are retrieved from the
schedule.
The game loop is based solely on the schedule, and isn't
particularly interesting:

```
while the game is not over {
    get next task from schedule;
    do task;
}
```

More interesting, is the contents of tasks that are scheduled.
The engine schedules two types of tasks: turns and immediate actions.

### Turn
During a turn, an entity produces a Turn object, consisting of:
- action: an action to perform
- time: the time this action will take
- reschedule: whether the entity should be rescheduled on the current schedule

Entities that can take turns have the *TurnTaker* component. This component
contains a function that returns a Turn object describing what the entity does
on its turn.
For NPCs, this function constructs a turn based on the behaviour of the entity.
For the player character, it returns a turn based on the player's
input.

A turn progresses as follows:
```
takeTurn(entity) {

    turn = entity.getComponent(TurnTaker).takeTurn();

    for each reactive system {
        run the system on turn.action;
    }

    if turn.action has not been cancelled {
        turn.action.commit();
    }

    if turn.reschedule {
        schedule turn for entity in turn.time;
    }

    for each continuous system {
        timeDelta = schedule.getTimeDelta();
        run the system with timeDelta;
    }
}
```

### Immediate Actions
If during a turn, a character's action caused additional actions to be
scheduled, they must be processed before the next character's turn. A naive way
to implement this would be to schedule the actions at the current time. This
won't necessarily work, as it's possible that the next character's turn is also
scheduled for the current time. The schedule breaks ties by choosing the first
task to be scheduled out of all those with equal times, so this will result in
these actions being processed after the next character's turn.

Scheduling actions with negative relative times would result in them being
retrieved from the schedule before anything else. This would lead to further
complications, as the absolute time tracked by the schedule would appear to be
going in reverse.

The solution I implemented was to add an `immediate` flag to scheduler tasks.
Tasks with this flag set to true will be scheduled before tasks with it set to
false, regardless of their scheduled times. To prevent complications with
tracking absolute time, the schedule ignores immediate tasks when updating
the absolute time. The scheduled times of immediate tasks is used solely to
specify the order in which tasks will be retrieved from the scheduler.

An immediate action is a task that applies an action, after passing it to each
reactive system.

## Optimizations
In order to write efficient systems, it's important to consider how entities and
components are stored.

### Entity Implementation
An entity consists of an array with one element for each type of component in the
game. Each component type is assigned a unique identifier (an integer) which is
used as an index into this array. Each element of the array corresponds to a
particular type of component. To add a component to an entity, a reference to
the component is placed in the array element corresponding to the component's
type. To remove a component, the element is set to null.
This allows components of entities
to be retrieved in constant time. A limitation of this representation of
entities is that each entity can have at most one of each type of component.

### Spacial Hashing on Position
As with all information, an entity's position is just another component. For
games that take place within a 2D grid, the *Position* component is
parameterized by an (x, y) coordinate. As it is a common operation to check what
is at a particular position within the world, storing all entities that have a
*Position* component in a spacial hash table, keyed by their position, is a useful
optimization.

Each cell of the spacial hash table is a set of entities. A common operation performed
by systems is checking if any entity at a given coordinate has a certain
component. For example, when checking for collisions, it doesn't matter which entity at the
destination coordinate is solid, as long as at least one is solid. To prevent having
to loop over a cell's contents to search for a given component, each cell in the
spacial hash table maintains a count of which components are there. When an
entity enters or leaves the cell, the count for each component is updated based
on that entity's components.

Components can be added and removed from entities, and entities can be added and
removed from the game. Additionally, entities can move around. All these
operations need to be dealt with to keep the spacial hash up to date.

Each component is given `onAdd` and `onRemove` methods, which are called when
the component is added to and removed from an entity respectively. By default,
these are used to maintain in each component, a reference to the entity it is
currently a part of. These methods can be extended for the *Position* component to add
or remove the entity possessing the component from its current cell in the
spacial hash table.

If an entity is removed from the game, the `onRemove` method of each of
its components is called. If an entity that isn't currently part of the game has
a component added to it, the call to `onAdd` is deferred to when the entity is
added to the game, at which point the `onAdd` method of each component is
called.

The coordinates stored in a *Position* component are updated by a method call,
rather than setting properties
of the component directly. This method takes care of removing the entity from its
previous cell in the spacial hash table, and inserting it into its new cell.

### Continuous System Storage
To optimize continuous systems, a set of entities each system is currently
interested in is maintained. For each continuous system, there is a component
such that the system is interested in an entity if and only if it has that
component. The adding and removing of entities from a system's set of interested
entities is done by the component's `onAdd` and `onRemove` method.

## Conclusion
Everything in the game is an entity, and an entity
is just a collection of components. Everything that happens in the game is an
action. Reactive systems react to actions by scheduling more actions, and
continuous systems schedule actions that simulate continuous processes.
These abstractions are expressive enough to encode complex game rules, and can
be implemented efficiently.

An implementation of all the abstractions described in this post can be found in
the [source code of Glacial](https://github.com/stevebob/glacial).
