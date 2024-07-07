+++
title = "In Homogeneous Coordinates Addition is Multiplication"
date = 2020-08-19
slug = "in-homogeneous-coordinates-addition-is-multiplication"
+++

Yesterday I wrote about [Homogeneous Coordinates](@/daily/homogeneous-coordinates/index.md).
I used 3D perspective projection as a motivating example, but I should have used _translation_.
To translate a point represented by a Cartesian coordinate, one simply adds the intended
delta in each dimension to the corresponding component of the coordinate. This can be done using vector addition.

In [yesterday's post](@/daily/homogeneous-coordinates/index.md) I explained why it's valuable to express as much as
possible using matrix
multiplication. Homogeneous coordinates let you express vector addition as matrix multiplication.
Convince yourself that this can't be done using Cartesian coordinates.
Consider a 1-dimensional coordinate (just a number) `x`. Can you name a constant `a` such that for all `x`,
`x * a == x + 1`? Similarly, given a vector 'v' representing a point in a particular dimensional space, you can't
construct a matrix 'M' such that `M * v == C + v` for some constant vector `C`.

Using homogeneous coordinates it's possible to add vectors through matrix multiplication.
The matrix that adds the vector `[a, b, c]` to all vectors `[x, y, z]` is:
```
|-       -| |- -|   |-     -|
| 1 0 0 a | | x |   | x + a |
| 0 1 0 b | | y | = | y + b |
| 0 0 1 c | | z |   | z + c |
| 0 0 0 1 | | 1 |   |   1   |
|-       -| |- -|   |-     -|
```

We added a 4th element to the vector. Above its value is `1`, but in general it's treated as a scale factor `w`.
We might end up wanting to translate a vector with a scale factor of (say) 2. Observe that in the matrix
multiplication above, the scale factor would be multiplied by `a`, `b`, and `c`, and the scale factor of
the result will be the scale factor of the vector we're translating. When converting back to Cartesian coordinates,
divide everything by the scale factor, then remove it.
