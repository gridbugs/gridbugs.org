+++
title = "Updating Library Dependencies"
date = 2020-11-01
slug = "updating-library-dependencies"
+++

Every so often I update the deps of my rust libraries.  This is so that crates
depending on my libraries and also my libraries' dependencies don't end up
depending on multiple different versions of the same thing. Doing so wouldn't
cause any problems in practice; cargo can handle this situation perfectly fine,
but it adds to build/download times and binary sizes.

Today I updated the [wfc](https://github.com/gridbugs/wfc). The only change
required by the core [wfc](https://crates.io/crates/wfc) crate was bumping
[hashbrown](https://crates.io/crates/hashbrown) from 0.7 to 0.9.
I also updated the examples [wfc_image](https://crates.io/crates/wfc_image) crate
to render animations with [pixels](https://crates.io/crates/pixels) instead
of [pixel_grid](https://crates.io/crates/pixel_grid), and to parse arguments with
[meap](https://crates.io/crates/meap) instead of [simon](https://crates.io/crates/simon).

