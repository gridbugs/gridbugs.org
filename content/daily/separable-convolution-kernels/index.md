+++
title = "Separable Convolution Kernels"
date = 2020-09-21
slug = "separable-convolution-kernels"
+++

In the field of image processing, _convolution_ refers to an operation which takes an image (a 2d array of pixels)
and computes a new image of the same dimensions by considering each pixel of the input image, and a relatively
small number of nearby pixels, and computing a weighted sum of their values, independently for each channel.
The pixel channel values in the resulting image are these weight sums.
Some typical applications of convolution are blurring and edge sharpening.

The choices of which nearby pixels to consider, and what weights to use in the weighted sum, are dictated by
a _convolution kernel_, which takes the form of a 2d array of real numbers.
To compute the result of a convolution of a single pixel channel value, centre the kernel on that pixel,
with the "cells" of the kernel aligned to the pixels of the image,
and for each cell of the kernel, multiply the value in the cell with the value in the pixel underneath.
Add up the results.
Convolving an entire image now looks like sliding the kernel over every pixel in the image and computing
all weighted sums. If the kernel is partially off the edge, it's common to imagine the final row/column
of the image continuing forever in all directions (there are alternatives, but they're out of scope here).

A _separable convolution kernel_ can be expressed as a 1d array. The convolution process now looks a little
different. Rather than sliding a rectangular kernel (a 2d array) around an image, instead, slide a
horizontal strip (a 1d array), and calculate all weighted sums as before. This gives you an intermediate
image of the same size as the input image. Now repeat the process taking the intermediate image as input,
only this time treat the 1d kernel as a _vertical_ strip.

Gaussian blurring is an example of a separable kernel. There is a NxN 2d array that can be convolved with
an image to apply a Gaussian blur effect, however there is also a N-length 1d array that can be convolved
twice as above. The benefit of using the 1d array is that the convolution can be done in `2*N*K*C` multiplications
for an image with `K` pixels and `C` channels, instead of `N*N*K*C` multiplications as would be required for
the 2d convolution.
