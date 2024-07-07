+++
title = "Tmux runs a login shell by default"
date = 2020-11-07
slug = "tmux-runs-a-login-shell-by-default"
+++

Unless configured otherwise, shells running in tmux panes are login shells.
This means that if you start tmux from a shell whose environment already reflects
your (say) .profile script, you'll end up sourcing it a second time leading to
problems highlighted [here](@/daily/make-sure-your-terminal-emulator-runs-in-the-expected-environment/index.md).

To have tmux run a non-login shell, add this to .tmux.conf:
```
set -g default-command "${SHELL}"
```
