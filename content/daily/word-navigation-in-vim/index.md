+++
title = "Word navigation in Vim"
date = 2020-09-06
slug = "word-navigation-in-vim"
+++

Since I'm retraining my hands to type in qwerty rather than dvorak, I figure I'll
use this as a chance to kick some bad habits in Vim - my text editor of choice.
Today's lesson is "word navigation".

Vim gives you several different ways to move the cursor.
Word navigation lets you skip to the start and ends of words.
The relevant keys (in normal mode):
 - `w` moves the cursor to the start of the next word after the cursor
 - `e` moves the cursor to the next word-end after the cursor
 - `b` moves the cursor to the previous word-start before the cursor

The capital-letter versions of these commands do the same thing, except treat
whitespace as the only word separator rather than all punctuation.
