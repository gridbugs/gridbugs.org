+++
title = "Time to start using language managers?"
date = 2020-10-17
slug = "time-to-start-using-language-managers"
+++

A few months ago I [swore off the nodejs and ruby version managers](@/daily/time-to-stop-using-language-managers/index.md),
claiming that the language ports should suffice. This was spurred by a bad experience trying to
build nodejs from source on openbsd, when I spent an evening hacking the nodejs source to get it
to build before it dawned on me that I was repeating the work of the port maintainers.

Tonight I installed the ruby version manager again because the only version of ruby and gem I could
find in the FreeBSD ports collection was 2.6. Ports for later versions of the ruby interpreter exist,
but not the corresponding version of the gem package manager.

Several months ago when I renounced my use of version managers, I was suspicious of RVM in
particular because it was using `sudo` to install dependencies as root by default when installing
rubies. This specific realization lead to me uninstalling `sudo` outright. Frustratingly, there
doesn't seem to be a way to get a list of the dependencies I need so I can install them manually.
No by default I get a fairly unhelpful error when trying to install ruby:
```
$ rvm install ruby-3 --disable-binary
Checking requirements for qR.
Requirements support for qR is not implemented yet,
report a bug here => https://github.com/rvm/rvm/issues
Requirements installation failed with status: 1.
```
(`--disable-binary` forces it to build ruby from source, which is necessary as there are no
binary distributions for FreeBSD.)

Pass `--debug` for extra verbosity:
```
$ rvm install ruby-3 --disable-binary --debug
Warning: No 'sudo' found.
Warning: No 'sudo' found.
ruby-3.0.0-preview1 - install
ruby-3.0.0-preview1 - #already removed src/ruby-3.0.0-preview1
ruby-3.0.0-preview1 - #already removed rubies/ruby-3.0.0-preview1
Free disk space 194019MB, required 440MB.
__rvm_setup_compile_environment_setup ruby-3.0.0-preview1
rvm_autolibs_flag=fail
__rvm_setup_compile_environment_movable_early ruby-3.0.0-preview1
__rvm_setup_compile_environment_system_early ruby-3.0.0-preview1
__rvm_setup_compile_environment_requirements ruby-3.0.0-preview1
Checking requirements for qR.
Requirements support for qR is not implemented yet,
report a bug here => https://github.com/rvm/rvm/issues
Requirements installation failed with status: 1.
__rvm_rm_rf already gone: /home/steve/.rvm/tmp/55505*
```

The lack of `sudo` is mentioned so it may be related to the failure.

Consulting the log message mentioned in the error:
```
...
Downloading bundled gem files...
executable host ruby is required. use --with-baseruby option.
*** Error code 1
```

So we need a native ruby in order to install ruby through RVM.

As root, I ran:
```
# pkg install ruby
```

Then to toll RVM to stop trying to install dependencies, run
```
$ rvm autolibs disable
```

Now run this command again:
```
$ rvm install ruby-3 --disable-binary
```

...and ruby should now be installed!
