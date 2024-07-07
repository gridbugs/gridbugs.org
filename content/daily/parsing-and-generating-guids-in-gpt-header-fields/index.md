+++
title = "Parsing and Generating GUIDs in GPT Header Fields"
date = 2020-10-27
slug = "parsing-and-generating-guids-in-gpt-header-fields"
+++

A while back I wrote about
[the binary format of GUIDs in GPT headers](@/daily/formatting-guids-in-gpt-header-fields/index.md).
Based on some examples I reverse-engineered conversion between a 128-bit integer on disk, and a UUID's
fields.

I've likely duplicated some logic from [winapi](https://crates.io/crates/winapi).
In the [uuid](https://crates.io/crates/uuid) crate, a feature can be enabled to include code
for converting UUIDs into GUIDs (defined in winapi), but it only works when the target
is windows (a requirement of winapi).
