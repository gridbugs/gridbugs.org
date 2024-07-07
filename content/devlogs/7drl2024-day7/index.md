+++
title = "7 Day Roguelike 2024: Shops, Organs, Environment Effects, Boss"
date = 2024-03-09
path = "7drl2024-day7"

[taxonomies]

[extra]
og_image = "screenshot1.png"
+++

It's the end of day 7 and my game is complete. I stayed up all night finishing
it and managed to complete all the features and content I intended and still
had a few hours for delirious  playtesting and bugfixing. This was by far the
largest scope for any 7DRL I've done in the past in terms of features as well
as content. This game has procedurally-generated music and sound effects, 10
types of enemy each with their own unique abilities (not including
shopkeepers), 14 items, an equipment system that allows dual-wielding
one-handed weapons, accounts for two-handed weapons, and allows each hand to
turn into claws that can't hold weapons (e.g. you can have one claw and still
hold a one-handed weapon in the other hand), a system for determining the
player's stats based on which organs they currently have, a system for a
applying mutations to organs if you absorb too much radiation, realtime
particle effects for smoke and explosions, a dynamic diminishing lighting
system and a secret ending (shhhh!). All the items have descriptions that render in the
UI, and there are many different types of message that can appear in the game's
message log about events that happen in the game.

![Fighting the final boss on the bottom level of the city](screenshot1.png)

<!-- more -->

The most complex addition of the night was shops. In particular the Organ
Clinic which allows you to buy organs and have them installed in your body,
remove organs for a fee (except your starting organs which you can sell to the
clinic (except for your appendix) - don't sell your only heart or you will
die). It also has an option for installing the organs you are carrying around
in organ contains - either that you found in the dungeon or removed from
corpses. Keeping track of several layers of nested menus is not something my
engine was designed to handle so it got a bit tedious.

![Message log death screen after the player attacked a vendor who then turned hostile and killed them](screenshot5.png)

I also implemented the status effects of each organ, and the affect that mutation
have on each organ. This got a bit tedious as some organs are
passive - they just determine a stat, such as the number of hearts you have
determining your max health (though cybernetic hearts, regular hearts, and
damaged hearts all count for different amounts - also a heart can be both
cybernetic _and_ damaged). But other organs grant abilities, like the
Cronenberg guns that allow you to fire guns attached to your body using your
health as their ammo. These are handled in a totally different part of the code
to the passive organs, and these organs also need to be treated differently if
they are cybernetic or damaged (or both). 

![List of organs to buy from the Organ Clinic](screenshot2.png)

I implemented environmental effects. If you stand in poison your poison goes
up. It's reduced periodically by a rate determined by the quantity and quality
of your livers. If your poison meter fills up then it resets and a random organ is damaged
unless all your organs are damaged in which case a random organ is destroyed.
Hopefully it's not your only heart or you will die.

If you have line of sight to a radiation emitter and you are within a certain
range then you gain radiation. Also sometimes you just randomly gain radiation.
If your radiation meter fills then it resets and a random organ gains or loses
a random mutation. One such mutation is "radioactive". If one of your organs is
radioactive, you gain radiation over time while it's in your body.

Finally there is smoke, which works similarly to radiation in that it requires
line of sight to a smoke emitter and has limited range. Standing near a smoke
emitter causes your oxygen stat to go down, and if it's empty then your health
stat will start going down instead. Having more lungs is a good way to prevent
death from breathing in too much smoke.

![In a smoke-filled street, the player is aiming a pistol at a Venter enemy.](screenshot3.png)

Finally I added a boss fight at the bottom level of the city. The boss has
several abilities taken from other enemies (it spreads poison, it emits smoke
and radiation) and it also teleports when its health cross the 2/3 and 1/3
thresholds of its max health to prevent the player from shooting it several
times point blank with a shotgun. This forces you to explore the level looking
for it several times and hopefully having more interesting encounters with
other enemies along the way. You win the game by killing the boss and then
making it back to your starting square (the "Evac Zone").

Electric Organ can be downloaded or played in a web browser from its [itch.io
page](https://gridbugs.itch.io/electric-organ) .
