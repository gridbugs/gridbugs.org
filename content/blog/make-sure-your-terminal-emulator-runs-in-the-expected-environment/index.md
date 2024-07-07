+++
title = "Make sure your terminal emulator runs in the expected environment"
date = 2020-11-04
path = "make-sure-your-terminal-emulator-runs-in-the-expected-environment"

[taxonomies]
tags = ["unix"]
+++

This is a follow-up to [Why you need a .bashrc and .profile](@/blog/why-you-need-a-.bashrc-and-.profile/index.md)

Unix processes run in an environment consisting of string values assigned to named environment variables.
Some processes such as a shell or window manager are responsible for launching additional processes.
By convention, new processes inherit the environment variables of the process that created them.

<!-- more -->

`$PATH` is a particularly interesting variable because it's usually updated by concatenating a list of directories
with the original value of `$PATH`. A conventional place to update `$PATH` is a "profile" script (usually .profile or
.bash_profile), which is run when a login shell starts.
Avoid sourcing this script multiple times, as the `$PATH` variable will grow larger and larger, as more (duplicate) values are concatenated onto it.
As long as a login shell is run once when you log in to your machine, and all other processes
(including other shells) are descendants of the login shell, your `$PATH` will remain what it was set to when the login shell started.

Here's my `$PATH`:
```
+steve@fontaine ~ $ echo $PATH
/home/steve/.cargo/bin:/home/steve/bin:/home/steve/.bin:/home/steve/.local/bin:/home/steve/.local/sbin:
/sbin:/bin:/usr/sbin:/usr/bin:/usr/local/sbin:/usr/local/bin:/home/steve/bin:/home/steve/.rvm/bin
```

Run `bash` to start a new shell as a child of the current shell:
```
+steve@fontaine ~ $ bash
+steve@fontaine ~ $ echo $PATH
/home/steve/.cargo/bin:/home/steve/bin:/home/steve/.bin:/home/steve/.local/bin:/home/steve/.local/sbin:
/sbin:/bin:/usr/sbin:/usr/bin:/usr/local/sbin:/usr/local/bin:/home/steve/bin:/home/steve/.rvm/bin
```
Note that the `$PATH` wasn't affected. My .profile script didn't run.

Now run `bash --login` which starts a new login shell as a child of the current shell:
```
+steve@fontaine ~ $ bash --login
+steve@fontaine ~ $ echo $PATH
/home/steve/.cargo/bin:/home/steve/bin:/home/steve/.bin:/home/steve/.local/bin:/home/steve/.local/sbin:
/home/steve/.cargo/bin:/home/steve/bin:/home/steve/.bin:/home/steve/.local/bin:/home/steve/.local/sbin:
/sbin:/bin:/usr/sbin:/usr/bin:/usr/local/sbin:/usr/local/bin:/home/steve/bin:/home/steve/.rvm/bin:/home/steve/.rvm/bin
```
This time my `$PATH` got longer, as all the directories I add when a login shell starts got added _again_.

This scenario was contrived, but similar problems can arise in practice, in particular through the use of a window manager (WM).

How do you launch your window manager? The two common ways are running `startx` from a tty, and logging in via a display manager, which
presents a graphical login form and then starts your window manager after login. Much like a text shell (such as bash), your window manager
creates new processes. `$PATH` is of particular relevance to terminal emulators, so let's only consider terminal emulators and the shells that run
"inside" them. Whether you're double-clicking on an icon, using a launcher like dmenu, or have configured your window manager to directly launch
a terminal emulator in response to a key combination, the windows manager is starting your terminal emulator, which in turn is starting a shell.

Whenever you start a shell, your goal is to have your `$PATH` be set to whatever your .profile script specifies.
Something is amiss if `$PATH` has the settings in .profile applied multiple times (as in the example above), or not at all in which case
none of your custom executable directories will work.

If you start your WM with `startx`, then you must have logged into a tty directly
which will have started a login shell. Running `startx` from a login shell will result in your intended `$PATH` being part of your WM's
environment (WMs are unix processes too; they have environments), and when your WM launched a shell (via a terminal emulator)
the shell inherited the correct `$PATH` too and you're done.

If you use a display manager to login, somehow by the time you launch a shell, you're .profile script needs to have been invoked _exactly once_ (so your `$PATH`
is set the way you like). This can be done from within the WM itself. Most terminal emulators take a flag which instructs them to launch a login
shell rather than a regular shell. Have your WM pass this flag when launching a terminal. If you were to start a second terminal from the first
(e.g. tmux), it would just launch a regular (non-login) shell, so the duplicate `$PATH` problem is avoided. The only gotcha here is if you ever
start the WM with startx and not a display manager, WM-spawned terminal emulators will have sourced your .profile script twice
(once from the login shell you got when logging in to a tty, and a second time as you instructed your WM to launch a terminal emulator with a login shell inside).
A less fragile approach is to configure the display manager to setup your environment before launching the WM, however unfortunately not all display managers can
be thus configured.
