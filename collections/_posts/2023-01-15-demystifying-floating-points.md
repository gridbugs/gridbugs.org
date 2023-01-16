---
layout: post
title: "Demystifying Floating Points"
date: 2023-01-15
categories: programming
permalink: /demystifying-floating-points/
excerpt_separator: <!--more-->
---

Floating points are a way of representing numbers based on the idea that the
larger the magnitude of a number, the less we care about knowing its precise
value. If you're anything like me (until recently) you use floating points regularly in your code
with a rough understanding of what to expect, but don't understand the specifics
of what floats can and can't represent. For example what's the biggest floating
point, or the smallest positive floating point? Or how many times can you add
1.0 to a floating point before _something bad_ happens, and what is that
_something bad_? How many floating point values are there between 0 and 1? What
about between 1 and 2?

The answer to these questions is, of course, "it depends", so let's talk about a
specific floating point standard, the "binary32" type defined in IEEE 754-2008.
This is the commonly-found single-precision floating point type, which
backs the `f32` type in rust, and usually backs the `float` type in c
(though of course technically this is left unspecified).
From now on this this post, I will refer to this type as simply "float".

Here's what a float can represent: 
 - all powers of 2 from 2^-126 to 2^127
 - __for each consecutive pair of powers of 2, there are 8,388,607 (that's 2^23 - 1)
   additional numbers, evenly spaced apart__
 - zero
 - infinity
 - negative versions of all of the above

The second point is the most important for understanding floating points. __Each
successive pair of powers of 2 has 2^23 - 1 floating point values evenly spread
out between them.__
There are 2^23 - 1 floats between 0.125 and 0.25, between 1 and 2, between 1024
and 2048, and between 8,388,608 (2^23) and 16,777,216 (2^24). As the numeric
range between consecutive powers of 2 increases, the number of floats between
them stays the same at 2^23 - 1; the floats just get more spread out.
This is the reason that values with lower
magnitudes can be more precisely represented with floating points.

Some implications of this:
 - in between 1 and 2, consecutive float values are 2^-23 apart from one
   another
 - in between 2 and 4, consecutive float values are 2^-22 apart from another
 - in between 8,388,608 (2^23) and 16,777,216 (2^24), consecutive float values
   are 1 apart from one another
 - for each power of 2, there are 8,388,608 (2^23) floats (1 for the power of 2,
   and 2^23 - 1 between (exclusive) the power of 2 and the next power of 2)
 - the number of positive floats less than 1 is 126 x 2^23 = 1,056,964,608
   - there are 126 powers of 2 less than 1
 - the number of positive floats greater than or equal to 1 is 128 x 2^23 = 1,073,741,824
   - there are 128 powers of 2 greater than or equal to 1 (including 2^0 = 1)
 - all floats above 8,388,608 (2^23) are integers
 - all floats above 16,777,216 (2^24) are even
 - if you attempt to add 1 to 16,777,216 (2^24), the result will be 16,777,216 (2^24)

Here's how floats are encoded:

{% image bits.svg %}

<!--more-->

 - the sign bit determines if a number is positive or negative (0 means positive, 1
   means negative).
 - the exponent determines the highest power of 2 less than or equal to the float's value.
   E.g., if the exponent is 7, the float will be greater than or equal to 2^7,
   and less than 2^8. The exponent is encoded as a "biased integer". To compute
   its value, treat it as an unsigned 8-bit integer, and subtract 127. The
   literal values 0 and 255 are treated specially to represent floats whose
   values are zero and infinity respectively. Thus the minimum value for the
   exponent is 1 - 127 = -126, and the maximum value is 254 - 127 = 127.
 - the fraction determines precisely where the value lies between 2^exponent and
   2^(exponent+1). It's a 23-bit integer, and thus can have 2^23 different
   values. If it's 0, then the float is a power of 2 (2^exponent). Otherwise,
   it's one of the 2^23 - 1 values between the "current" power of 2 (2^exponent)
   and the next one.

So putting all this together, assuming the literal value of the exponent is inclusively between 1 and
254, the formula giving the value of a float is:
```
(-1)^sign x 2^(exponent - 127) x (1 + (fraction / 2^23))
```
Breaking down each part:
 - `(-1)^sign` is 1 if the sign is 0, and -1 if the sign is 1
 - `2^(exponent-127)` raises 2 to the power of the exponent after applying the bias of -127
 - `(1 + (fraction / 2^23))` linearly interpolate between 1 and 2 based on the
   fraction (which is always between 0 and 2^23 - 1). Since multiplying the
   current power of 2 by 2 will yield the next power of 2, multiplying the
   current power of 2 by a number between 1 and 2 will give a value in between
   the current power of 2 and the next power of 2.
