+++
title = "Sound on OCaml on Windows"
date = 2025-05-29
path = "sound-on-ocaml-on-windows"

[taxonomies]
tags = ["windows", "ocaml"]
+++

This post will chronicle my attempt to use OCaml to play generated audio
samples on a Windows PC. This is part of my work on the [llama synthesizer
library](https://github.com/gridbugs/llama/), where I've been replacing the
low-level audio logic formerly written in Rust (with
[cpal](https://crates.io/crates/cpal)) with OCaml to simplify the build process
and development experience. I've written down some of my complaints about
the developer experience working on llama in a [previous
post](@/blog/frustrating-interactions-with-the-ocaml-ecosystem-while-developing-a-synthesizer-library/index.md)
and some of those difficulties came from complications working with Rust/OCaml
interop.

I have a proof-of-concept version of llama based on
[OCaml's libao bindings](https://opam.ocaml.org/packages/ao/) which seems to
work on various unixes. Libao claims to support Windows but I haven't figured
out how to install it on Windows so I might experiment with some alternatives in
this post.


## Install Opam

For the purposes of this post I'll set up an entire OCaml environment on Windows
from scratch. I'll use PowerShell 7.5.1 as my shell for this post and try to use
as many recommended settings as possible.

We'll install Opam with WinGet. I've had some difficulty setting up WinGet in
the past and written about setting it up properly in a [previous
post](@/blog/setting-up-winget-for-the-first-time/index.md).

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

Allowing Opam to manage its own Cygwin installation results Cygwin being
installed to `C:\Users\s\AppData\Local\opam\.cygwin`. This might come in handy
to know if we ever need to manually install a Cygwin package, though hopefully
Opam can take care of installing any packages via `depexts`.

Bear in mind that Opam's initialization can take 15 minutes or so on Windows
with most of the time spent building the OCaml compiler.


## Choosing a sound library

Now we need to choose a library in the Opam repository that can give us access
to the sound card. Ideally we would use a library with a depext tailored to
Windows, as that way Opam can take care of installing any system dependencies
via Cygwin. I've already started implementing llama on top of libao, but its
depexts don't look promising:
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

That's more promising as there's a depext that gets chosen on `{os = "win32" &
os-distribution = "cygwinports"}`. It's a little concerning that the name of the
`os-distribution` is "cygwinports" and not just "cygwin". I've never come across
cygwinports before, but maybe it won't matter. The next step is to see if
installing `conf-portaudio` with Opam causes the right depext to be installed
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
...we can see that Opam has detected that some depexts need to be installed, but
only `pkgconf` and not `portaudio` are on the list. To help understand why, look
at the depexts of the `conf-pkg-config` package:
```
PS C:\Users\s> opam show conf-pkg-config
...
depexts     ["pkg-config"] {os-family = "debian" | os-family = "ubuntu"}
...
            ["system:pkgconf"] {os = "win32" & os-distribution = "cygwinports"}
            ["pkgconf"] {os-distribution = "cygwin"}

```

So it stands to reason that my initial concerns about cygwinports were merited.

The second issue is that even though Opam install `pkgconf` with Cygwin, the
`pkg-config` executable couldn't be found while installing the `conf-portaudio`
package. Remember earlier we located the Cygwin installation that Opam will be
managing. Looking in `C:\Users\s\AppData\Local\opam\.cygwin\root\bin`, and there
is a program `pkgconf.exe`, but not a `pkg-config.exe`. It looks like at some
point `pkg-config` was renamed to `pkgconf` and this change is slowly trickling
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
running while I went to run some errands and when I got back it was still hung.

I cancelled the hung operation. Despite not completing it did have the side
effect of creating an Opam "pin" for the `conf-portaudio` package, as evidenced
by:
```
PS C:\Users\s> opam pin list
conf-portaudio.1  (uninstalled)  rsync  file://C:/Users/s
```

Before proceeding I wanted to undo the pin:
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

Hmm. The `Application Data\Application Data\Application Data` component of the path looks suspicious. Digging deeper:
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

Yeh that's my home directory. It appears I unwittingly pinned the
`conf-portaudio` package to my entire home directory, and since opam installs
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

That's almost `16GB` of recursive copies of my home directory. This command
ended up failing due to permission problems so I had to delete it from the
explorer UI instead.

Now that I manually deleted that folder, removing the pin works:
```
PS C:\Users\s> opam pin remove conf-portaudio
Ok, conf-portaudio is no longer pinned to file://C:/Users/s (version 1)
```

Now let's try again, but this time from a new directory with only the
`conf-portaudio.opam` file. I copied it to a new folder and modified its build
command to run `pkgconf` rather than `pkg-config`. Rather than installing it
directly, I'll explicitly pin it first to test that my local change has had an
effect:
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

This created an Opam "pin" which stores some state somewhere instructing Opam to
use my custom version of the `conf-portaudio` package. To test that this worked,
run:
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
depexts don't contain a case for `os-distribution = "cygwin"` (only `os-distribution = "cygwinports"`).

Next step is to fix the `conf-portaudio` depexts so they install the appropriate
package on Cygwin. I added this line to the `depexts` section in `conf-portaudio.opam`:
```
    ["portaudio"] {os = "win32" & os-distribution = "cygwin"}
```

I needed to run `opam pin .` again to get Opam to update its copy of the custom
version of this package's metadata.

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
this package works then I might be able to use llama on Windows unmodified,
since it's currently based on libao.

Repeating the steps above to created a custom version of the `conf-ao` package -
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

Reading more about the `mingw64-x86_64-*` package sin the Cygwin repo and it
doesn't look like I'll easily be able to mix them with other Cygwin packages,
which could make it tricky to proceed with Opam in its current configuration
where it manages a Cygwin environment for us.

An alternative package manager for Windows is "msys2". Opam claim to support
msys2 though it doesn't look like it can install packages manually. The next
step will be to try setting up an msys2 environment and a new Opam installation
which uses it.

## Setting up Opam again, with msys2

Firstly I deleted `C:\Users\s\AppData\Local\opam` to get a fresh start.

I installed msys2 from the installer at [its website](https://www.msys2.org/),
which created a directory `C:\msys64` which will be the root directory of our
msys2 environment.

Then I reran `opam init` to create a new Opam environment, this time selecting
the second option for obtaining Unix tools `Use an existing Cygwin/MSYS2
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
other essential tools into the msys2 environment at `C:\msys64`.
