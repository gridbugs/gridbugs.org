+++
title = "Homogeneous Coordinates"
date = 2020-08-18
slug = "homogeneous-coordinates"
+++

Matrix multiplication is awesome. If you want to do a sequence of operations on
a bunch of vertices, by expressing each operation as a matrix multiplication,
you can use the fact that matrix multiplication is associative to "compile"
all the matrices into a single matrix, by multiplying them together.
Then, just multiply the result by each vertex.
Your code will be more efficient because the per-vertex operations are replaced
with a single matrix multiplication.
You may find your code becomes easier to read too, as a sequence of custom
vector operations are replaced by a single matrix multiplication per vector.

To get the full benefit of this, everything you do with vectors should be replaced
by a single sequential chain of matrix multiplications.

Homogeneous coordinates let you express more operations as matrix multiplications.
In a homogeneous coordinate system, each vector gets an additional element. E.g.
a 3D point is now made up of 4 numbers, rather than 3, as would be the case in
a Cartesian coordinate system. When converting from Cartesian to homogeneous
coordinates, choose 1 as the additional element. When converting back, divide
each element by the value of the extra element, then remove the extra element.

For a motivating example, consider perspective projection. That's the process of
taking a point in 3D space relative to a camera, and determining the coordinate
of the pixel in the image that the camera sees. It's commonly used in video games
to convert 3D points in the world of the game into pixel coordinates that get
drawn to the screen. To convert camera relative point `[x, y, z]` into a pixel
coordinate `[u, v]`, where x+ is right, y+ is upwards, z+ is away from the camera,
and u+ is to the right on you screen, and v+ is upwards on your screen, and the
point `[0, 0]` is the centre of your screen:
```
u = x * cotan(fov_x / 2) / z
v = y * cotan(fov_y / 2) / z
```
Here, `fov_x` and `fov_y` are the horizontal and vertical field of view of the
imaginary camera taking the photo.
The intuition behind this is that things move towards the centre of your vision
as they move away from you due to perspective, so dividing by `z` moves the screen
coordinates towarsd the centre of the screen (remember `[0, 0]` is the centre of the screen).

The above logic works, but computing perspective projection is often part of a sequence
of operations a game (say) will do on each vertex (each point in the world) each frame.
To get the full benefit of chaining together matrix multiplications, it would be useful
if the above logic could be expressed as a matrix multiplication too.
A first attempt might be:
```
|-                                  -|  |-     -|   |-                        -|
| cotan(fov_x / 2)          0        |  | x / z | = | x * cotan(fov_x / 2) / z |
|         0         cotan(fov_y / 2) |  | y / z |   | y * cotan(fov_y / 2) / z |
|-                                  -|  |-     -|   |-                        -|
```

This would work, but requires pre-processing each point, turning `[x, y, z]` into `[x/z, y/z]`.
This pre-processing is not a matrix multiplication, so messes up our pipeline of matrix
multiplications.

Enter homogeneous coordinates:

```
|-                                      -|  |- -|   |-                    -|
| cotan(fov_x / 2)          0         0  |  | x |   | x * cotan(fov_x / 2) |
|         0         cotan(fov_y / 2)  0  |  | y | = | y * cotan(fov_y / 2) |
|         0                 0         1  |  | z |   |          z           |
|-                                      -|  |- -|   |-                    -|
```

When using this operation in the context of computer graphics, it's likely
part of a sequence of matrix multiplications that convert 3D points in the world
into 2D points on a screen. The result of the above multiplication is a 3D vector.
To compute the pixel coordinate `[u, v]` from the output, divide each component
by `z` (the extra component), and then remove the `z` component altogether.

A caveat to the above is that the `[x, y, z]` vector is not itself an homogeneous
coordinate, but we treat the result of the multiplication as an homogeneous coordinate.
In practice, it's likely that the vector on the right-hand-side of the multiplication
will have an additional component, and the matrix on the left-hand-side will have an
additional row and column.
