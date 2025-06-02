+++
title = "Sound on OCaml on Windows"
date = 2025-06-02
path = "sound-on-ocaml-on-windows"
description = "I got my OCaml music synthesizer working on Windows. Here's all the things that went wrong in the process."
[taxonomies]
tags = ["windows", "ocaml", "synthesizer", "audio"]

[extra]
og_image = "banner.png"
+++

![Close up of a modular synthesizer](banner.jpg)

This post will chronicle my attempt to use OCaml to play generated audio
samples on a Windows PC. This is part of my work on the [llama synthesizer
library](https://github.com/gridbugs/llama/), where I've been rewriting the
low-level audio logic formerly written in Rust (with
[cpal](https://crates.io/crates/cpal)) into OCaml to simplify the build process
and development experience. I've written down some of my complaints about
the developer experience working on `llama` in a [previous
post](@/blog/frustrating-interactions-with-the-ocaml-ecosystem-while-developing-a-synthesizer-library/index.md)
and some of those difficulties came from complications working with Rust/OCaml
interop, so removing all Rust from the project will help reduce friction
developing it further.

I have a proof-of-concept version of `llama` based on [OCaml's libao
bindings](https://opam.ocaml.org/packages/ao/) which works on Linux and MacOS.
Libao claims to support Windows but I haven't figured out how to install it on
Windows so I might experiment with some easier-to-install alternatives in this post.

The intention of this post is to serve as a guide to anyone getting started with
OCaml on Windows, to highlight some of the remaining problems with the OCaml ecosystem on
Windows, and to demonstrate some usability issues with Opam in general. My summary is that
OCaml on Windows is easier than I expected it to be, but there are still some
rough edges that newcomers should be aware of to properly set expectations. I
wrote down everything I tried as I tried it, so all the mistakes, blind alleys
and failed debugging experiments will be documented here as well as the paths
that eventually led to solutions.

## Install Opam

For the purposes of this post I'll set up an entire OCaml environment on Windows
from scratch. I'll be using PowerShell 7.5.1 for all shell commands in this
post. For the purposes of translating commands and paths to other machines, I'll
state explicitly that my username is "s".

We'll install Opam with WinGet. I've had some difficulty setting up WinGet in
the past and written about setting it up properly in a [previous
post](@/blog/setting-up-winget-for-the-first-time/index.md) but today it worked as expected.

```
PS C:\Users\s> winget install Git.Git OCaml.opam
...
PS C:\Users\s> opam init
...
How should opam obtain Unix tools?
> 1. Automatically create an internal Cygwin installation that will be managed by
     opam (recommended)
  2. Use an existing Cygwin/MSYS2 installation
  3. Abort initialisation

[1/2/3] 1  <-- here I selected option 1
...
```

Allowing Opam to manage its own Cygwin installation is the recommended way of
using Opam on Windows, so that's what I'll try first. This results in Cygwin being
installed to `C:\Users\s\AppData\Local\opam\.cygwin`. This might come in handy
to know if we ever need to manually install a Cygwin package, though hopefully
Opam can take care of installing any such packages via Opam's `depexts` system
which knows how to install system-specific packages needed by Opam packages by
directly invoking the package manager to install the appropriately-named package.

Bear in mind that Opam's initialization can take 15 minutes or so on Windows
with most of the time spent building the OCaml compiler. Compiling OCaml code
on Windows tends to be much slower than on MacOS and Linux. I don't understand
why.


## Install a sound library

We need to choose a library in the Opam repository that can give us access
to the sound card. Ideally we would use a library with a `depext` tailored to
Windows with Cygwin, as that way Opam can take care of installing any system dependencies
via Cygwin. Since my experimental version of `llama` is already implemented with
libao that would be the most convenient choice, however its `depexts` don't look
promising:
```
PS C:\Users\s> opam show conf-ao
...
depexts     ["libao-devel"]
              {os-distribution = "centos" | os-family = "fedora" | os-family = "suse" |
               os-family = "opensuse"}
            ["libao"]
              {os = "freebsd" | os = "macos" & os-distribution = "homebrew" |
               os-distribution = "nixos" |
               os-family = "arch"}
            ["libao-dev"]
              {os-family = "debian" | os-family = "ubuntu" | os-distribution = "alpine"}
```

There are no entries in that list for Windows, so using libao would require
setting it up manually which I'd prefer to avoid.

Another candidate library is
[portaudio](https://opam.ocaml.org/packages/portaudio/).
```
PS C:\Users\s> opam show conf-portaudio
...
depexts     ["portaudio-dev"] {os-distribution = "alpine"}
            ["portaudio-devel"]
              {os-distribution = "centos" | os-distribution = "fedora" |
               os-family = "suse" |
               os-family = "opensuse"}
            ["portaudio"] {os = "macos" & os-distribution = "homebrew"}
            ["portaudio"]
              {os = "freebsd" | os-family = "arch" | os-distribution = "nixos" |
               os-distribution = "ol"}
            ["portaudio"] {os = "win32" & os-distribution = "cygwinports"}
            ["portaudio19-dev"] {os-family = "debian" | os-family = "ubuntu"}
```

That's more promising as there's a `depext` that gets chosen on `{os = "win32" &
os-distribution = "cygwinports"}`. It's a little concerning that the name of the
`os-distribution` is "cygwinports" and not just "cygwin". I've never come across
cygwinports before, but maybe it won't matter. The next step is to see if
installing `conf-portaudio` with Opam causes the right `depext` to be installed
with Cygwin:

```
PS C:\Users\s> opam install conf-portaudio
The following actions will be performed:
=== recompile 1 package
  ↻ mingw-w64-shims 0.2.0 [uses conf-pkg-config]
=== install 2 packages
  ∗ conf-pkg-config 4     [required by conf-portaudio]
  ∗ conf-portaudio  1

Proceed with ↻ 1 recompilation and ∗ 2 installations? [y/n] y

The following system packages will first need to be installed:
    pkgconf

<><> Handling external dependencies <><><><><><><><><><><><><><><><><><><><>  🐫

+ C:\Users\s\AppData\Local\opam\.cygwin\setup-x86_64.exe "--root" "C:\\Users\\s\\AppData\\Local\\opam\\.cygwin\\root" "--quiet-mode" "noinput" "--no-shortcuts" "--no-startmenu" "--no-desktop" "--no-admin" "--no-version-check" "--no-write-registry" "--packages" "pkgconf" "--upgrade-also" "--only-site" "--site" "https://cygwin.mirror.constant.com/" "--local-package-dir" "C:\\Users\\s\\AppData\\Local\\opam\\.cygwin\\cache"
- Starting cygwin install, version 2.934
- User has NO backup/restore rights
- User has NO symlink creation right
- io_stream_cygfile: fopen(/etc/setup/setup.rc) failed 2 No such file or directory
- Current Directory: C:\Users\s\AppData\Local\opam\.cygwin\cache
- root: C:\Users\s\AppData\Local\opam\.cygwin\root user
- Changing gid back to original
- Selected local directory: C:\Users\s\AppData\Local\opam\.cygwin\cache
- net: Preconfig
- site: https://cygwin.mirror.constant.com/
- solving: 1 tasks, update: yes, use test packages: no
- solving: 2 tasks, update: no, use test packages: no
- Augmented Transaction List:
-    0 install libpkgconf6 2.4.3-1
-    1 install pkgconf     2.4.3-1
- Downloaded C:\Users\s\AppData\Local\opam\.cygwin\cache/https%3a%2f%2fcygwin.mirror.constant.com%2f/x86_64/release/pkgconf/libpkgconf6/libpkgconf6-2.4.3-1.tar.zst
- Downloaded C:\Users\s\AppData\Local\opam\.cygwin\cache/https%3a%2f%2fcygwin.mirror.constant.com%2f/x86_64/release/pkgconf/pkgconf-2.4.3-1.tar.zst
- Extracting from file://C:\Users\s\AppData\Local\opam\.cygwin\cache/https%3a%2f%2fcygwin.mirror.constant.com%2f/x86_64/release/pkgconf/libpkgconf6/libpkgconf6-2.4.3-1.tar.zst
- Extracting from file://C:\Users\s\AppData\Local\opam\.cygwin\cache/https%3a%2f%2fcygwin.mirror.constant.com%2f/x86_64/release/pkgconf/pkgconf-2.4.3-1.tar.zst
- running: C:\Users\s\AppData\Local\opam\.cygwin\root\bin\dash.exe "/etc/postinstall/0p_000_autorebase.dash"
- running: C:\Users\s\AppData\Local\opam\.cygwin\root\bin\dash.exe "/etc/postinstall/0p_update-info-dir.dash"
- running: C:\Users\s\AppData\Local\opam\.cygwin\root\bin\dash.exe "/etc/postinstall/zp_man-db-update-index.dash"
- Ending cygwin install

<><> Processing actions <><><><><><><><><><><><><><><><><><><><><><><><><><>  🐫
⬇ retrieved mingw-w64-shims.0.2.0  (cached)
⊘ removed   mingw-w64-shims.0.2.0
∗ installed conf-pkg-config.4

#=== ERROR while compiling conf-portaudio.1 ===================================#
"pkg-config": command not found.


<><> Error report <><><><><><><><><><><><><><><><><><><><><><><><><><><><><>  🐫
┌─ The following actions failed
│ λ build conf-portaudio 1
└─
┌─ The following changes have been performed (the rest was aborted)
│ ⊘ remove  mingw-w64-shims 0.2.0
│ ∗ install conf-pkg-config 4
└─
```

A few things have gone wrong here. Firstly, from:
```
The following system packages will first need to be installed:
    pkgconf
```
...we can see that Opam has detected that some `depexts` need to be installed, but
only `pkgconf` and not `portaudio` are on the list. To help understand why, look
at the `depexts` of the `conf-pkg-config` package:
```
PS C:\Users\s> opam show conf-pkg-config
...
depexts     ["pkg-config"] {os-family = "debian" | os-family = "ubuntu"}
...
            ["system:pkgconf"] {os = "win32" & os-distribution = "cygwinports"}
            ["pkgconf"] {os-distribution = "cygwin"}

```

This package makes an explicit distinction between "cygwinports" and "cygwin" so
it stands to reason that my initial concerns about `os-distribution =
"cygwinports"` were merited.

The second issue is that even though Opam installed `pkgconf` with Cygwin, the
`pkg-config` executable couldn't be found while installing the `conf-portaudio`
package. Remember earlier we located the Cygwin installation that Opam will be
managing? Looking in `C:\Users\s\AppData\Local\opam\.cygwin\root\bin`, there
is a program `pkgconf.exe`, but not a `pkg-config.exe`. At some
point in the past few years `pkg-config` was renamed to `pkgconf` and this change is slowly trickling
into different package managers at different rates.

The first thing to try here is modifying the package metadata for
`conf-portaudio` to use the correct name for `pkgconf`. Start by saving the
existing metadata to a local file which we can then modify:
```
PS C:\Users\s> opam show conf-portaudio --raw > conf-portaudio.opam
```

We should now be able to install the `conf-portaudio` package from this file
rather than using the metadata stored in the Opam repo by running:
```
PS C:\Users\s> opam install .\conf-portaudio.opam
```

This command hung with `Processing 1/1: [conf-portaudio.1: rsync]` so I left it
running while I went to run some errands and when I got back over an hour later
it was still hung.

I cancelled the hung operation. Despite not completing it did have the side
effect of creating an Opam "pin" for the `conf-portaudio` package.
An Opam pin is a configuration to override the source of a package, usually to
allow for local development of said package. We can see all the current Opam
pins with:
```
PS C:\Users\s> opam pin list
conf-portaudio.1  (uninstalled)  rsync  file://C:/Users/s
```

Before proceeding I wanted to remove the pin since something has clearly gone wrong:
```
PS C:\Users\s> opam pin remove conf-portaudio
Cannot remove C:\Users\s\AppData\Local\opam\default\.opam-switch\sources\conf-portaudio\
AppData\Local\Application Data\Application Data\Application Data\Application Data\
Application Data\Application Data\Application Data\Application Data\Application Data\
Temporary Internet Files (C:\Users\s\AppData\Local\Microsoft\WinGet\Packages\
OCaml.opam_Microsoft.Winget.Source_8wekyb3d8bbwe\opam.exe: "unlink" failed on
C:\Users\s\AppData\Local\opam\default\.opam-switch\sources\conf-portaudio\AppData\
Local\Application Data\Application Data\Application Data\Application Data\
Application Data\Application Data\Application Data\Application Data\Application Data\
Temporary Internet Files: No such file or directory).
```

Hmm. The `Application Data\Application Data\Application Data` component of the path looks suspicious.
Opam creates a copy of pinned packages so let's take a look at `conf-portaudio`'s
copy in
`C:\Users\s\AppData\Local\opam\default\.opam-switch\sources\conf-portaudio`:

```
PS C:\Users\s> ls .\AppData\Local\opam\default\.opam-switch\sources\conf-portaudio\

    Directory: C:\Users\s\AppData\Local\opam\default\.opam-switch\sources\conf-portaudio

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d----          04/11/2024    21:49                .bin
d----          04/11/2024    22:26                .cargo
d----          04/11/2024    21:49                .completions
d----          04/11/2024    21:49                .config
d----          22/11/2024    14:34                .dotfiles
d----          04/11/2024    21:49                .emacs.d
d----          25/11/2024    15:12                .local
d----          04/11/2024    21:59                .ms-ad
d----          04/11/2024    22:25                .rustup
d----          04/11/2024    21:29                .ssh
d----          18/11/2024    14:35                .vscode
d----          29/05/2025    16:03                AppData
-a---          28/03/2025    17:00           3654 .bash_history
-a---          25/11/2024    18:07           9168 .bashrc
...
```

Hey, that looks like my home directory! It appears I unwittingly pinned the
`conf-portaudio` package to my entire home directory, and since Opam installs
packages _inside_ my home directory it was recurring forever, continuously
copying my home directory inside itself. No wonder it hung.

Manually fixing the problem:
```
PS C:\Users\s> rm .\AppData\Local\opam\default\.opam-switch\sources\conf-portaudio

Confirm
The item at C:\Users\s\AppData\Local\opam\default\.opam-switch\sources\conf-portaudio has children and the Recurse parameter was not specified. If you continue, all children will be removed with the item. Are you sure you want to continue?
[Y] Yes  [A] Yes to All  [N] No  [L] No to All  [S] Suspend  [?] Help (default is "Y"): A
Removed 32536 of 134845 files [1.197 GB of 15.926 GB (48.6 MB/s)
```

That's almost `16GB` of recursive copies of my home directory! This command
ended up failing due to permission problems so I had to delete it from the
explorer UI instead as I'm not very familiar with file management within
PowerShell.

Now that I manually deleted that folder, removing the pin works:
```
PS C:\Users\s> opam pin remove conf-portaudio
Ok, conf-portaudio is no longer pinned to file://C:/Users/s (version 1)
```

What I've learnt here is that Opam doesn't pin individual files but rather
entire directories. A pin is a mapping from package to directory, and when you
run `opam pin .\foo.opam` Opam learns the package name is `foo` from the name of
the file (I think), but assumes the directory is the directory containing
`foo.opam`. Most Opam package source directories contain an opam file and the
source code for the package. What's unusual in this case is that the
`conf-portaudio` package does not have source code. We say it's a "metapackage"
as installing it just installs its dependencies (including external
dependencies) and runs a command to verify their installation, but it has no
source code of its own. So in order to pin `conf-portaudio` we need to first
create a new directory and move the opam file there.

Pinning the directory is sufficient as Opam will scan the directory for any opam files
and create pins for each corresponding package using the current directory as the source.
I've also modified the opam file to run `pkgconf` rather than `pkg-config`.
```
PS C:\Users\s\conf-portaudio> opam pin .
[NOTE] Package conf-portaudio is already pinned to file://C:/Users/s/conf-portaudio (version 1).
conf-portaudio is now pinned to file://C:/Users/s/conf-portaudio (version 1)

The following actions will be performed:
=== install 1 package
  ∗ conf-portaudio 1 (pinned)

Proceed with ∗ 1 installation? [y/n] n   (don't want to install it just yet)
[NOTE] Pinning command successful, but your installed packages may be out of sync.
```

By default `opam pin` will prompt to install the pinned package in addition to just storing
the package → directory mapping, but I just want to create the mapping for now so I
chose `n` at the prompt. Before installing the package I want to make sure that
pinning it had the desired effect. Ask Opam what it thinks should be the package metadata
for `conf-portaudio` now:

```
PS C:\Users\s\conf-portaudio> opam show conf-portaudio --raw
opam-version: "2.0"
name: "conf-portaudio"
version: "1"
synopsis: "Virtual package relying on portaudio"
description:
  "This package can only install if the portaudio library is installed on the system."
maintainer: "https://github.com/ocaml/opam-repository/issues"
authors: "portaudio dev team"
license: "BSD-1-Clause"
homepage: "http://www.portaudio.com/"
bug-reports: "https://github.com/ocaml/opam-repository/issues"
depends: [
  "conf-pkg-config" {build}
]
flags: conf
build: ["pkgconf" "--exists" "portaudio-2.0"]
depexts: [
  ["portaudio-dev"] {os-distribution = "alpine"}
  ["portaudio-devel"]
    {os-distribution = "centos" | os-family = "fedora" | os-family = "suse" |
     os-family = "opensuse"}
  ["portaudio"] {os = "macos" & os-distribution = "homebrew"}
  ["portaudio"]
    {os = "freebsd" | os-family = "arch" | os-distribution = "nixos" |
     os-distribution = "ol"}
  ["portaudio"] {os = "win32" & os-distribution = "cygwinports"}
  ["portaudio19-dev"] {os-family = "debian" | os-family = "ubuntu"}
]
url {
  src: "file://C:/Users/s/conf-portaudio"
}
```

Note that the `build` command calls `pkgconf` rather than `pkg-config` as it did
previously, indicating that my custom version of `conf-portaudio` is being used.

Now we can try installing it again.
```
PS C:\Users\s\conf-portaudio> opam install conf-portaudio

<><> Synchronising pinned packages ><><><><><><><><><><><><><><><><><><><><>  🐫
[conf-portaudio.1] synchronised (no changes)

The following actions will be performed:
=== install 1 package
  ∗ conf-portaudio 1 (pinned)

<><> Processing actions <><><><><><><><><><><><><><><><><><><><><><><><><><>  🐫
[ERROR] The compilation of conf-portaudio.1 failed at "pkgconf --exists portaudio-2.0".

#=== ERROR while compiling conf-portaudio.1 ===================================#
# context     2.3.0 | win32/x86_64 | ocaml.5.3.0 | pinned(file://C:/Users/s/conf-portaudio)
# path        ~\AppData\Local\opam\default\.opam-switch\build\conf-portaudio.1
# command     ~\AppData\Local\opam\.cygwin\root\bin\pkgconf.exe --exists portaudio-2.0
# exit-code   1
# env-file    ~\AppData\Local\opam\log\conf-portaudio-12212-533065.env
# output-file ~\AppData\Local\opam\log\conf-portaudio-12212-533065.out



<><> Error report <><><><><><><><><><><><><><><><><><><><><><><><><><><><><>  🐫
┌─ The following actions failed
│ λ build conf-portaudio 1
└─
╶─ No changes have been performed
```

That's progress! There's now an error message indicating that `pkgconf --exists
portaudio-2.0` failed, which is expected because the `conf-portaudio` package's
`depexts` don't contain a case for `os-distribution = "cygwin"` (only `os-distribution = "cygwinports"`).

Next step is to fix the `conf-portaudio` `depexts` so they install the appropriate
package on Cygwin. I added this line to the `depexts` section in `conf-portaudio.opam`:
```
    ["portaudio"] {os = "win32" & os-distribution = "cygwin"}
```

I needed to run `opam pin .` again to get Opam to update its copy of the custom
version of this package's metadata. Every time you change the opam file of a
pinned package you have to re-pin the package for the change to be come visible
to Opam.

Then I tried installing `conf-portaudio` again:
```
PS C:\Users\s\conf-portaudio> opam install conf-portaudio

<><> Synchronising pinned packages ><><><><><><><><><><><><><><><><><><><><>  🐫
[conf-portaudio.1] synchronised (no changes)

The following actions will be performed:
=== install 1 package
  ∗ conf-portaudio 1 (pinned)

The following system packages will first need to be installed:
    portaudio

<><> Handling external dependencies <><><><><><><><><><><><><><><><><><><><>  🐫

+ C:\Users\s\AppData\Local\opam\.cygwin\setup-x86_64.exe "--root" "C:\\Users\\s\\AppData\\Local\\opam\\.cygwin\\root" "--quiet-mode" "noinput" "--no-shortcuts" "--no-startmenu" "--no-desktop" "--no-admin" "--no-version-check" "--no-write-registry" "--packages" "portaudio" "--upgrade-also" "--only-site" "--site" "https://cygwin.mirror.constant.com/" "--local-package-dir" "C:\\Users\\s\\AppData\\Local\\opam\\.cygwin\\cache"
- Starting cygwin install, version 2.934
- User has NO backup/restore rights
- User has NO symlink creation right
- io_stream_cygfile: fopen(/etc/setup/setup.rc) failed 2 No such file or directory
- Current Directory: C:\Users\s\AppData\Local\opam\.cygwin\cache
- root: C:\Users\s\AppData\Local\opam\.cygwin\root user
- Changing gid back to original
- Selected local directory: C:\Users\s\AppData\Local\opam\.cygwin\cache
- net: Preconfig
- site: https://cygwin.mirror.constant.com/
- Package 'portaudio' not found.
- solving: 0 tasks, update: yes, use test packages: no
- solving: 0 tasks, update: no, use test packages: no
- Augmented Transaction List: is empty
- running: C:\Users\s\AppData\Local\opam\.cygwin\root\bin\dash.exe "/etc/postinstall/0p_000_autorebase.dash"
- running: C:\Users\s\AppData\Local\opam\.cygwin\root\bin\dash.exe "/etc/postinstall/0p_update-info-dir.dash"
- running: C:\Users\s\AppData\Local\opam\.cygwin\root\bin\dash.exe "/etc/postinstall/zp_man-db-update-index.dash"
- Ending cygwin install

<><> Processing actions <><><><><><><><><><><><><><><><><><><><><><><><><><>  🐫
[ERROR] The compilation of conf-portaudio.1 failed at "pkgconf --exists portaudio-2.0".

#=== ERROR while compiling conf-portaudio.1 ===================================#
# context     2.3.0 | win32/x86_64 | ocaml.5.3.0 | pinned(file://C:/Users/s/conf-portaudio)
# path        ~\AppData\Local\opam\default\.opam-switch\build\conf-portaudio.1
# command     ~\AppData\Local\opam\.cygwin\root\bin\pkgconf.exe --exists portaudio-2.0
# exit-code   1
# env-file    ~\AppData\Local\opam\log\conf-portaudio-9396-6b5019.env
# output-file ~\AppData\Local\opam\log\conf-portaudio-9396-6b5019.out



<><> Error report <><><><><><><><><><><><><><><><><><><><><><><><><><><><><>  🐫
┌─ The following actions failed
│ λ build conf-portaudio 1
└─
╶─ No changes have been performed
```

This time Opam tried to install the `portaudio` Cygwin package, however `Package 'portaudio' not found.` tells us that there is no such Cygwin package.

However digging around in the Cygwin package repo I did come across a package
named `mingw64-x86_64-portaudio`, though it's unmaintained and hasn't been
updated since 2018. I _also_ happened to find the package
`mingw64-x86_64-libao`, also unmaintained and not updated since 2013, however if
this package works then I might be able to use `llama` on Windows unmodified,
since it's currently based on libao.

Repeating the steps above to create a custom version of the `conf-ao` package -
Opam's meta package for installing the system-appropriate libao package:
```
PS C:\Users\s\conf-ao> opam show conf-ao --raw > conf-ao.opam
PS C:\Users\s\conf-ao> opam pin .
conf-ao is now pinned to file://C:/Users/s/conf-ao (version 1)

The following actions will be performed:
=== install 1 package
  ∗ conf-ao 1 (pinned)

Proceed with ∗ 1 installation? [y/n] n
[NOTE] Pinning command successful, but your installed packages may be out of sync.
```

Then I modified `conf-ao.opam`, adding the following to its `depexts`:
```
  ["mingw64-x86_64-libao"] {os = "win32" & os-distribution = "cygwin"}
```
...and changed its build command to test for the system libao package using
`pkgconf` instead of `pkg-config`, the same as what I did for `conf-portaudio`.


Moment of truth:
```
PS C:\Users\s\conf-ao> opam install conf-ao

<><> Synchronising pinned packages ><><><><><><><><><><><><><><><><><><><><>  🐫
[conf-ao.1] synchronised (no changes)

The following actions will be performed:
=== install 1 package
  ∗ conf-ao 1 (pinned)

The following system packages will first need to be installed:
    mingw64-x86_64-libao

<><> Handling external dependencies <><><><><><><><><><><><><><><><><><><><>  🐫

+ C:\Users\s\AppData\Local\opam\.cygwin\setup-x86_64.exe "--root" "C:\\Users\\s\\AppData\\Local\\opam\\.cygwin\\root" "--quiet-mode" "noinput" "--no-shortcuts" "--no-startmenu" "--no-desktop" "--no-admin" "--no-version-check" "--no-write-registry" "--packages" "mingw64-x86_64-libao" "--upgrade-also" "--only-site" "--site" "https://cygwin.mirror.constant.com/" "--local-package-dir" "C:\\Users\\s\\AppData\\Local\\opam\\.cygwin\\cache"
- Starting cygwin install, version 2.934
- User has NO backup/restore rights
- User has NO symlink creation right
- Current Directory: C:\Users\s\AppData\Local\opam\.cygwin\cache
- root: C:\Users\s\AppData\Local\opam\.cygwin\root user
- Changing gid back to original
- Selected local directory: C:\Users\s\AppData\Local\opam\.cygwin\cache
- net: Preconfig
- site: https://cygwin.mirror.constant.com/
- solving: 1 tasks, update: yes, use test packages: no
- solving: 1 tasks, update: no, use test packages: no
- Augmented Transaction List:
-    0 install mingw64-x86_64-libao 1.1.0-1
- Downloaded C:\Users\s\AppData\Local\opam\.cygwin\cache/https%3a%2f%2fcygwin.mirror.constant.com%2f/noarch/release/mingw64-x86_64-libao/mingw64-x86_64-libao-1.1.0-1.tar.xz
- Extracting from file://C:\Users\s\AppData\Local\opam\.cygwin\cache/https%3a%2f%2fcygwin.mirror.constant.com%2f/noarch/release/mingw64-x86_64-libao/mingw64-x86_64-libao-1.1.0-1.tar.xz
- running: C:\Users\s\AppData\Local\opam\.cygwin\root\bin\dash.exe "/etc/postinstall/0p_000_autorebase.dash"
- running: C:\Users\s\AppData\Local\opam\.cygwin\root\bin\dash.exe "/etc/postinstall/0p_update-info-dir.dash"
- running: C:\Users\s\AppData\Local\opam\.cygwin\root\bin\dash.exe "/etc/postinstall/zp_man-db-update-index.dash"
- Ending cygwin install

<><> Processing actions <><><><><><><><><><><><><><><><><><><><><><><><><><>  🐫
[ERROR] The compilation of conf-ao.1 failed at "pkgconf --exists ao".

#=== ERROR while compiling conf-ao.1 ==========================================#
# context     2.3.0 | win32/x86_64 | ocaml.5.3.0 | pinned(file://C:/Users/s/conf-ao)
# path        ~\AppData\Local\opam\default\.opam-switch\build\conf-ao.1
# command     ~\AppData\Local\opam\.cygwin\root\bin\pkgconf.exe --exists ao
# exit-code   1
# env-file    ~\AppData\Local\opam\log\conf-ao-8080-676a1b.env
# output-file ~\AppData\Local\opam\log\conf-ao-8080-676a1b.out



<><> Error report <><><><><><><><><><><><><><><><><><><><><><><><><><><><><>  🐫
┌─ The following actions failed
│ λ build conf-ao 1
└─
╶─ No changes have been performed
```

Ok so it found the `mingw64-x86_64-libao` package in the Cygwin repo but it
looks like `pkgconf` can't see it.

Manually inspecting the Cygwin directory, and I do see that libao has been
installed:
```
PS C:\Users\s\conf-ao> ls C:\Users\s\AppData\Local\opam\.cygwin\root\usr\x86_64-w64-mingw32\sys-root\mingw\lib\libao.*

    Directory: C:\Users\s\AppData\Local\opam\.cygwin\root\usr\x86_64-w64-mingw32\sys-root\mingw\lib

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a---          02/12/2013    15:27          50102 libao.a
-a---          02/12/2013    15:27           9386 libao.dll.a
```

But that's doesn't look like a standard path for libraries.
Reading more about the `mingw64-x86_64-*` packages in the Cygwin repo and it
doesn't look like I'll easily be able to mix them with other Cygwin packages,
which could make it tricky to proceed with Opam in its current configuration
where it manages a Cygwin environment for us.

An alternative package manager for Windows is "Msys2". During `opam init` you
can select Msys2 as an alternative to Cygwin, though there's no option for Opam
to install the Msys2 environment for us. There appears to be a `libao` package in
the Msys2 repository, so the next step will be to try setting up an Msys2
environment and a new Opam installation which uses it and then install the
`conf-ao` package along with its `depexts` within that environment.

## Trying again with Msys2

Firstly I deleted `C:\Users\s\AppData\Local\opam` to get a fresh start.

I installed Msys2 from the installer at [its website](https://www.msys2.org/),
which created a directory `C:\msys64` which will be the root directory of our
Msys2 environment.

Then I reran `opam init` to create a new Opam environment, this time selecting
the second option for obtaining Unix tools: `Use an existing Cygwin/MSYS2
installation`. I'll post the entire output of the interactive session with `opam
init` in case it helps someone set up Opam on their machine:
```
PS C:\Users\s> opam init
No configuration file found, using built-in defaults.

<><> Windows Developer Mode <><><><><><><><><><><><><><><><><><><><><><><><>  🐫
opam does not require Developer Mode to be enabled on Windows, but it is
recommended, in particular because it enables support for symlinks without
requiring opam to be run elevated (which we do not recommend doing).

More information on enabling Developer Mode may be obtained from
https://learn.microsoft.com/en-gb/windows/apps/get-started/enable-your-device-for-development

<><> Unix support infrastructure ><><><><><><><><><><><><><><><><><><><><><>  🐫

opam and the OCaml ecosystem in general require various Unix tools in order to operate correctly. At present, this requires the installation of Cygwin to provide these tools.

How should opam obtain Unix tools?
> 1. Automatically create an internal Cygwin installation that will be managed by opam (recommended)
  2. Use an existing Cygwin/MSYS2 installation
  3. Abort initialisation

[1/2/3] 2
Enter the prefix of an existing Cygwin installation (e.g. C:\cygwin64) C:\msys64

The following system packages will first need to be installed:
    diffutils make patch rsync unzip

<><> Handling external dependencies <><><><><><><><><><><><><><><><><><><><>  🐫

opam believes some required external dependencies are missing. opam can:
> 1. Run C:\msys64\usr\bin\pacman.exe to install them (may need root/sudo access)
  2. Display the recommended C:\msys64\usr\bin\pacman.exe command and wait while you run it manually (e.g. in another terminal)
  3. Continue anyway, and, upon success, permanently register that this external dependency is present, but not detectable
  4. Abort the installation

[1/2/3/4] 1

+ C:\msys64\usr\bin\pacman.exe "-Su" "--noconfirm" "diffutils" "make" "patch" "rsync" "unzip"
- :: Starting core system upgrade...
-  there is nothing to do
- :: Starting full system upgrade...
- resolving dependencies...
- looking for conflicting packages...
-
- Packages (6) libxxhash-0.8.3-1  diffutils-3.10-1  make-4.4.1-2  patch-2.7.6-3  rsync-3.4.1-1  unzip-6.0-3
-
- Total Download Size:   1.43 MiB
- Total Installed Size:  4.51 MiB
-
- :: Proceed with installation? [Y/n]
- :: Retrieving packages...
-  make-4.4.1-2-x86_64 downloading...
-  diffutils-3.10-1-x86_64 downloading...
-  rsync-3.4.1-1-x86_64 downloading...
-  unzip-6.0-3-x86_64 downloading...
-  patch-2.7.6-3-x86_64 downloading...
-  libxxhash-0.8.3-1-x86_64 downloading...
- checking keyring...
- checking package integrity...
- loading package files...
- checking for file conflicts...
- checking available disk space...
- :: Processing package changes...
- installing diffutils...
- installing make...
- installing patch...
- Optional dependencies for patch
-     ed: for patch -e functionality
- installing libxxhash...
- installing rsync...
- installing unzip...
- :: Running post-transaction hooks...
- (1/1) Updating the info directory file...
Checking for available remotes: rsync and local, git.
  - you won't be able to use mercurial repositories unless you install the hg command on your system.
  - you won't be able to use darcs repositories unless you install the darcs command on your system.


<><> Fetching repository information ><><><><><><><><><><><><><><><><><><><>  🐫
[default] Initialised

<><> Required setup - please read <><><><><><><><><><><><><><><><><><><><><>  🐫

  In normal operation, opam only alters files within ~\AppData\Local\opam.

  However, to best integrate with your system, some environment variables
  should be set. When you want to access your opam installation, you will
  need to run:

    (& opam env) -split '\r?\n' | ForEach-Object { Invoke-Expression $_ }

  You can always re-run this setup with 'opam init' later.

opam doesn't have any configuration options for pwsh; you will have to run (& opam env) -split '\r?\n' | ForEach-Object { Invoke-Expression $_ } whenever you change you current 'opam switch' or start a new terminal session. Alternatively, would you like to
select a different shell? [y/n] n

<><> Creating initial switch 'default' (invariant ["ocaml" {>= "4.05.0"}] - initially with ocaml-base-compiler)

<><> Installing new switch packages <><><><><><><><><><><><><><><><><><><><>  🐫
Switch invariant: ["ocaml" {>= "4.05.0"}]

The following system packages will first need to be installed:
    mingw-w64-x86_64-gcc

<><> Handling external dependencies <><><><><><><><><><><><><><><><><><><><>  🐫

opam believes some required external dependencies are missing. opam can:
> 1. Run C:\msys64\usr\bin\pacman.exe to install them (may need root/sudo access)
  2. Display the recommended C:\msys64\usr\bin\pacman.exe command and wait while you run it manually (e.g. in another terminal)
  3. Continue anyway, and, upon success, permanently register that this external dependency is present, but not detectable
  4. Abort the installation

[1/2/3/4] 1

+ C:\msys64\usr\bin\pacman.exe "-Su" "--noconfirm" "mingw-w64-x86_64-gcc"
- :: Starting core system upgrade...
-  there is nothing to do
- :: Starting full system upgrade...
- resolving dependencies...
- looking for conflicting packages...
-
- Packages (16) mingw-w64-x86_64-binutils-2.44-1  mingw-w64-x86_64-crt-git-12.0.0.r509.g079e6092b-1  mingw-w64-x86_64-gcc-libs-14.2.0-2  mingw-w64-x86_64-gettext-runtime-0.23.1-1  mingw-w64-x86_64-gmp-6.3.0-2  mingw-w64-x86_64-headers-git-12.0.0.r509.g079e6092b-1  mingw-w64-x86_64-isl-0.27-1  mingw-w64-x86_64-libiconv-1.18-1  mingw-w64-x86_64-libwinpthread-git-12.0.0.r509.g079e6092b-1  mingw-w64-x86_64-mpc-1.3.1-2  mingw-w64-x86_64-mpfr-4.2.1-2  mingw-w64-x86_64-windows-default-manifest-6.4-4  mingw-w64-x86_64-winpthreads-git-12.0.0.r509.g079e6092b-1  mingw-w64-x86_64-zlib-1.3.1-1  mingw-w64-x86_64-zstd-1.5.7-1  mingw-w64-x86_64-gcc-14.2.0-2
-
- Total Download Size:    65.78 MiB
- Total Installed Size:  518.69 MiB
-
- :: Proceed with installation? [Y/n]
- :: Retrieving packages...
-  mingw-w64-x86_64-gcc-14.2.0-2-any downloading...
-  mingw-w64-x86_64-headers-git-12.0.0.r509.g079e6092b-1-any downloading...
-  mingw-w64-x86_64-binutils-2.44-1-any downloading...
-  mingw-w64-x86_64-crt-git-12.0.0.r509.g079e6092b-1-any downloading...
-  mingw-w64-x86_64-isl-0.27-1-any downloading...
-  mingw-w64-x86_64-gcc-libs-14.2.0-2-any downloading...
-  mingw-w64-x86_64-libiconv-1.18-1-any downloading...
-  mingw-w64-x86_64-zstd-1.5.7-1-any downloading...
-  mingw-w64-x86_64-gmp-6.3.0-2-any downloading...
-  mingw-w64-x86_64-mpfr-4.2.1-2-any downloading...
-  mingw-w64-x86_64-gettext-runtime-0.23.1-1-any downloading...
-  mingw-w64-x86_64-mpc-1.3.1-2-any downloading...
-  mingw-w64-x86_64-zlib-1.3.1-1-any downloading...
-  mingw-w64-x86_64-winpthreads-git-12.0.0.r509.g079e6092b-1-any downloading...
-  mingw-w64-x86_64-libwinpthread-git-12.0.0.r509.g079e6092b-1-any downloading...
-  mingw-w64-x86_64-windows-default-manifest-6.4-4-any downloading...
- checking keyring...
- checking package integrity...
- loading package files...
- checking for file conflicts...
- checking available disk space...
- :: Processing package changes...
- installing mingw-w64-x86_64-libwinpthread-git...
- installing mingw-w64-x86_64-gcc-libs...
- installing mingw-w64-x86_64-libiconv...
- installing mingw-w64-x86_64-gettext-runtime...
- installing mingw-w64-x86_64-zlib...
- installing mingw-w64-x86_64-zstd...
- installing mingw-w64-x86_64-binutils...
- installing mingw-w64-x86_64-headers-git...
- installing mingw-w64-x86_64-crt-git...
- installing mingw-w64-x86_64-gmp...
- installing mingw-w64-x86_64-isl...
- installing mingw-w64-x86_64-mpfr...
- installing mingw-w64-x86_64-mpc...
- installing mingw-w64-x86_64-windows-default-manifest...
- installing mingw-w64-x86_64-winpthreads-git...
- installing mingw-w64-x86_64-gcc...

<><> Processing actions <><><><><><><><><><><><><><><><><><><><><><><><><><>  🐫
∗ installed arch-x86_64.1
∗ installed base-bigarray.base
∗ installed base-threads.base
∗ installed base-unix.base
∗ installed host-arch-x86_64.1
∗ installed host-system-mingw.1
∗ installed msys2-mingw64.1
⬇ retrieved msys2.0.1.0  (https://opam.ocaml.org/cache)
∗ installed msys2.0.1.0
∗ installed conf-mingw-w64-gcc-x86_64.1
⬇ retrieved flexdll.0.44  (https://opam.ocaml.org/cache)
∗ installed flexdll.0.44
∗ installed ocaml-env-mingw64.1
∗ installed ocaml-options-vanilla.1
∗ installed system-mingw.1
⬇ retrieved ocaml-config.3  (2 extra sources)
⬇ retrieved ocaml-config.3  (2 extra sources)
⬇ retrieved ocaml-compiler.5.3.0  (https://opam.ocaml.org/cache)
∗ installed ocaml-compiler.5.3.0
∗ installed ocaml-base-compiler.5.3.0
∗ installed ocaml-config.3
∗ installed ocaml.5.3.0
∗ installed base-domains.base
∗ installed base-effects.base
∗ installed base-nnp.base
Done.
# To update the current shell environment, run: (& opam env --switch=default) -split '\r?\n' | ForEach-Object { Invoke-Expression $_ }
```

During initialization, Opam took care of installing a C compiler and various
other essential tools into the Msys2 environment at `C:\msys64`.

My next goal is to get Opam to install libao with Msys2. I'm not sure what the
correct `depexts` entry should be for this, so I'll start with `["libao"] {os =
"win32" & os-distribution = "cygwin"}`. I updated my custom copy of the
`conf-ao` package and pinned the package with Opam:
```
PS C:\Users\s\conf-ao> opam pin .\conf-ao.opam
Fatal error:
"rsync": command not found.
```

I guess I need to manually install `rsync` into my Msys2 environment? To do
this, launch an Msys2 terminal by running the `msys2.exe` program from the Msys2
installation (`C:\msys64\msys2.exe`). Msys2 uses `pacman` as its package
manager, borrowed from Archlinux:
```
$ pacman -S rsync
warning: rsync-3.4.1-1 is up to date -- reinstalling
resolving dependencies...
looking for conflicting packages...

Packages (1) rsync-3.4.1-1

Total Installed Size:  0.67 MiB
Net Upgrade Size:      0.00 MiB

:: Proceed with installation? [Y/n] n
```

Ok looks like `rsync` was already installed.

Maybe when Opam isn't managing Cygwin for us we need to to manually
update the shell environment to bring various commands into PATH?
```
PS C:\Users\s\conf-ao> (& opam env --switch=default) -split '\r?\n' | ForEach-Object { Invoke-Expression $_ }
PS C:\Users\s\conf-ao> opam pin .\conf-ao.opam
Fatal error:
"rsync": command not found.
```

No such luck.

Checking that `rsync` works as expected:
```
PS C:\Users\s\conf-ao> C:\msys64\usr\bin\rsync --help
rsync  version 3.4.1  protocol version 32
Copyright (C) 1996-2025 by Andrew Tridgell, Wayne Davison, and others.
Web site: https://rsync.samba.org/
...
```

Maybe I just need to manually add `C:\msys64\usr\bin` to my PATH.
```
PS C:\Users\s\conf-ao> $env:PATH += ";C:\msys64\usr\bin"
PS C:\Users\s\conf-ao> rsync --version
rsync  version 3.4.1  protocol version 32
Copyright (C) 1996-2025 by Andrew Tridgell, Wayne Davison, and others.
Web site: https://rsync.samba.org/
...
```

And now pinning `conf-ao` again:
```
PS C:\Users\s\conf-ao> opam pin .\conf-ao.opam
[ERROR] Could not retrieve Could not extract archive:
        Unknown archive type: C:\Users\s\AppData\Local\Temp\opam-4184-d29c4e\conf-ao.opam
```

Which reminds me that I'm not supposed to `pin` the opam file directly but
instead the entire folder which contains it.

```
PS C:\Users\s\conf-ao> opam pin .
conf-ao is now pinned to file://C:/Users/s/conf-ao (version 1)

The following actions will be performed:
=== install 3 packages
  ∗ conf-ao                       1 (pinned)
  ∗ conf-mingw-w64-pkgconf-x86_64 1          [required by conf-pkg-config]
  ∗ conf-pkg-config               4          [required by conf-ao]

Proceed with ∗ 3 installations? [y/n] n
[NOTE] Pinning command successful, but your installed packages may be out of sync.
```

That's good.
I'm curious about the
`conf-mingw-w64-pkgconf-x86_64` package. It
wasn't needed when installing
`depexts` with Cygwin, so it's probably specific to Msys2, which means it can
probably give us a hint as to the proper way to specify Msys2-specific
`depexts`, which we'll need to do for our pinned `conf-ao` package (I was only
guessing how to add its new `depexts` initially).

`conf-mingw-w64-pkgconf-x86_64` is probably a dependency of `conf-pkg-config` on
Msys2, so I'll start by looking at `conf-pkg-config`'s metadata and then look at
the metadata for `conf-mingw-w64-pkgconf-x86_64`.

```
PS C:\Users\s\conf-ao> opam show --raw conf-pkg-config
...
depends: [
  ("host-arch-x86_64" {os = "win32" & os-distribution = "msys2"} &
   "conf-mingw-w64-pkgconf-x86_64" {os = "win32" & os-distribution = "msys2"} |
   "host-arch-x86_32" {os = "win32" & os-distribution = "msys2"} &
   "conf-mingw-w64-pkgconf-i686" {os = "win32" & os-distribution = "msys2"})
]
...
PS C:\Users\s\conf-ao> opam show --raw conf-mingw-w64-pkgconf-x86_64
...
depexts:
  ["mingw-w64-x86_64-pkgconf"] {os = "win32" & os-distribution = "msys2"}
```

From this we can learn that when using Msys2 to install `depexts`, the
`os-distribution` variable evaluates to "msys2" instead of "cygwin". Also on
Msys2 Opam will install the system package `mingw-w64-x86_64-pkgconf` to
install `pkg-config`/`pkgconf`. This suggests that the correct `depext` entry
for `conf-ao` is in fact:
```
["mingw-w64-x86_64-libao"] {os = "win32" & os-distribution = "msys2"}
```

After updating the local copy of `conf-ao` with the above `depext` and
re-pinning it I tried installing `conf-ao` again:
```
PS C:\Users\s\conf-ao> opam install conf-ao

<><> Synchronising pinned packages ><><><><><><><><><><><><><><><><><><><><>  🐫
[conf-ao.1] synchronised (no changes)

The following actions will be performed:
=== install 3 packages
  ∗ conf-ao                       1 (pinned)
  ∗ conf-mingw-w64-pkgconf-x86_64 1          [required by conf-pkg-config]
  ∗ conf-pkg-config               4          [required by conf-ao]

Proceed with ∗ 3 installations? [y/n] y

The following system packages will first need to be installed:
    mingw-w64-x86_64-libao mingw-w64-x86_64-pkgconf

<><> Handling external dependencies <><><><><><><><><><><><><><><><><><><><>  🐫

opam believes some required external dependencies are missing. opam can:
> 1. Run C:\msys64\usr\bin\pacman.exe to install them (may need root/sudo access)
  2. Display the recommended C:\msys64\usr\bin\pacman.exe command and wait while you run it manually (e.g. in another terminal)
  3. Continue anyway, and, upon success, permanently register that this external dependency is present, but not detectable
  4. Abort the installation

[1/2/3/4] 1

+ C:\msys64\usr\bin\pacman.exe "-Su" "--noconfirm" "mingw-w64-x86_64-libao" "mingw-w64-x86_64-pkgconf"
- :: Starting core system upgrade...
-  there is nothing to do
- :: Starting full system upgrade...
- resolving dependencies...
- looking for conflicting packages...
-
- Packages (2) mingw-w64-x86_64-libao-1.2.2-2  mingw-w64-x86_64-pkgconf-1~2.3.0-1
-
- Total Download Size:   0.16 MiB
- Total Installed Size:  0.77 MiB
-
- :: Proceed with installation? [Y/n]
- :: Retrieving packages...
-  mingw-w64-x86_64-pkgconf-1~2.3.0-1-any downloading...
-  mingw-w64-x86_64-libao-1.2.2-2-any downloading...
- checking keyring...
- checking package integrity...
- loading package files...
- checking for file conflicts...
- checking available disk space...
- :: Processing package changes...
- installing mingw-w64-x86_64-libao...
- installing mingw-w64-x86_64-pkgconf...

<><> Processing actions <><><><><><><><><><><><><><><><><><><><><><><><><><>  🐫
∗ installed conf-mingw-w64-pkgconf-x86_64.1
∗ installed conf-pkg-config.4
∗ installed conf-ao.1
Done.
```

Success! And the fact that `conf-ao` installed successfully meant that
`conf-ao`'s build command which uses `pkgconf` to check whether the `ao` library
is visible also ran successfully, so we're hopefully in a good place to link
against `ao` when building `llama`, which will be the next step.

## Making Noise

Let's try building and running an example from the `llama` synthesizer library.

Get the code:
```
PS C:\Users\s> git clone git@github.com:gridbugs/llama
Cloning into 'llama'...
...
Resolving deltas: 100% (961/961), done.
PS C:\Users\s> cd .\llama\
```

Since an old version of the packages in this repo are already published to Opam,
we need to pin them with Opam so the local versions are used and not the
released versions.

```
PS C:\Users\s\llama> opam pin .
This will pin the following packages: llama, llama_core, llama_interactive, llama_midi, llama_tests. Continue? [y/n] y
llama is now pinned to git+file://C:/Users/s/llama#main (version 0.1.0)
llama_core is now pinned to git+file://C:/Users/s/llama#main (version 0.1.0)
llama_interactive is now pinned to git+file://C:/Users/s/llama#main (version 0.1.0)
llama_midi is now pinned to git+file://C:/Users/s/llama#main (version 0.1.0)
Package llama_tests does not exist, create as a NEW package? [y/n] y
llama_tests is now pinned to git+file://C:/Users/s/llama#main (version dev)

[ERROR] Package conflict!
  * Missing dependency:
    - llama_tests → llama_midi >= dev
    no matching version

[NOTE] Pinning command successful, but your installed packages may be out of sync.
```

That error is because the `llama_tests` library is unreleased while all the
other packages are released. Opam phones home while pinning packages to work out which
versions to pin (it uses the latest released version of each
released package and "dev" for unreleased packages from the look of things).
That's not ideal here though because the unreleased `llama_tests` package is
looking for a version of `llama_midi` of its same version and failing to find it
because the unreleased `llama_tests` is version "dev" while `llama_midi` is
version "0.1.0". I think we can work around this by forcing Opam to pin all the
packages at version "dev":
```
PS C:\Users\s\llama> opam pin . --with-version=dev
This will pin the following packages: llama, llama_core, llama_interactive, llama_midi, llama_tests. Continue? [y/n] y
[NOTE] Package llama is currently pinned to git+file://C:/Users/s/llama#main (version 0.1.0).
llama is now pinned to git+file://C:/Users/s/llama#main (version dev)
[NOTE] Package llama_core is currently pinned to git+file://C:/Users/s/llama#main (version 0.1.0).
llama_core is now pinned to git+file://C:/Users/s/llama#main (version dev)
[NOTE] Package llama_interactive is currently pinned to git+file://C:/Users/s/llama#main (version 0.1.0).
llama_interactive is now pinned to git+file://C:/Users/s/llama#main (version dev)
[NOTE] Package llama_midi is currently pinned to git+file://C:/Users/s/llama#main (version 0.1.0).
llama_midi is now pinned to git+file://C:/Users/s/llama#main (version dev)
[NOTE] Package llama_tests is already pinned to git+file://C:/Users/s/llama#main (version dev).
llama_tests is now pinned to git+file://C:/Users/s/llama#main (version dev)

The following actions will be performed:
=== install 44 packages
  ∗ ao                           0.2.4        [required by llama]
  ∗ base                         v0.17.2      [required by ppx_inline_test]
  ∗ bigarray-compat              1.1.0        [required by ctypes]
  ∗ conf-libffi                  2.0.0        [required by ctypes-foreign]
...
Proceed with ∗ 44 installations? [y/n] n
[NOTE] Pinning command successful, but your installed packages may be out of sync.
```

Just checking that we now don't have 2 pins for each released package ("0.1.0"
and "dev") from the two different runs of `opam pin`:
```
PS C:\Users\s\llama> opam pin list
conf-ao.1                             rsync  file://C:/Users/s/conf-ao
llama.dev              (uninstalled)  git    git+file://C:/Users/s/llama#main
llama_core.dev         (uninstalled)  git    git+file://C:/Users/s/llama#main
llama_interactive.dev  (uninstalled)  git    git+file://C:/Users/s/llama#main
llama_midi.dev         (uninstalled)  git    git+file://C:/Users/s/llama#main
llama_tests.dev        (uninstalled)  git    git+file://C:/Users/s/llama#main
```

Looks good, and also we can see that our custom `conf-ao` is there which is
expected. One potential issue is that the `llama` packages are fetched with `git`
rather than `rsync`, which might bite us later if we modify the local files
in the `llama` project without committing the results. We can avoid this by not
installing any of these local packages with Opam, and instead just installing
their dependencies and then building the project with Dune.

Install the deps:
```
PS C:\Users\s\llama> opam install . --deps-only
[llama.dev] synchronised (no changes)
[llama_core.dev] synchronised (no changes)
[llama_interactive.dev] synchronised (no changes)
[llama_midi.dev] synchronised (no changes)
[llama_tests.dev] synchronised (no changes)
The following actions will be performed:
=== install 39 packages
  ∗ ao                           0.2.4   [required by llama]
  ∗ base                         v0.17.2 [required by ppx_inline_test]
  ∗ bigarray-compat              1.1.0   [required by ctypes]
  ∗ conf-libffi                  2.0.0   [required by ctypes-foreign]
  ∗ conf-mingw-w64-libffi-x86_64 1       [required by conf-libffi]
  ∗ conf-mingw-w64-sdl2-x86_64   1       [required by conf-sdl2]
  ∗ conf-sdl2                    1       [required by tsdl]
  ∗ csexp                        1.5.2   [required by dune-configurator]
  ∗ ctypes                       0.23.0  [required by tsdl]
  ∗ ctypes-foreign               0.23.0  [required by tsdl]
  ∗ dune                         3.19.0  [required by llama_midi, llama_core, llama, etc.]
  ∗ dune-configurator            3.19.0  [required by ao]
  ∗ integers                     0.7.0   [required by ctypes]
  ∗ jane-street-headers          v0.17.0 [required by time_now]
  ∗ jst-config                   v0.17.0 [required by time_now]
  ∗ ocaml-compiler-libs          v0.17.0 [required by ppxlib]
  ∗ ocaml_intrinsics_kernel      v0.17.1 [required by base]
  ∗ ocamlbuild                   0.16.1  [required by tsdl]
  ∗ ocamlfind                    1.9.8   [required by tsdl]
  ∗ ppx_assert                   v0.17.0 [required by jst-config]
  ∗ ppx_base                     v0.17.0 [required by time_now]
  ∗ ppx_cold                     v0.17.0 [required by ppx_base]
  ∗ ppx_compare                  v0.17.0 [required by ppx_base]
  ∗ ppx_derivers                 1.2.1   [required by ppxlib]
  ∗ ppx_enumerate                v0.17.0 [required by ppx_base]
  ∗ ppx_globalize                v0.17.0 [required by ppx_base]
  ∗ ppx_hash                     v0.17.0 [required by ppx_base]
  ∗ ppx_here                     v0.17.0 [required by ppx_assert]
  ∗ ppx_inline_test              v0.17.0 [required by llama_tests]
  ∗ ppx_optcomp                  v0.17.0 [required by time_now]
  ∗ ppx_sexp_conv                v0.17.0 [required by ppx_base]
  ∗ ppxlib                       0.35.0  [required by ppx_inline_test]
  ∗ ppxlib_jane                  v0.17.2 [required by ppx_globalize, ppx_enumerate, ppx_hash]
  ∗ sexplib0                     v0.17.0 [required by base, ppxlib]
  ∗ stdio                        v0.17.0 [required by ppx_optcomp]
  ∗ stdlib-shims                 0.3.0   [required by ppxlib]
  ∗ time_now                     v0.17.0 [required by ppx_inline_test]
  ∗ topkg                        1.0.8   [required by tsdl]
  ∗ tsdl                         1.1.0   [required by llama_interactive]

Proceed with ∗ 39 installations? [y/n] y

The following system packages will first need to be installed:
    mingw-w64-x86_64-libffi mingw-w64-x86_64-SDL2
...
```

Note the additional depexts `mingw-w64-x86_64-libffi` and
`mingw-w64-x86_64-SDL2`. Based on their names these appear to be packages in the
Msys2 repo. It's great that these packages don't seem to require the manual
intervention needed for `libao`. While my project's dependencies install, let's
investigate how one of these packages works:
```
PS C:\Users\s> opam show conf-sdl2
...
depends     "conf-pkg-config" {build}
            ("host-arch-x86_32" {os = "win32" & os-distribution != "cygwinports"} &
             "conf-mingw-w64-sdl2-i686" {os = "win32" & os-distribution != "cygwinports"} |
             "host-arch-x86_64" {os = "win32" & os-distribution != "cygwinports"} &
             "conf-mingw-w64-sdl2-x86_64"
               {os = "win32" & os-distribution != "cygwinports"})
...
```

Similar to `conf-pkg-config`, we see the dependency on an additional
`conf-mingw-w64-*` metapackage under some conditions. Here though it's
`os-distribution != "cygwinports"` rather than `os-distribution = "msys2"` which
makes me wonder if this would cause a problem on a regular Cygwin installation,
where `os-distribution = "cygwin"`. That would cause the `os-distribution != "cygwinports"`
to be true which seems to select `conf-mingw-w64-*` packages, but my intuition
is that those packages should only be selected on Msys2. There's too much
else going on to also investigate that now and maybe my hunch is wrong anyway.

There's a new problem: `llama`'s dependencies failed to install:
```
#=== ERROR while compiling topkg.1.0.8 ========================================#
# context     2.3.0 | win32/x86_64 | ocaml.5.3.0 | https://opam.ocaml.org#11859fd62a66b5e319a415e807797407068a7c13
# path        ~\AppData\Local\opam\default\.opam-switch\build\topkg.1.0.8
# command     ~\AppData\Local\opam\default\bin\ocaml.exe pkg/pkg.ml build --pkg-name topkg --dev-pkg false
# exit-code   125
# env-file    ~\AppData\Local\opam\log\topkg-18684-d088ec.env
# output-file ~\AppData\Local\opam\log\topkg-18684-d088ec.out
### output ###
# Exception: Fl_package_base.No_such_package ("findlib", "").

<><> Error report <><><><><><><><><><><><><><><><><><><><><><><><><><><><><>  🐫
┌─ The following actions failed
│ λ build topkg 1.0.8
└─
```

The [topkg](https://opam.ocaml.org/packages/topkg/) package is a build tool.
According to its description it's in maintenance mode and should no longer be
used. It's got 165 reverse dependencies so the fact that it doesn't build on
Windows (or maybe just when using Msys2 or maybe just on my machine) is a little
concerning however for our purposes here it's only used to build `tsdl` which is
only needed for the interactive components of `llama`. It would still be nice to
get it working but my priority is getting the sound to work, so consider fixing
`topkg` to be a stretch goal.

For now, let's just install the dependencies needed for non-interactive
synthesizer demos:
```
PS C:\Users\s\llama> opam install llama --deps-only

<><> Synchronising pinned packages ><><><><><><><><><><><><><><><><><><><><>  🐫
[llama.dev] synchronised (no changes)

The following actions will be performed:
=== install 2 packages
  ∗ llama_core dev (pinned) [required by llama]
  ∗ llama_midi dev (pinned) [required by llama_core]

Proceed with ∗ 2 installations? [y/n] n
```

Good news! All the necessary dependencies were successfully installed in the
previous step. Those two deps are local packages in this project so we don't
need to install them with Opam. In theory we should now have everything we need
to run an example:
<iframe width="560" height="315" src="https://www.youtube.com/embed/ZikuC-SCtEQ?si=EY2akELtCOS0Kfji" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

Honestly that was easier than I thought it would be. I'm really happy that I
didn't need to manually install libao and that Msys2/Opam could take care of
installing it and all the other system dependencies needed to build the synth
library and to access the sound card.

Most of what went wrong during this process could conceivably be called "user
error" though the fact that I have 5 years of OCaml programming behind me
and still hit some pretty major footguns with Opam maybe suggests some aspects
of its UX could be improved. Still some things were actually broken:
 - `conf-ao` is hardcoded to run `pkg-config` despite the executable being named
   `pkgconf` in some cases, and has no depext for Msys2. The workaround was to
   pin `conf-ao` and fix its problems in a local copy of the package.
 - Opam couldn't find the `rsync` executable in the Msys2 environment despite
   being configured to use an Msys2 environment where `rsync` was installed. The
   workaround was to manually add `C:\msys64\usr\bin` to PATH.
 - `topkg` failed to build. The workaround was to only use the non-interactive
   components of my project, as `topkg` is only necessary to compile the SDL bindings
   which are only needed for interactive synthesizer features.

The parts of Opam's UX that I evidently still struggle with relate to working
with local packages and pins.
Looking back at the "user errors" in this post, a couple of times I tried to pin
an opam file led to bizarre errors (
`Unknown archive type: C:\Users\s\AppData\Local\Temp\opam-4184-d29c4e\conf-ao.opam`)
and unexpected results (recursively copying my home directory inside itself
until I told it to stop). Opam pins are associated with package sources in the
form of a directory, git repo, or archive file - not with opam files themselves.
What's confusing when working with packages like `conf-ao` is that these
packages _don't have sources_. They are metapackages that just exist to
collect some dependencies on other Opam packages or external dependencies, but
they have no source code or other files to fetch during installation. I've
learnt that the correct thing to do is put the opam file I want to pin inside a
directory and then pin that directory.

The other pinning-related mistake I made was pinning a project containing
multiple packages where some but not all of the packages had been released. This
led to the non-released packages being pinned at version "dev" while the
released packages are pinned to the latest released version of those packages.
If the unreleased package depends on a released package, chances are it won't be
able to resolve the dependency because it will try to find a version of the
released package with version "dev". I've learnt that for such projects one must
run `opam pin . --with-version=dev`. Possibly that should be the default
behaviour or at least Opam should warn when some but not all of the packages in
a project are released.
I've complained about this exact behaviour
[before](@/blog/frustrating-interactions-with-the-ocaml-ecosystem-while-developing-a-synthesizer-library/index.md#if-some-but-not-all-of-the-interdependent-packages-in-a-project-are-released-opam-can-t-solve-the-project-s-dependencies)
but I still make this mistake all the time.

I have gotten used to Opam's quirks and am no longer too phased when things go
wrong. And on Windows in particular I had quite low expectations of the OCaml
ecosystem since it's historically been infamously hard to get working. This is
why I'm pleasantly surprised it was this easy to get generated audio playing
on Windows with OCaml, despite spending over a day on it at this point. The fact
that Opam can be installed through WinGet now, and that it takes care of setting up all
the external dependencies with Msys2 (or Cygwin) for you during initialization
is very slick. It's definitely come a long way since the last time I tried to
use OCaml on Windows in earnest.

That said many of the problems I had with Opam in this post were not
Windows-related. The problems with pinning are things I had encountered before
on Unix so I could recognize them and employ workarounds. I've adopted a
defensive approach to working with Opam where I expect the unexpected and often
explicitly verify that it did what I want such as always running `opam pin list`
after `opam pin` and using `opam show --raw` to check that pinning a package
has taken effect if I'm changing a pinned package's metadata. I don't believe
"user error" is an apt term to use here. The error is not with the user it's
with the usability of the tool.

## Stretch Goal: Fixing topkg

I set aside 2 days to get `llama` working on Windows and it's only been a day and
a half, so let's see if we can't get `topkg` to build and then run the graphical
interactive synthesizer demos which that would enable.

We'll start by grabbing the source code for topkg. Opam has a handy feature for
doing just this:
```
PS C:\Users\s> opam source topkg
Successfully extracted to C:\Users\s\topkg.1.0.8
PS C:\Users\s> cd .\topkg.1.0.8\
```

Now pin `topkg` to the local version so we can tweak things locally and test
out how they affect building `topkg` as a dependency:
```
PS C:\Users\s\topkg.1.0.8> opam pin .
This will pin the following packages: topkg-care, topkg. Continue? [y/n] y
topkg-care is now pinned to file://C:/Users/s/topkg.1.0.8 (version 1.0.8)
topkg is now pinned to file://C:/Users/s/topkg.1.0.8 (version 1.0.8)

The following actions will be performed:
=== remove 6 packages
  ⊘ base-domains            base               [conflicts with ocaml]
  ⊘ base-effects            base               [conflicts with ocaml]
  ⊘ base-nnp                base               [uses base-domains]
  ⊘ ocaml-compiler          5.3.0
  ⊘ ocaml_intrinsics_kernel v0.17.1            [conflicts with ocaml]
  ⊘ ppxlib_jane             v0.17.2            [conflicts with ocaml]
=== downgrade 20 packages
  ↘ base                    v0.17.2 to v0.16.4 [uses ocaml]
  ↘ jane-street-headers     v0.17.0 to v0.16.0 [uses ocaml]
  ↘ jst-config              v0.17.0 to v0.16.0 [uses ocaml]
  ↘ ocaml                   5.3.0 to 4.14.2    [required by topkg, topkg-care]
  ↘ ocaml-base-compiler     5.3.0 to 4.14.2    [required by ocaml]
  ↘ ocaml-compiler-libs     v0.17.0 to v0.12.4 [uses ocaml]
  ↘ ppx_assert              v0.17.0 to v0.16.0 [uses ocaml]
  ↘ ppx_base                v0.17.0 to v0.16.0 [uses ocaml]
  ↘ ppx_cold                v0.17.0 to v0.16.0 [uses ocaml]
  ↘ ppx_compare             v0.17.0 to v0.16.0 [uses ocaml]
  ↘ ppx_enumerate           v0.17.0 to v0.16.0 [uses ocaml]
  ↘ ppx_globalize           v0.17.0 to v0.16.0 [uses ocaml]
  ↘ ppx_hash                v0.17.0 to v0.16.0 [uses ocaml]
  ↘ ppx_here                v0.17.0 to v0.16.0 [uses ocaml]
  ↘ ppx_inline_test         v0.17.0 to v0.16.1 [uses ocaml]
  ↘ ppx_optcomp             v0.17.0 to v0.16.0 [uses ocaml]
  ↘ ppx_sexp_conv           v0.17.0 to v0.16.0 [uses ocaml]
  ↘ sexplib0                v0.17.0 to v0.16.0 [uses ocaml]
  ↘ stdio                   v0.17.0 to v0.16.0 [uses ocaml]
  ↘ time_now                v0.17.0 to v0.16.0 [uses ocaml]
...
```

Opam wants to remove or downgrade lots of packages including the compiler
itself. That seems a bit drastic so let's see if there's a way to avoid doing
that. After all `topkg.1.0.8` was part of the package solution Opam found when
building `llama`'s dependencies and `ocaml.5.3.0` was sufficient in that solution.
It's odd that it wouldn't also be sufficient here.
The opam files in `topkg`'s source archive look like they should be compatible
with `ocaml.5.3.0` so I really have no idea why Opam wanted to downgrade
everything.

Regardless, we don't actually need to install `topkg` while pinning it. It's
pinned now so that should be sufficient for the local copy to be compiled as a
dependency of `llama`. Let's see if that's correct:
```
PS C:\Users\s\llama> opam install . --deps-only
[llama_core.dev] synchronised (no changes)
[llama.dev] synchronised (no changes)
[llama_interactive.dev] synchronised (no changes)
[llama_midi.dev] synchronised (no changes)
[llama_tests.dev] synchronised (no changes)
The following actions will be performed:
=== install 2 packages
  ∗ topkg 1.0.8 (pinned) [required by tsdl]
  ∗ tsdl  1.1.0          [required by llama_interactive]

Proceed with ∗ 2 installations? [y/n] y

<><> Processing actions <><><><><><><><><><><><><><><><><><><><><><><><><><>  🐫
⬇ retrieved tsdl.1.1.0  (cached)
[ERROR] The compilation of topkg.1.0.8 failed at "ocaml pkg/pkg.ml build --pkg-name topkg --dev-pkg true".

#=== ERROR while compiling topkg.1.0.8 ========================================#
# context     2.3.0 | win32/x86_64 | ocaml.5.3.0 | pinned(file://C:/Users/s/topkg.1.0.8)
# path        ~\AppData\Local\opam\default\.opam-switch\build\topkg.1.0.8
# command     ~\AppData\Local\opam\default\bin\ocaml.exe pkg/pkg.ml build --pkg-name topkg --dev-pkg true
# exit-code   125
# env-file    ~\AppData\Local\opam\log\topkg-6140-4d0e5a.env
# output-file ~\AppData\Local\opam\log\topkg-6140-4d0e5a.out
### output ###
# Exception: Fl_package_base.No_such_package ("findlib", "").



<><> Error report <><><><><><><><><><><><><><><><><><><><><><><><><><><><><>  🐫
┌─ The following actions failed
│ λ build topkg 1.0.8
└─
```

Looks good, especially this line:
```
# context     2.3.0 | win32/x86_64 | ocaml.5.3.0 | pinned(file://C:/Users/s/topkg.1.0.8)
```

To debug this problem it will help to have a command we can run to quickly
reproduce it. Running the `topkg`'s build command, copied from its opam file,
causes the same error as we see when installing `topkg` as a dependency:
```
PS C:\Users\s\topkg.1.0.8> opam exec ocaml -- .\pkg\pkg.ml build --pkg-name topkg --dev-pkg true
Exception: Fl_package_base.No_such_package ("findlib", "").
```

Before digging into the source of `topkg` too deeply it might pay to verify that
findlib is indeed installed:
```
PS C:\Users\s\topkg.1.0.8> cat C:\Users\s\AppData\Local\opam\default\lib\findlib\META
# specifications for "findlib":
description = "Package manager"
requires = "findlib.internal"
requires(toploop) += "findlib.top"
requires(create_toploop) += "findlib.top"
version = "1.9.8"

package "internal" (
  version = "1.9.8"
  description = "Package manager"
  requires = ""
  archive(byte) = "findlib.cma"
  archive(native) = "findlib.cmxa"
  plugin(byte) = "findlib.cma"
  plugin(native) = "findlib.cmxs"
)

package "dynload" (
  version = "1.9.8"
  description = "Package manager dynamic loader"
  requires = "findlib dynlink"
  archive(byte) = "findlib_dynload.cma"
  archive(native) = "findlib_dynload.cmxa"
#Even if it strange and discouraged to dynload this package
  plugin(byte) = "findlib_dynload.cma"
  plugin(native) = "findlib_dynload.cmxs"
  linkopts = "-linkall"
)

package "top" (
  version = "1.9.8"
  description = "Package manager toplevel support"
  requires = "findlib.internal"
  archive(byte) = "findlib_top.cma"
  archive(native) = "findlib_top.cmxa"
)
```

Ok this suggests that the problem is with `topkg` itself and not with my
environment. I tried installing `llama`'s dependencies with Opam on Linux and
`topkg` built fine, suggesting that the problem is specific to Windows. A likely
hypothesis is that it's related to differences with how file paths work between
the Unix world and Windows, since this is a common point of pain for running
OCaml programs on Windows in my experience. The main two differences that tend
to cause problems are that the path separator is `\` on Windows and `/` on Unix,
and that Windows paths begin with `C:` while `:` is conventionally used to
delimit multiple paths when they appear in strings on Unix systems (Windows
tends to use `;` for this instead to avoid confusion around the colon in `C:`).

Next step was to instrument `topkg` with debug printouts to better understand
where the error was happening, but pretty quickly I realized that the problem
was happening before any code in `topkg` could run.

Here's a simplified version of `pkg/pkg.ml` from the `topkg` package that still exhibits the problem:
```ocaml
#!/usr/bin/env ocaml
#use "topfind"

let () = print_endline "hi"
```

Now I can run:
```
PS C:\Users\s\topkg.1.0.8> opam exec ocaml -- .\pkg\pkg.ml
Exception: Fl_package_base.No_such_package ("findlib", "").
```

And of course removing the `#use "topfind"` from the top of that file makes the
problem go away.

Interestingly I can add code before the `#use "topfind"` line and it still gets
executed:
```ocaml
#!/usr/bin/env ocaml
let () = print_endline "before";;

#use "topfind"

let () = print_endline "after";;
```

The output is:
```
PS C:\Users\s\topkg.1.0.8> opam exec ocaml -- .\pkg\pkg.ml
before
Exception: Fl_package_base.No_such_package ("findlib", "").
```

Searching online I found [this
issue](https://github.com/ocaml-community/utop/issues/112) which mentions the
`OCAML_TOPLEVEL_PATH` variable. On my Windows machine this variable is set to
`C:\Users\s\AppData\Local\opam\default\lib\toplevel`. That path refers to a
folder and inside that folder is a file named `topfind` with some OCaml code in
it. I'm not too familiar with the `#use` directive in OCaml but it seems to
behave similarly to `#include` in C; acting as though the contents of the
specified file replaced the occurrence of `#use <file>`.

Some of the code in `topfind` makes calls to the `findlib` library (part of the
`ocamlfind` package) which is generally concerned with mapping library names to
files containing compiled OCaml modules. The `ocamlfind` package installs a file
named `findlib.conf` containing some metadata about library locations within an
Opam switch. On my Windows machine this file was at `C:\Users\s\AppData\Local\opam\default\lib\findlib.conf`
and its contents was:
```
destdir="C:\\Users\\s\\AppData\\Local\\opam\\default\\lib"
path="C:\\Users\\s\\AppData\\Local\\opam\\default/lib/ocaml:C:\\Users\\s\\AppData\\Local\\opam\\default\\lib"
ocamlc="ocamlc.opt"
ocamlopt="ocamlopt.opt"
ocamldep="ocamldep.opt"
ocamldoc="ocamldoc.opt"
```

The `path` field looks suspicious, since the paths on Windows begin with `C:`,
but it looks like a colon character is also being used to separate the two paths.
Recall that on Windows it's common to use a semicolon to separate paths, rather than a colon
as is typically seen on Unix. As an experiment I manually replaced the colon
with a semicolon in `findlib.conf` and suddenly I could successfully build
`topkg` both on its own and as a dependency for `llama`:
```
PS C:\Users\s\llama> opam install . --deps-only
[llama_core.dev] synchronised (no changes)
[llama.dev] synchronised (no changes)
[llama_interactive.dev] synchronised (no changes)
[llama_midi.dev] synchronised (no changes)
[llama_tests.dev] synchronised (no changes)
The following actions will be performed:
=== install 2 packages
  ∗ topkg 1.0.8 (pinned) [required by tsdl]
  ∗ tsdl  1.1.0          [required by llama_interactive]

Proceed with ∗ 2 installations? [y/n] y

<><> Processing actions <><><><><><><><><><><><><><><><><><><><><><><><><><>  🐫
⬇ retrieved tsdl.1.1.0  (cached)
∗ installed topkg.1.0.8
∗ installed tsdl.1.1.0
Done.
```

So the problem wasn't with `topkg` after all but rather with `ocamlfind`. The
`ocamlfind` package is a bit old-school, building with a `configure` script
and `Makefile`. I'm guessing somewhere in there it fails to detect that it's
running on Windows, at least in Msys2 environments, and uses the wrong path
delimiter for paths in `findlib.conf`.

With that problem adequately worked around we should finally be able to run a
graphical example:
```
PS C:\Users\s\llama> dune exec .\examples\interactive.exe
File "examples/dune", line 44, characters 14-25:
44 |  (public_name interactive)
                   ^^^^^^^^^^^
C:/msys64/mingw64/bin/../lib/gcc/x86_64-w64-mingw32/14.2.0/../../../../x86_64-w64-mingw32/bin/ld.exe: C:/msys64/mingw64/bin/../lib/libmingw32.a(lib64_libmingw32_a-ucrtexewin.o): in function `wmain':
C:/M/B/src/mingw-w64/mingw-w64-crt/crt/crtexewin.c:67:(.text+0xb5): undefined reference to `wWinMain'
collect2.exe: error: ld returned 1 exit status
** Fatal error: Error during linking

File "caml_startup", line 1:
Error: Error during linking (exit code 2)
```

Not quite yet!

## Fixing the linker error

Linker errors like this usually mean that we're not linking against a certain
shared library, in this case whichever shared library would define the symbol
`wWinMain`. I assumed the `tsdl` library would have taken care of making sure
the appropriate linker flags were passed. It works fine on Linux and MacOS but
maybe there are some Windows-specific flags it's leaving out.

`pkgconf` should be able to tell us what flags are necessary to use a certain
library. I assume whatever flags are necessary for SDL2 should suffice here:
```
PS C:\Users\s\llama> pkgconf.exe sdl2 --libs
-LC:/msys64/mingw64/bin/../lib -lmingw32 -mwindows -lSDL2main -lSDL2
```

I'll start by adding these to the `library_flags` field of the `executable`
stanza of the example I'm trying to run:
```dune
(executable
 (public_name interactive)
 (modules interactive)
 (package llama_interactive)
 (libraries llama_interactive keyboard_helper)
 (link_flags -LC:/msys64/mingw64/bin/../lib -lmingw32 -mwindows -lSDL2main -lSDL2))
```

Building the example:
```
PS C:\Users\s\llama> dune build .\examples\interactive.exe
File "examples/dune", line 44, characters 14-25:
44 |  (public_name interactive)
                   ^^^^^^^^^^^
C:\Users\s\AppData\Local\opam\default\bin\ocamlopt.opt.exe: unknown option '-LC:/msys64/mingw64/bin/../lib'.
Usage: ocamlopt <options> <files>
Try 'ocamlopt --help' for more information.
```

Turns out you can't pass raw linker flags to the OCaml compiler like that.
In the
[past](@/blog/frustrating-interactions-with-the-ocaml-ecosystem-while-developing-a-synthesizer-library/index.md#linking-against-os-specific-native-libraries-with-dune-is-hard)
I've had success wrapping the linker flags in `-cclib "<flags>"` so I tried
that:
```dune
(link_flags -cclib "-LC:/msys64/mingw64/bin/../lib -lmingw32 -mwindows -lSDL2main -lSDL2")
```

And the error message changed which is often a sign of progress:
```
PS C:\Users\s\llama> dune build .\examples\interactive.exe
File "examples/dune", line 44, characters 14-25:
44 |  (public_name interactive)
                   ^^^^^^^^^^^
flexlink: unknown option '-mwindows'.
FlexDLL version 0.44

Usage:
  flexlink -o <result.dll/exe> file1.obj file2.obj ... -- <extra linker arguments>

  -o                  Choose the name of the output file
  -exe                Link the main program as an exe file
  -maindll            Link the main program as a dll file
  -noflexdllobj       Do not add the Flexdll runtime object (for exe)
  -noentry            Do not use the Flexdll entry point (for dll)
  -noexport           Do not export any symbol
  -norelrelocs        Ensure that no relative relocation is generated
  -base               Specify base address (Win64 only)
  -pthread            Pass -pthread to the linker
  -I <dir>            Add a directory where to search for files
  -L <dir>            Add a directory where to search for files
  -l <lib>            Library file
  -chain {msvc|msvc64|cygwin64|mingw|mingw64|gnat|gnat64|ld}
                      Choose which linker to use
  -use-linker <cmd>   Choose an alternative linker to use
  -use-mt <cmd>       Choose an alternative manifest tool to use
  -x64                (Deprecated)
  -defaultlib <obj>   External object (no export, no import)
  -save-temps         Do not delete intermediate files
  -implib             Do not delete the generated import library
  -outdef             Produce a def file with exported symbols
  -v                  Increment verbosity (can be repeated)
  -show-exports       Show exported symbols
  -show-imports       Show imported symbols
  -dry                Show the linker command line, do not actually run it
  -dump               Only dump the content of object files
  -patch              Only patch the target image (to be used with -stack)
  -nocygpath          Do not use cygpath (default for msvc, mingw)
  -cygpath            Use cygpath (default for cygwin)
  -no-merge-manifest  Do not merge the manifest (takes precedence over -merge-manifest)
  -merge-manifest     Merge manifest to the dll or exe (if generated)
  -real-manifest      Use the generated manifest (default behavior)
  -default-manifest   Use the default manifest (default.manifest/default_amd64.manifest)
  -export <sym>       Explicitly export a symbol
  -noreexport         Do not reexport symbols imported from import libraries
  -where              Show the FlexDLL directory
  -nounderscore       Normal symbols are not prefixed with an underscore
  -nodefaultlibs      Do not assume any default library
  -builtin            Use built-in linker to produce a dll
  -explain            Explain why library objects are linked
  -subsystem <id>     Set the subsystem (default: console)
  -custom-crt         Use a custom CRT
  -stack <int>        Set the stack reserve in the resulting image
  -link <option>      Next argument is passed verbatim to the linker
  -g                  (Ignored)
  -D <symbol>         (Ignored)
  -U <symbol>         (Ignored)
  --                  Following arguments are passed verbatim to the linker
  -version            Print linker version and FlexDLL directory and exit
  -vnum               Print linker version number and exit
  -help               Display this list of options
  --help              Display this list of options

Notes:
* The -I, -l and -L options do not need to be separated from their argument.
* An option like /linkXXX is an abbrevation for '-link XXX'.
* An option like -Wl,-XXX is an abbreviation for '-link -XXX'.
* FlexDLL's object files are searched by default in the same directory as
  flexlink, or in the directory given by the environment variable FLEXDIR
  if it is defined.
* Extra argument can be passed in the environment variable FLEXLINKFLAGS.

Homepage: https://github.com/ocaml/flexdll
File "caml_startup", line 1:
Error: Error during linking (exit code 2)
```

Getting rid of the `-mwindows` argument just gets us back to the original linker
error, so I assume it's important.

Reading more about `wMinMain` and it looks like I was wrong assuming that we
need to pass additional linker flags to tell the linker which shared library to
look in. Rather, the linker was looking for `wWinMain` as the entry point to the
program called by the C runtime's initialization code. I have to define it
myself. Perhaps OCaml assumes that the entry point will be named `WinMain` which
seems to be the entry point for Windows C programs that don't accept unicode
arguments whereas `wWinMain` is used when programs _do_ accept unicode
arguments (I think the "w" stands for "wide" as in "wide character" since
unicode characters can be wider than a byte). For some reason depending on SDL
seems to require that the entry point be `wWinMain`. I don't understand why.

Following [these
instructions](https://dune.readthedocs.io/en/latest/howto/override-default-entrypoint.html)
I defined a custom entry point in some C code.
For starters it's stolen from [here](https://sourceforge.net/p/mingw-w64/wiki2/Unicode%20apps/):
```c
#include <wchar.h>
#include <stdio.h>

int
wWinMain (int argc, wchar_t **argv)
{
  wprintf(L"Hello\n");
  return 0;
}
```

And in the `dune` file:
```dune
(executable
 (public_name interactive)
 (modules interactive)
 (package llama_interactive)
 (libraries llama_interactive keyboard_helper)
 (foreign_stubs
  (language c)
  (names interactive_win)))
```

Testing it out:
```
PS C:\Users\s\llama> dune exec .\examples\interactive.exe
Done: 49% (96/194, 98 left) (jobs: 0)Hello
```

Nice, the linker error is gone. Obviously this just prints "Hello" and exits
without actually calling into any OCaml code. Now I just need to change the C
code to call into the original OCaml code:
```c
#include <wchar.h>
#include <stdio.h>

#define CAML_INTERNALS
#include "caml/misc.h"
#include "caml/mlvalues.h"
#include "caml/sys.h"
#include "caml/callback.h"

int
wWinMain (int argc, wchar_t **argv)
{
  caml_main(argv);
  caml_do_exit(0);
  return 0;
}
```

But then when I ran the example nothing happened. Adding print statements to the
OCaml code didn't have any effect, and it looks like the program is exiting
somewhere inside `caml_main` with no error message.

Powershell provides exit codes of programs in the `$LastExitCode` variable:
```
PS C:\Users\s\llama> dune exec .\examples\interactive.exe
Done: 100% (194/194, 0 left) (jobs: 0)
PS C:\Users\s\llama> $LastExitCode
-1073741819
```

Converting to a 32-bit unsigned int assuming 2's complement this is `0xC0000005`
which corresponds to an "Access Violation" which is similar to a segmentation
fault in the Unix world, so probably I'm doing something wrong with pointers.

For inspiration I took a look at the real OCaml `main` function defined
[here](https://github.com/ocaml/ocaml/blob/trunk/runtime/main.c).
There's some Windows-specific parts that I was missing which I added.
I also realized I was using the wrong type for my `wWinMain` function so I
changed its arguments based on some Microsoft documentation I found. This meant
I needed to convert the Windows way of representing command-line arguments into
the Unix-style `argv` which OCaml presumably expects. I was running out of time so
instead I just generated a fake value for `argv`. Here's the C program I ended up with:
```C
#include <wchar.h>
#include <stdio.h>

#define CAML_INTERNALS
#include "caml/misc.h"
#include "caml/mlvalues.h"
#include "caml/sys.h"
#include "caml/osdeps.h"
#include "caml/callback.h"
#include <windows.h>

int WINAPI wWinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, PWSTR pCmdLine, int nCmdShow) {
  // fake argv for now since I don't know how to convert windows arguments to argv
  char_os argv0[] = { (unsigned short int)'x', 0 };
  char_os** argv = malloc(sizeof(char_os*) * 2);
  argv[0] = argv0;
  argv[1] = NULL; // ocaml probably uses a null terminator for its argv since there's no argc?
  caml_main(argv);
  caml_do_exit(0);
  return 0;
}
```

And finally it works!

<iframe width="560" height="315" src="https://www.youtube.com/embed/vS2qgKDK7y4?si=FNlN2OBef58aj_Nw" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

Well it mostly works. There's about a second of input latency which isn't
there when I run it on Linux or MacOS, but at least it can now open a window and
get input from the keyboard and mouse.

That brings us to the end of the 2-day period I've allocated for working on
this project. Clearly `llama` is not ready for use in "production" on Windows but at
least I now know that it's technically possible to make it work. All the
problems I worked around the past 2 days are not problems with `llama` itself
but various other packages in the OCaml ecosystem (at least `conf-ao` calling the wrong
`pkg-config` executable and missing Msys2 `depexts` and `ocamlfind` using the
wrong path delimiters on Windows). I'll gradually work on upstreaming fixes to
these problems but in the meantime I'll be playing my synthesizer on Unix
machines only.
