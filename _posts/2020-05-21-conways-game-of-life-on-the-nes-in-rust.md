---
layout: post
title: "Conway's Game of Life on the NES in Rust"
date: 2020-05-21 16:00:00 +1000
categories: procgen emulation
permalink: /conways-game-of-life-on-the-nes-in-rust/
excerpt_separator: <!--more-->
---

<style>
.nes-screenshot img {
    width: 512px;
    height: 480px;
    image-rendering: crisp-edges;
    image-rendering: pixelated;
}
.short-table tr {
    line-height: 0px;
}
</style>

This post is about a Rust program...

```bash
$ cargo install conway-nes
```

...that prints out a NES binary...

```bash
$ conway-nes > life.nes
```

...that runs Conway's Game of Life!

```bash
$ fceux life.nes    # fceux is a NES emulator
```
<div class="nes-screenshot">
{% image demo.webp %}
</div>

Press any button on your controller to restart the demo from a randomized state.

<!--more-->


