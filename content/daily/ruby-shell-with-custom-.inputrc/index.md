+++
title = "Ruby shell with custom .inputrc"
date = 2020-11-08
slug = "ruby-shell-with-custom-.inputrc"
+++

The program `irb` is an interactive ruby shell.
When I run it, the VI navigation keys "HJKL" move the cursor rather than inserting the characters "HJKL".
This looks related to my custom ~/.inputrc file which specifies readline use the VI keybindings, instead of
the default emacs keybindings:
```
# ~/.inputrc
...
set editing-mode vi
...
```

In certain interactive shells (those that use readline), such as bash and the python shell, this adds
modal line editing and VI key navigation that I'm accustomed to in Vim.
But it seems that `irb` doesn't work correctly with VI editing mode.
It's trying to do _something_. Switching from insert to normal mode works, and I can use additional
VI navigation commands such as work navigation while in normal mode. But "HJKL" navigation doesn't
turn off in insert mode, so I can't type "HJKL".

The workaround is to tell `irb` to ignore ~/.inputrc when launching it:
```
$ INPUTRC=/dev/null irb
```
