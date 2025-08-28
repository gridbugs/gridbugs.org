+++
title = "Porting Alice to Windows"
date = 2025-08-28
path = "porting-alice-to-windows"

[taxonomies]
tags = ["ocaml", "windows", "alice"]

[extra]
og_image = "bliss.jpg"
+++

[Alice](https://github.com/alicecaml/alice) is my toy OCaml build system
project where I ask "What if [Cargo](https://doc.rust-lang.org/stable/cargo/)
but for OCaml?". My main priority when designing Alice is accessibility but
perhaps a more suitable term would be _inclusivity_ as my goal is for the tool
to be usable by as many people as possible. Alice is still in its infancy and is
currently used by _nobody_ but if the day comes when it becomes a viable tool
for building OCaml software I would hate to systematically exclude a potential
    user base because of baked-in assumptions made early in its design.

I do most of my development on Linux and macOS which means I'm likely to
make design decisions favouring those systems, possibly at the expense of
potential users on other systems. In particular, because Windows differs so much
from other popular OSes due to it not being Unix-based, there's a significant
risk of excluding Windows users if I don't make a conscious effort to support
them.

Like most people who grew up in the 2000s or later I was introduced to
computing on home and school computers running Windows (Windows 98 in my case!).
I started playing with Linux in 2009 and it gradually became my daily driver
but it took a huge amount of free time messing around with different distros and
learning the tools and conventions to get to my level of comfort. I'm also
fortunate enough to have the means to afford a Mac. But people who learnt
Windows first and lack the time, money, or inclination to switch to a
Unix-based OS will remain Windows users. So when Windows users are excluded from
a tool, who is _really_ being excluded?

Today I'm going to port Alice to Windows.

To prepare for this work I've compiled a relocatable OCaml compiler toolchain for
Windows. Opam does work
[perfectly fine](@/blog/sound-on-ocaml-on-windows/index.md#trying-again-with-msys2)
on Windows but one cool feature of Alice is that it can download pre-compiled
development tools for you. Alice can't build itself (yet!) but I still want to
eat my own dogfood when I can, and so I want to test out the prebuilt toolchain
while developing Alice. I haven't updated Alice to be able to install the
dev tools prebuilt for Windows yet, but I have a handy
[shell script](https://github.com/alicecaml/alice/blob/main/boot/x86_64-windows.sh)
that sets up a development environment for working on Alice using the same tools
as Alice would install if it was already built. Classic bootstrapping problem.

I'm using powershell and I have [msys2](https://www.msys2.org/) installed so
some commands will look very Unix-y. Alice itself will work fine on Windows once
ported but I barely know what I'm doing in powershell so I'll stick to what I
know (ie. Unix commands from msys2) while setting up my environment!

This command installed a prebuilt compiler toolchain to `D:\alice\current`:
```
PS D:\src\alice> sh boot\x86_64-windows.sh D:\alice
```

The result:
```
PS D:\src\alice> ls D:\alice\current\bin\


    Directory: D:\alice\current\bin


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----        2025-08-28     02:07         451937 flexlink.byte.exe
-a----        2025-08-28     02:08        4706378 flexlink.exe
-a----        2025-08-28     02:08        4706378 flexlink.opt.exe
-a----        2025-08-28     02:08       24365426 ocaml.exe
-a----        2025-08-28     02:08        3394118 ocamlc.byte.exe
-a----        2025-08-28     02:08       13950043 ocamlc.exe
-a----        2025-08-28     02:08       13950043 ocamlc.opt.exe
...
```

In addition to the compiler, this command installed `ocamlformat` and `ocamllsp`,
which I also pre-compiled for Windows in preparation for this work.

```
PS D:\src\alice> Get-Command ocamlformat

CommandType     Name               Version    Source
-----------     ----               -------    ------
Application     ocamlformat.exe    0.0.0.0    D:\alice\current\bin\ocamlformat.exe


PS D:\src\alice> Get-Command ocamllsp

CommandType     Name               Version    Source
-----------     ----               -------    ------
Application     ocamllsp.exe       0.0.0.0    D:\alice\current\bin\ocamllsp.exe
```

The other development tool I'll need is `dune`. Alice uses Dune's relatively new
package-management features and these have not yet been ported to Windows so
I've needed to hack Dune a little bit to make it work here. I already did this
work while building `ocamlformat` and `ocamllsp` with Dune package management on
Windows. Most hacks were to those projects' lockfiles rather than to Dune itself.
I kept a
[log](https://github.com/alicecaml/alice/blob/1c934ce6eb096130659268e913e4da54b7b2853c/tool-build-scripts/5.3.1/windows-notes.md)
of everything I needed to change. I may be referring to it in order to get Alice
to build with Dune on Windows.

I built Dune from source on Windows using opam while building `ocamlformat` and
`ocamllsp` and that's the Dune executable I'll be using for today's work on
Alice.

Ok so I have all the tools I need, let's see if Alice builds on Windows:
```
PS D:\src\alice> dune build
File "dune.lock/lock.dune", lines 18-29, characters 1-288:
18 |  ((arch x86_64)
19 |   (os linux)
20 |   (sys-ocaml-version 5.3.1+relocatable))
....
27 |  ((arch arm64)
28 |   (os macos)
29 |   (sys-ocaml-version 5.3.1+relocatable)))
Error: The lockdir does not contain a solution compatible with the current
platfort.
The current platform is:
- arch = x86_64
- os = win32
- os-distribution = win32
- os-family = windows
- os-version = 10.0.22621
- sys-ocaml-version = 5.3.1+relocatable
Hint: Try adding the following to dune-workspace:
Hint: (lock_dir (solve_for_platforms ((arch x86_64) (os win32))))
Hint: ...and then rerun 'dune pkg lock'
```

I've seen this error before while building `ocamlformat`. Alice has its own
little opam repository which allows it to use the pre-compiled OCaml toolchain.
The pre-compiled OCaml toolchain has a version which is not released on the main
opam repository which means the `ocaml-system` package can't be used, so I
needed to make new version of `ocaml-system` matching the version of the
pre-compiled toolchain (`5.3.1+relocatable`). My version of the `ocaml-system`
package originally had some logic preventing its installation on Windows (copied
from the upstream `ocaml-system` package), but that logic turned out to be
unnecessary for my use case so I just
[deleted it](https://github.com/alicecaml/alice-opam-repo/commit/781db10863f3b7a3507842e88d0d3beeebd264ad).
However I did so recently and that change hasn't made its way into Alice yet.
Making that change to Alice was
straightforward:

```patch
diff --git a/dune-workspace b/dune-workspace
index bc77561..8d8b9db 100644
--- a/dune-workspace
+++ b/dune-workspace
@@ -7,7 +7,7 @@
 (repository
  (name alice_frozen)
  (url
-  git+https://github.com/alicecaml/alice-opam-repo#9957c6334ca7ea18a973ea2fa9e3e56ab9c85eeb))
+  git+https://github.com/alicecaml/alice-opam-repo#781db10863f3b7a3507842e88d0d3beeebd264ad))

 (repository
  (name upstream_frozen)
diff --git a/dune.lock/lock.dune b/dune.lock/lock.dune
index 5ef36e2..fdc34a5 100644
--- a/dune.lock/lock.dune
+++ b/dune.lock/lock.dune
@@ -12,7 +12,7 @@
   ((source
     https://github.com/ocaml-dune/opam-overlays.git#2a9543286ff0e0656058fee5c0da7abc16b8717d))
   ((source
-    https://github.com/alicecaml/alice-opam-repo#9957c6334ca7ea18a973ea2fa9e3e56ab9c85eeb))))
+    https://github.com/alicecaml/alice-opam-repo#781db10863f3b7a3507842e88d0d3beeebd264ad))))

 (solved_for_platforms
  ((arch x86_64)
@@ -26,4 +26,10 @@
   (sys-ocaml-version 5.3.1+relocatable))
  ((arch arm64)
   (os macos)
+  (sys-ocaml-version 5.3.1+relocatable))
+ ((arch x86_64)
+  (os win32)
+  (sys-ocaml-version 5.3.1+relocatable))
+ ((arch arm64)
+  (os win32)
   (sys-ocaml-version 5.3.1+relocatable)))
```

Trying to build again:
```
PS D:\src\alice> dune build
    Building ocaml-system.5.3.1+relocatable
    Building ocaml-config.3
    Building ocaml.5.3.1+relocatable
 Downloading xdg.3.19.1
    Building xdg.3.19.1
    Building base-unix.base
Shared cache miss [bc92329a7327ee6a16f45fa75edf32e5] (_build/_fetch/checksum/md5=a460f01d409d51b7d537429881bfa276/dir): error: Unix.Unix_error(Unix.EXDEV, "link", "_build/_fetch/checksum/md5=a460f01d409d51b7d537429881bfa276/dir/.gitignore")
 Downloading ISO8601.0.2.6
    Building ISO8601.0.2.6
 Downloading menhirLib.20240715
 Downloading menhirSdk.20240715
 Downloading menhirCST.20240715
    Building menhirLib.20240715
    Building menhirSdk.20240715
    Building menhirCST.20240715
 Downloading menhir.20240715
    Building menhir.20240715
Shared cache miss [919bb687d0058dc8265afa905483f2bd] (_build/_fetch/checksum/sha256=1d4e9c16ed9e24d46dd757ce94adc7fc8b2068eb5ff7cd2a70fce08135a752ef/dir): error: Unix.Unix_error(Unix.EXDEV, "link", "_build/_fetch/checksum/sha256=1d4e9c16ed9e24d46dd757ce94adc7fc8b2068eb5ff7cd2a70fce08135a752ef/dir/.gitignore")
 Downloading toml.7.1.0
    Building toml.7.1.0
 Downloading stdlib-shims.0.3.0
    Building stdlib-shims.0.3.0
 Downloading sha.1.15.4
    Building sha.1.15.4
    Building seq.base
 Downloading re.1.13.2
    Building re.1.13.2
Shared cache miss [806d141e2f359f01b7662634ccd5886d] (_build/_fetch/checksum/sha256=796d5791e2bf7b3bff200cf5057a7a1878439ebcd74ed0f1088cf86756d52be6/dir): error: Unix.Unix_error(Unix.EXDEV, "link", "_build/_fetch/checksum/sha256=796d5791e2bf7b3bff200cf5057a7a1878439ebcd74ed0f1088cf86756d52be6/dir/.gitignore")
 Downloading fileutils.0.6.6
    Building fileutils.0.6.6
 Downloading ordering.3.19.1
 Downloading pp.2.0.0
    Building pp.2.0.0
    Building ordering.3.19.1
 Downloading dyn.3.19.1
    Building dyn.3.19.1
 Downloading climate.0.8.0
    Building climate.0.8.0
```

That worked!

I thought I might have to apply some of the hacks I wrote about while getting
`ocamlformat` and `ocamllsp` to build
([here](https://github.com/alicecaml/alice/blob/1c934ce6eb096130659268e913e4da54b7b2853c/tool-build-scripts/5.3.1/windows-notes.md))
but fortunately not. Most of those problems come from the dependency on packages
that don't use Dune as their build system, and I've avoided such packages in
Alice.

The `Shared cache miss` errors are benign, and I think related to
the fact that my user account in on a different partition to the project I'm
building, though it's odd that it doesn't happen for all the dependencies.

```
PS D:\src\alice> ls .\_build\default\alice\src\alice.exe


    Directory: D:\src\alice\_build\default\alice\src


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-ar---        2025-08-28     02:51        7180768 alice.exe


PS D:\src\alice> ls .\_build\install\default\bin\


    Directory: D:\src\alice\_build\install\default\bin


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-ar---        2025-08-28     02:51        7180768 alice.exe
-ar---        2025-08-28     02:51        4825269 alice_demo.exe
```

One difference I observe between building Alice on Windows verses Unix-based
OSes is that on Windows it's very slow to compile. It took over 7 minutes.
One possibility is that I'm building Alice from a spinning disk drive. I use
this same computer for most of my OCaml development but usually booted into
Linux and I don't remember if I use an SSD or spinning disk for that work but
I've never run into this type of performance issue there.

The `Shared cache miss` errors suggest something is going wrong accessing Dune's
cache, and I see that rebuilding the project causes dependencies to be
downloaded again which also suggests a cache problem. As an experiment I deleted
the Dune cache from my Mac (a 2020 Macbook Air) and rebuilt Alice there, and from a
cold cache it took about a minute compared to 10 seconds building from scratch
on my Mac from a warm cache, so the caching issue likely has a big impact but
it's clearly not the full story.

I tried copying the project into my user account which _is_ on an SSD, and the
same partition as Dune's cache. Rebuilding from a clean project with a cold
cache took almost 9 minutes this time but there were no cache errors. I think
this rules out the explanation that my spinning disk is the problem. Rebuilding
from a clean project a second time still caused the dependencies to be
re-downloaded so I'm not sure if the cache is even enabled (but then why the
cache errors when I was on a different drive?).

Anyway incremental builds don't suffer the same performance issues so I'll move
on for now. The goal of this project isn't to debug Dune performance issues with
package management on Windows.

Now that I have Alice building on Windows the next step is to make sure
`ocamlformat` and `ocamllsp` work and integrate into my editor. I built binary
versions of these tools for Windows in preparation for today's work but I didn't
test them yet. Here goes.

I'm going to be using Neovim with the same
[configuration](https://github.com/gridbugs/dotfiles/tree/main/nvim) as I use
for development on Linux and macOS. It starts an `ocamllsp` server upon opening
an OCaml source file and autoformats the code with `ocamlformat` whenever I
save an OCaml source file.

Both of these tools worked flawlessly on the first try.

The next step is to add Windows support to the `alice tools get` command which
downloads the OCaml development tools for the current platform. Alice currently
has no concept of Windows at all, and running that command on my machine prints
`Unknown system: MSYS_NT-10.0-22631`.

When Alice installs tools it creates a "root" which is a directory resembling a
typical Unix filesystem root, with subdirectories like `bin` and `share`. This
lets it include things like manual pages when installing tools. Over time I
expect multiple different versions of the compiler to be supported (though
currently `5.3.1+relocatable` is the only one). Similar to `rustup` I want to
make it possible to change the global root that is considered "active" by
running a command `alice tools change`. This creates a symlink in at
`~/.alice/current` pointing to (say) `~/.alice/roots/5.3.1+relocatable`.

The problem on Windows is that creating a symlink requires admin permissions.
