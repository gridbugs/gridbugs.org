---
layout: post
title: "Intuitions about Floating Points"
date: 2023-01-15
categories: programming
permalink: /intuitions-about-floating-points/
excerpt_separator: <!--more-->
---

Floating points are a way of representing numbers based on the idea that the
larger the magnitude of a number, the less we care about knowing its precise
value. This post will describe the representation of single-precision
floating points (specifically the "binary32" type defined in IEEE 754-2008)
and give an intuition for how precision is lost as values grow in magnitude.

Some handy questions that I won't answer here but after reading this page
you should be able to answer them yourself:
 - What's the result of subtracting the second largest floating point from the
   largest (finite) floating point?
 - At what point does the gap between subsequent floating points grow larger
   than 1?
 - How many floating point values are there between 0 and 1, 1 and 2, etc?

A single precision floating point is represented with 32 bits, like this:

{% image bits.svg %}

<!--more-->

It has 3 parts:
 - A sign bit. 1 is negative, 0 is positive. Unlike 2's complement integers,
   floating points are symmetrical in that the negation of all positive numbers
   can be represented and vice versa. The only effect of the sign bit is
   determining whether a number is positive or negative. It's not relevant to
   the discussion of precision, so for the rest of this post I'll talk about
   positive numbers only.
 - An 8-bit "exponent". This is an integer that will determine the magnitude of
   the floating point. It's an unsigned integer, biased by -127. That is, 
   its value ranges from -126 (literally 1) to 127
   (literally 254). The literal value 127 represents an exponent of 0.
   The literal values 0 and 255 are used for special floating
   point values and won't be discussed here. I'm going to talk about the biased
   value of this field for the rest of this post rather than the literal value.
   That is, I'll treat the exponent is an integer between -126 and 127 inclusive.
 - A 23-bit "fraction". Treat this as the part of a number to the right of a
   decimal point. E.g. in the binary number 1.101, "101" is the fractional part,
   and has the value 0.5 + 0.125 = 0.625.

The numeric value of a floating point is:
```
(2 ^ exponent) * (1 + fraction)
```
That is, raise 2 to the power of the exponent, then multiply it by the fraction
component with one added to it.

So for example, if the exponent is 5, and the fraction is (in decimal) 0.5652,
the value of the floating point is:
```
  (2 ^ 5) * (1 + 0.5652)
= 32 * 1.5652
= 50.0864
```


{% image graph.svg %}
