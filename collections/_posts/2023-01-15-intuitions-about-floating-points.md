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

A single precision floating point is represented with 32 bits, like this:

{% image bits.svg %}

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

<!--more-->

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

Because we treat the fraction component as the part of a number to the
right of a decimal place, it can only take on values between 0 (all bits are 0)
and 0.999 (all bits are 1 - specifically this is 1 - 2^-23).

To get a feel for this, start by setting the exponent to 0. The lowest number we
can represent is 1, when the fractional part is 0. The highest number is
1.999, when the fractional part is 0.999. What about the second lowest
number? This would be when all the bits of the fraction are 0 except for the
least significant bit, which has the value 2^-23, so the second-lowest number is
1 + 2^-23. By the same merit, the third-lowest number is 1 + (2 * 2^-23). All
the floating point values between 1 and 2 are separated by 2^-23.

There are 23 bits in the fraction so it can take on 2^23 = 8,388,608 different
values. These values are evenly spaced within the range, so as we just saw when
the exponent is 0, the range is from 1 to 1.999 and so
subsequent values are 2^-23 apart from one another.

What about when the exponent is 1? The lowest number is now 2 and the highest is 3.999.
The 2^23 fraction values are evenly spread out across this range. Since this
range is twice as large as it was when the exponent was 0, subsequent values are
2^-22 apart from one another.

When the exponent is 2 the values range from 4 to 7.999 and the difference
between consecutive values is 2^-21.

Here's a chart that shows the numeric values of floating points with exponents 0
to 3:

{% image graph.svg %}

This pattern also holds with negative exponents. When the exponent is -1 the
lowest value is 0.5 and the highest is 0.999, and numbers are spaced apart by
2^-24.

Finally, when the exponent is 23, values range from 2^23 = 8,388,608 to 2^24 = 16,777,216,
and the difference between consecutive values is 1. When the exponent is 24,
consecutive numbers are separated by 2. Since each time the exponent increments,
the gaps between numbers doubles (thus remaining even), there are no odd floating point values greater
than 16,777,216.
