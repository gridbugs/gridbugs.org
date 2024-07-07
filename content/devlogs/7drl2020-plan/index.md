+++
title = "7 Day Roguelike 2020: Plan"
date = 2020-02-29T08:00:00+10:00
path = "7drl2020-plan"

[taxonomies]
+++
<style>
.slime99 {
    color: rgb(0,255,255);
    background-color: rgb(255,0,255);
}
</style>

## <span class="slime99">Slime99</span>

In the not-too-distant future,
<span class="slime99">**THE YEAR 1999**</span>
fallout from <span class="slime99">**THE WAR**</span> has caused
<span class="slime99">**RADIOACTIVE MUTANT SLIMES**</span> to appear in the
sewers of <span class="slime99">**THE CITY**</span>. You are a
<span class="slime99">**GENETICALLY-MODIFIED PRECOG SUPER-SOLDIER**</span>, whose free-will was in-part traded for the power
to <span class="slime99">**PREDICT THE OUTCOME OF COMBAT ENCOUNTERS**</span>. Go into the sewers and
<span class="slime99">**ELIMINATE THE SOURCE OF SLIME!**</span>

<!-- more -->

## Mechanics

### Health
Instead of health, there is a linear, visible sequence of the outcome of being attacked. These outcomes happen in order,
but there will be in-game ways to change the order, or add new outcomes. Some possible outcomes:
- death: game over - this will always be the final outcome in the sequence
- dodge: nothing happens
- parry: attacker is pushed back a space
- riposte(n): attacker takes n damage
- cooldown: progress all meta-ability (see below) cooldowns by 1

### Stamina
Similarly, instead of hunger/stamina/etc, there is a sequence of outcomes of melee attacking. Once the sequence is
exhausted, you are "out of stamina" and can no longer attack, so you better be near the stairs!
- miss: nothing happens
- hit(n): deal n damage
- cleave(n): deal n damage to all surrounding enemies
- skewer(n): deal n damage to all adjacent enemies in the direction of the attack
- crit: kill the enemy

### Enemies
All the damage-dealing combat outcomes are parameterised by how much damage they deal.
Different outcomes deal different amounts of damage, and the amount will be visible to the player.
All the enemies are slimes, and for each type of slime, something different will happen if its health
isn't reduced to zero by an attack. Some possibilities:
- split into 2 slimes, each with half of the remaining health after the attack
- swap places with the slime after dealing damage
- shuffle one of the sequences
- teleport to a random location after dealing damage
- health after the attack is abs(health before the attack - attack damage), so you have to get it to exactly zero
- no damage is dealt unless the damage amount is the same as the health amount

### Abilities
Abilities (ie. spells) are also presented in a sequence.
- teleport to random location
- blink to specified nearby location
- repel all nearby enemies away
- attract all nearby enemies closer
- add a miss to the top of the attack sequence
  - the point of this is to force the player to pay a price (ie. missing an attack) to access
    the abilities beneath this one
- add a crit to the top of the attack sequence
- shuffle one of the sequences
- remove the top of the health sequence
- progress cooldowns

### Meta-Abilities
Meta-abilities (this needs a new name!) are not presented in sequence, and affect the
sequences themselves. They can be used in any order, and re-used after a cooldown has expired.
You start the game with a random meta-ability, and can gain new ones. Cooldowns don't progress
by themselves. Certain in-game events progress cooldowns.
- move the top item in a sequence to the end of the sequence
- swap order of first 2 items in a sequence
- shuffle a sequence
- skip the next item in a sequence

### Upgrades
At the end of every floor you gain a meta-ability. Pickups throughout levels will add to the front of sequences
up to some max size. The reasoning behind adding to the front of a sequence is it allows you to pick up an item
and immediately use it, AND improving your character will be more effective if you frequently reduce the size
of sequences to nearly zero, as you'll then be able to replenish the sequence with better items found later
in the game. There will be more than enough items in the dungeon to allow some variety in which items are
added to the sequences, and the only reason to fight slimes is to explore the floor and find the items you
want, and to get to the stairs to the next floor.

## Graphics
Graphics will be text-only, rendered using prototty.
Maps will be 2D grids of squares.
It will be necessary to show how much health each enemy has at all times.
If health is always a single-digit, that digit itself could represent the enemy on the map, and different types
of enemy could be distinguished by colour, but this will make it impossible for colour-blind people to play the game.
Instead I want to try making each cell of the map 2x2 graphical cells. This opens the possibility of having 2 digits
for health, one cell for a letter indicating the type of enemy, and one more cell which I'll need to figure out what
to do with.
