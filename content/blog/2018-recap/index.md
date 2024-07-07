+++
title = "2018 Recap"
date = 2018-12-30
path = "2018-recap"

[taxonomies]
tags = ["meta"]
+++

Here's a summary of the things I made this year - mostly libraries and
experiments relating to games and computer graphics. Many of these projects
deserve a dedicated post explaining them in further depth, and I intend to
elaborate further in future posts. All these projets are written in rust.
Headings link to the projects on github. All animations are realtime screen
recordings.

## [Wave Function Collapse Library](https://github.com/gridbugs/wfc)

![wfc-cat.png](wfc-cat.png)

Wave Function Collapse is a procedural generation algorithm which takes as input
a list of tiles, rules describing which tiles may appear adjacent to one another
in the output, and the relative frequency with which each tile should appear in
the output. A common way of specifying this input is in the form of an example
image which looks similar to the desired output.

<!-- more -->

The image above was generated from this example:

![cat.png](cat.png)

I first read about WFC here: [mxgmn/WaveFunctionCollapse](https://github.com/mxgmn/WaveFunctionCollapse).
That page contains links to many other implementations and explanations of the algorithm.

Here's another example showing the order in which pixels are filled in using my
library:

![flowers animation](https://raw.githubusercontent.com/gridbugs/wfc/master/images/flowers-animate.gif)

The example image is below. Pixel colours in the animation are the probability-weighted-average of all the possible
colours that could end up in that position.

![flowers](https://raw.githubusercontent.com/gridbugs/wfc/master/images/flowers.png)

I'm still adding minor ergonomic improvements to the api to this library, but
it's currently in a working state, and I intend to use it to generate levels for
a roguelike soon.

## [Platform Game Physics](https://github.com/gridbugs/simple-physics)

This is an experiment to see how hard it is to make a simple physics engine,
appropriate for use in a platform game. The answer is: very!

{{ video_player_mp4_autoplay_loop(src="collisions.mp4") }}

It took a long time to get it to the state in the video above. There were many
rewrites, and hours of debugging the player (the red square) getting stuck on
the edges of platforms, or clipping through walls. The biggest challenge is
numbers! All representations of numbers have drawbacks:
 - floating points have floating point errors
 - rationals cause integer overflows when too much precision is required
 - fixed points are inaccurate (though this doesn't matter in practice, and I
   think fixed points win)
 - bignums cause dynamic allocation, which I try to avoid in code that runs
   every frame of a game

In the end, I ended up using double precision floating points. All the maths in
the collision detection system has to deal with the potential for floating point
errors, but after a painstaking process of testing and debugging, I finally have
something that works reliably.

That said, if I replace the double precision floats with single precision
floats, this happens:

{{ video_player_mp4_autoplay_loop(src="collisions-bad.mp4") }}

The biggest step forward I had while working on this was changing my
representation of polygons from using "regular" line segments as their edges, to
line segments that are only solid on one side (the side on the outside of the
polygon). This immediately solved many of
the problems I had where the player would get stuck on the edge of platforms, or
clip through the corners of platforms. I plan on posting more about this idea
(with diagrams!).

<a name="simon"></a>

## [Simon - an Arg Functor](https://github.com/gridbugs/simon)

This is a library for parsing command line arguments. All the command-line-parsing
rust libraries I could find were similar to [python argparse](https://docs.python.org/3/library/argparse.html),
in that one must register the arguments with a parser, then have the parser
parse the arguments into some structure, then extract the argument values from
that structure. There are two problems with this. Firstly, it's repetitive - the argument names must be specified when registering, **and**
extracting the arguments. Secondly, since rust is statically-typed, parsing all arguments into a common structure
forces arguments to be homogeneous.

Simon is a library of combinators, allowing one to compose basic parsers and
operations on parsed values, to form parsers of complex data. It's best
explained by example:

```rust
extern crate simon;

#[derive(Debug)]
struct Person {
    name: String,
    age: u32,
}

fn main() {
    let parser = simon::opt_required("n", "name", "your name", "NAME")
        .both(simon::opt("a", "age", "your age", "NUM").with_default(42))
        .map(|(name, age)| Person { name, age })
        .with_help_default();

    let person = parser.parse_env_default_or_exit();

    println!("{:?}", person);
}
```

Running it:
```
$ ./foo -a 26 -n Steve
Person { name: "Steve", age: 26 }

$ ./foo
name is required but not supplied

Usage: ./foo [options]

Options:
    -h, --help          print this help menu
    -n, --name NAME     your name
    -a, --age NUM       your age
```

It's named for the fact that it is an [applicative functor](http://learnyouahaskell.com/functors-applicative-functors-and-monoids#applicative-functors).
Thus far, every time I've explained the name, I've also had to explain the fact
that it's a joke. If you get the joke, you may be the first!

## [Per-Pixel Visible Area Detection](https://github.com/gridbugs/pixel-shadow-experiment/)

I was curious whether there was a way to accelerate 2d visible area detection
with a GPU. A common approach for 3d visible area detection is a depth buffer,
which keeps track of, for each pixel on the screen, how far the part of world
being drawn to that pixel is from the eye. Then you just draw all the objects in
the world, only updating depth and colour of a pixel if its depth is less than
the currently-buffered depth for that position. That is, things that are close
to the eye cover up things that are further from the eye.

The 2d situation I'm interested in is quite different. The eye is not behind the screen, but
is a point on the screen in 2d space, and each frame, you draw the entire scene,
rather than just the parts that the eye can see,
but you want the visible part of the scene to be rendered differently (brighter in this case).
Also the scene is a hand drawn black and white image - not a collection of
polygons, as is the case for most 3d graphics.

{{ video_player_mp4_autoplay_loop(src="shadows1.mp4") }}

The approach I used for this demo is each frame, test each pixel for visibility
by considering the
line segment between that pixel and the eye. If that line segment crosses any
opaque (black in this case) pixels, the pixel we're testing is not visible, so
render it a dark colour. If the line crosses no opaque pixels, then it is
visible, so render it a bright colour.
The test is conducted per pixel, and the result of the test of one pixel doesn't
affect the result for any other pixel, so this is trivially parallelised by
performing the test in the fragment shader that renders the pixels.

But how do we actually test if the line segment from a pixel to the eye crosses
any opaque pixels. We could scan along the line segment, one pixel at a time,
checking if we encounter an opaque pixel. For pixels far from the eye, there could be
many hundreds of pixels to traverse, and the traversal must happen once per pixel.
This is a lot of work to do each frame, and attempting it causes a noticeable drop in frame rate.

A key observation for improving
upon this is that most scenes have large areas of transparent pixels, and
sometimes large areas of opaque pixels too. Consider a low-resolution
image of the scene, constructed by combining square regions of pixels
of the original image into single pixels, averaging out their colours (remember,
white for transparent, black for opaque). In the low-res image,  white
and black pixels must correspond to entirely transparent and entirely opaque
squares of pixels in the original image!
We can still scan along the line segment one pixel at a time, but rather than
scanning on the original image, use a low resolution version of the
image (which has fewer pixels, so the scan will take fewer steps), only checking the
high resolution image when more detail is required.

{{ video_player_mp4_autoplay_loop(src="shadows2.mp4") }}

In this demo, I create several different resolution versions of the scene, and
start scanning in the lowest resolution. When a grey pixel is encountered, I
jump to the second lowest, and so on, until a black or white pixel is reached.
If it's black, we're done, and the pixel we're currently testing is not visible.
Otherwise, keep going! Also, jump back to a lower resolution image whenever
the scan at the current resolution crosses a pixel boundary in the next-lowest
resolution.

## [Prototty](https://github.com/gridbugs/prototty)

Prototty is a text UI library, similar to ncurses. It has several different
frontends, meaning that an application written using prototty can be run in a
terminal, a window, or a browser. It also provides an abstraction of a file
system, so browser and native applications can share the same logic for a
limited set of file operations.

[![prototty-tetris.png](prototty-tetris.png)](https://games.gridbugs.org/prototty-tetris/)

I used this library to make [Meters Below the Ground](#meters-below-the-ground).

## [Conway's Game of Life in an OpenGL Shader](https://github.com/gridbugs/life-gl)

For a bit of fun I decided to try implementing [Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life),
in such a way that the logic for determining if a cell lives or dies is
implemented in a fragment shader.

![life-gl](https://raw.githubusercontent.com/gridbugs/life-gl/master/images/screenshot1.png)

I've implemented Conway's Game of Life many times. [There's a javascript implementation embedded in an earlier post!](@/blog/cellular-automata-cave-generation/index.md) This implementation is
interesting because each frame, the per-cell computation is done on the GPU,
allowing for a great deal of parallelism. When a frame is rendered, it is also
rendered to a texture. When the following frame is rendered, it samples that
texture so it can check which cells are alive, and which are dead.

It was adding the command line options to this program that motivated me to make
[simon](#simon).

## Roguelike Utility Libraries

I made libraries providing common types and operations that I frequently find
myself using in roguelikes, as well as libraries implementing some of the
complicated algorithms that many roguelikes need.

### [Coord-2d](https://github.com/gridbugs/coord-2d)

Defines types and operations for 2d rectangle sizes and coordinates.

### [Grid-2d](https://github.com/gridbugs/grid-2d)

A generic 2d grid.

### [Direction](https://github.com/gridbugs/direction)

Defines compass direction types, and many operations for manipulating and
enumerating them.

### [Shadowcast](https://github.com/gridbugs/shadowcast)

A visible area detection algorithm, often referred to as "Recursive Shadowcast".
This library understands partially-transparent tiles, and can report the
visibility of edges and corners of tiles. This is necessary when implementing
lighting, as if a wall is lit from one side only, and the player is looking at
the other side, they shouldn't see that the wall is lit, even though they are
looking at a tile which the light touches.

[Read more about recursive shadowcast.](@/blog/visible-area-detection-recursive-shadowcast/index.md)

### [Grid-Search](https://github.com/gridbugs/grid-search)

Implementations of several algorithms for searching grids, including Dijkstra's
algorithm, A* and Jump Point Search.

### [Entity Store Code Gen](https://github.com/gridbugs/entity-store)

A code generator which takes a config file describing components and generates a rust module
containing a data structure suitable for storing the data in an entity component
system with those components.

## [Punchcards](https://github.com/gridbugs/punchcards)

This is a roguelike I started working on in early 2018, and streamed almost all
the development on twitch. It served as a great way to test the roguelike
libraries I'd been making, and I used it as a starting point for my 7drl
project.

![punchcards.png](punchcards.png)

After the 7drl I wanted a break from roguelikes and streaming for a while, and
so nothing further came of it.

## [Twitch](https://www.twitch.tv/gridbugs)

For a few months at the start of 2018 I streamed game development on twitch. I
was mostly working on prototty,  roguelike libraries, and punchcards.
The highlights were a member of chat spotting a bug in the code I was writing,
and someone contacting me on reddit with a list of suggestions for game
mechancis for punchcards. I also appreciate the words of support I got on the
night that I finished my 7drl project.

I would often have between 5 and 10 people watching at a time, and by the end of
my final 7drl stream I had over 100 follewers.

I stopped streaming after the 7drl because I wanted to take a break. I tried going back to it a few months ago,
but I don't have fibre internet at my house, and the only way I can reliably
stream is from my phone's internet, which is expensive, and still not that
reliable. When I live somewhere with better internet, maybe I'll restart the
stream.

<a name="meters-below-the-ground"></a>
## [Meters Below the Ground](https://github.com/gridbugs/meters-below-the-ground)

This was my entry into the 7drl this year. [It came
second!](http://roguetemple.com/7drl/2018/)

![7drl2018-success-screenshot.png](7drl2018-success-screenshot.png)

[Post announcing the game](@/projects/meters-below-the-ground/index.md)

[Start of development journal](@/devlogs/7drl2018-day1/index.md)

After reflecting on this, I no longer think that an entity component system is appropriate for representing the
types of games that I enjoy creating. The great thing about an ECS is how easy
it becomes to encode rich interractions between different systems and
components. Often interractions emerge that weren't even explicitly desired by
the developer, but which follow implicitly from other interractions.

This sounds like fun (and it is fun!), and emergent interractions are sometimes
what you want, especially when making a simulation, or simulation-like-game,
which many roguelikes are.

However my intention for Meters Below the Ground was a might tighter,
purposefully-designed experience, where all the interractions are there because
I planned them to be there. In the end I achieved this goal, but the ECS was
more of a hinderence than a help.

That's not to say that I'm dropping all ECS-related ideas completely.
For example the idea that game objects are collections of data that define their
properties is valuable outside of ECS, and I intend to continue representing
objects in this spirit.

I look forward to experimenting with a non-ECS roguelike engine in 2019.

## [Generating wall geometry from a grid map](https://github.com/gridbugs/walls-experiment)

I've been using opengl for several years now, but never rendered anything 3d.
To teach myself something about 3d graphics,
I made a tiny program which takes a text description of a wall map, like:

```
.......
.###.#.
.#.###.
.#.#.#.
.......

```

And renders a scene like:
![walls.png](walls.png)

It's not particularly impressive, but at least now I have something to build
upon when I want to experiment with something more complicated.

## [Quadtree Library](https://github.com/gridbugs/quadtree)

This is an unfinished implementation of quadtrees in rust. I had ambitions of
making a realtime 2d platform game (or at least the engine thereof), which I
still haven't done. I want to have a solid story for collision detection, and
fast collision detection relies on being able to enumerate all the things which
are near a particular thing (as it's infeasible to perform a collision test on
every pair of objects in the world). Quadtrees are a family of data structures
which divide a space into a hierarchy of smaller spaces. I intended to compare
several different incarnations of this idea, but got distracted after
implementing one. I even started a blog post explaining how quadtrees work, and
why they're useful, which I never finished. Maybe next year!

Enjoy this graphic which I made for the post!

![spatial-queries-with-quadtrees.png](spatial-queries-with-quadtrees.png)

I also made a [persistent quadtree library in ocaml](https://github.com/gridbugs/loose-quadtree-ocaml), to use for the aforementioned
blog post, with the idea being that I think ocaml beats rust as a language for humans
to communicate with other humans about computing ideas.

## In 2019...

The main change I will make is posting more to this blog. There are many items
in this page which deserve their own dedicated post going into more detail with
diagrams.

I also want to start a larger scale roguelike project to showcase my libraries
and experiment more with procedural generation.

Finally, I intend on entering the 7drl again this year, with the primary goal of
not getting burned out by the end!
