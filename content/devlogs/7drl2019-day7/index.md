+++
title = "7 Day Roguelike 2019: Content, Plot, Polish, Publish"
date = 2019-03-09T23:00:00+10:00
path = "7drl2019-day7"

[taxonomies]
+++

I spent all of Saturday adding content, fixing bugs, play-testing, and balancing gameplay.

There are now roughly 20 different cards and 3 different level generators.
I added a win condition, a little flavour text, and organised the game into a sequence
of 6 procedurally-generated levels, each configured to be more difficult than the last.

Then I spent about 4 hours play-testing and tweaking.

![glow.png](glow.png)

<!-- more -->

The first gameplay issue I addressed was the player would spend most of their time
being chased by a crowd of enemies. Most of the cards do not directly
deal damage to enemies. While the player could semi-successfully
evade enemies, they tend to all group together into giant mob which often
would eventually overwhelm the player.

![ruins.png](ruins.png)

My initial solution was to add the "Caltrop" and "Deposit" cards, which move the player,
and place a temporary spike trap and wall respectively, in their previous position.
This helps prevent the situation where an enemy is following right behind the player,
with no way to create distance.

This helped, deal with enemies staying right on the player's tail, but the greater
problem of the mob of enemies forming persisted. Taking a more direct approach,
I enabled bump-combat, which previously had just been for enemies.
"Bump Combat" means that walking into an enemy deals them some damage.
This meant
the player could deal significantly more damage, which successfully quelled the
tide of NPCs. I also added health pickups to give the player another slight edge.

![first-death.png](first-death.png)

Adding bump combat came with new problems however!
Enemies telegraph their next move before the player takes their turn.
Playing the game with bump combat on, I found myself waiting for the enemy
to move 1 space away from the player, then bumping them. The problem with this
is that if an enemy has 1 hit point left, and each bump deals a single point
of damage, you can always kill the enemy without losing hit points yourself.

Many games address this problem by adding randomness to the combat system.
I probably would have done this if I noticed the problem at the start of the
week! Instead, I elected to just get rid of the wait command, and gave
all enemies at least 2 hit points. Now, enemies only
move when you move or play a card. If you're in the correct "phase" with
respect to a particular enemy, you can coax them into moving next to you
and deliver a risk-free hit. I like this because if you're out of phase with an enemy, and want a risk-free
hit, you can play a card just to get the enemy to move towards you, changing you into the right phase.
This makes the intentionally useless cards a little useful, but they still cost power to play so I don't
think it's too broken.

![start.png](start.png)

Removing waiting caused yet another problem. Some cards let you place temporary walls, which
block movement of the player and enemies. The walls vanish 8 turns after summoning.
If you surround yourself with walls, you might not be able to take 8 actions to progress time
until the walls come down. I discovered this by accidentally soft-locking the game, surrounded
by walls with no cards in my hand.

The quick-fix I went for is progressing time when the player walks into a temporary wall.

![trapped.png](trapped.png)

I'll post a landing page for Get Well Soon tomorrow, along with a recap of how I think the week went.

## Wishlist

- My animation system can't display concurrent animations. The "Blast" ability
  was originally supposed to shoot a spark in each direction at the same time,
  but instead each spark starts after the previous one stops. The effect ended
  up looking kinda neat, so I didn't fix it. Still, it would be nice to have the
  option for concurrent animation going forward.
- Complex cards requiring multiple animations are difficult to express.
  It should be easier to compose multiple animations to form new animations.
- Direction iterators (from my [direction](https://github.com/gridbugs/direction)
  library) should be reversible.
