+++
title = "Configuring Feh"
date = 2020-11-10
slug = "configuring-feh"
+++

In lieu of a file listing configuration settings, the image viewer `feh` does something
I've never seen anywhere else. The config file lists "themes", which are named sets of arguments.
You can list as many themes as you like, giving each a unique name.

My list:
```
# ~/.config/feh/themes

fehp --keep-zoom-vp --force-aliasing --draw-filename --draw-tinted
```

I only have one theme named "fehp" (the p stands for "pixelated").
To use the theme, make a symlink to the `feh` executable, and name the symlink after the theme:
```
$ ln -s $(which feh) ~/bin/fehp
```

Now I can run `fehp` and it will be equivalent to running:
```
$ feh --keep-zoom-vp --force-aliasing --draw-filename --draw-tinted
```
