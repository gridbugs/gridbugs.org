---
layout: post
title: "Playing sound on the NES by directly setting its DMC output"
date: 2023-01-21
categories: emulation audio
permalink: /playing-sound-on-the-nes-by-directly-setting-its-dmc-output/
excerpt_separator: <!--more-->
---

Games on the Nintendo Entertainment System play audio using a handful of
tools within the device's Audio Processing Unit (APU). The Delta Modulation
Channel (DMC) is the most expressive such tool as it can play arbitrary audio
data. Any sound you've heard come out of a NES other than variations on
square and triangle waves, and noise, was played using the DMC.

As its name suggests, the DMC can play [delta
modulated](https://en.wikipedia.org/wiki/Delta_modulation)
audio data, where a signal is represented by a sequence of relative changes
rather than a sequence of samples. The DMC also exposes a register that allows
audio samples to be written directly to its output, and that's what this post
will be about.

This post is aimed at people looking to write programs to play
audio on the NES, or write an emulator for the NES's APU. I found [the DMC
documentation on the NesDev wiki](https://www.nesdev.org/wiki/APU_DMC) great for
low-level technical details but after reading it I felt I had little
intuition for what to expect when actually using the DMC, so I did some experiments which
I will share.

<!--more-->

## Mental model for working with audio

This is my working model for the basics of digital audio.

Part of a speaker called the "diaphragm" gets pushed outwards when a positive
voltage is applied to the speaker, and pulled inwards when a negative voltage is
applied.

{% image speaker-voltages.png alt="Diagram with three images of a speaker
arranged from left to right. The left-most speaker shows the diaphragm in a neutral
position with the subtitle 'No Voltage'. The middle speaker shows the diaphragm
pushed out with the subtitle 'Positive Voltage'. The right-most speaker shows
the diaphragm pulled inwards with the subtitle 'Negative Voltage'." %}

By varying the voltage applied to the speaker over time, the rapid pushing and
pulling causes the diaphragm to
vibrate, creating sound. Note that the variations in voltage over time
correspond to proportionate variations in the displacement of the speaker
diaphragm over time.

{% image speaker-voltage-over-time.png alt="Diagram showing a graph of voltage
over time displaying a sine wave. Various points on the wave are annotated with
the corresponding speaker position, showing a large displacement for positive
voltages and a small displacement for negative voltages." %}

In digital audio, a signal is represented by a series of discrete values, each
corresponding to a diaphragm displacement at a specific point in time. These
values are called "samples", and are often represented by 16 or 32 bit integers,
or floating points. Samples are recorded at fixed time intervals, and
the rate at which they are recorded is the "sample rate", measured in
hertz. A common sample rate is 44.1kHz.

{% image discretize-signal.png alt="Diagram showing a graph of voltage over time
displaying a sine wave. An overlay shows the discretization of the signal in the
graph." %}

Representing a signal digitally results in loss of quality. Two reasons for
this:
 - There are effectively an infinite number of different displacements the
   speaker diaphragm can take, but the data type used to represent samples will
   have a finite number of possible values.
 - The value of the signal is only measured periodically, but the signal itself
   may be constantly varying. The effect of this is that [frequencies in the
   signal which are  above half the sample rate can't be represented in the
   digital signal](https://en.wikipedia.org/wiki/Nyquist_frequency).
   Fortunately humans can't hear frequencies above around
   20kHz so as long as the sample rate is above 40kHz humans won't be able to
   tell that any information has been lost.

Converting from a digital sample to a voltage to apply to a speaker is done
using a device called a Digital-to-Analog Converter (DAC). In the diagram below,
8-bit samples are converted to analog voltages to apply to a speaker. Here,
assume that a sample of 255 is converted to the largest voltage the speaker can
accept, 127 is converted to a voltage of zero, and 0 is converted to the
smallest negative voltage the speaker can accept, with voltages linearly
interpolated in between.

(In practice this would be more complicated. For example in the NES, the DMC's digital
output is combined with the output of other audio channels by a mixer which
contains a DAC. The analog signal from the mixer is sent to the TV attached to the NES which
probably contains an amplifier which adjusts the analog signal to a voltage
range appropriate for the TV's speakers.)

{% image dac.png alt="Diagram showing digital values passing through a DAC
leading to a speaker showing a correlation between the digital value and the
speaker's diaphragm displacement."%}

Earlier we saw that varying the voltage applied to the speaker causes its
diaphragm to vibrate and produce sound. In a digital system we can similarly vary the
value of the sample sent to the DAC to produce sound in much the same way.
The remainder of this post will describe some experiments I did to better
understand how to play sound on the NES by directly writing the digital value
sent from the DMC to the mixer (which includes a DAC).

## Playing a Sine Wave

Let's get the NES to play a sine wave at 440Hz which is the frequency of the
note A above middle C. This program will work by repeatedly setting the DMC's "direct
load" register which is mapped to the memory address 0x4011.
There's no easy way to get the NES itself to generate a sine wave, so instead
I'll programatically generate the instructions to set the direct load register
to a sequence of values approximating a sine wave. The generated NES program
will repeatedly execute the following pair of instructions:
```
LDA(Immediate) XXX    // load the accumulator register with the literal value XXX
STA(Absolute) 0x4011  // store the value in the accumulator to the DMC direct load register
```
These two instructions will be repeated with the placeholder XXX replaced with
successive values sampled from a sine wave. The DMC load register is 8 bits
wide but the most significant bit is ignored so we'll be discretizing the sine
wave to integer samples between 0 and 127.

Before we can generate the sequence of samples we need to work out the sample
rate. This is the rate at which we will be setting the DMC direct load register.
The processor in the NTSC version of the NES runs at 1.79MHz (ie. 1,790,000
cycles per second). The
`LDA(Immediate)` instruction takes 2 cycles and the `STA(Absolute)` instruction
takes 4 cycles so the repeated pair of instructions will take 6 cycles.
This gives us a sampling rate of 1,790,000 / 6 ≈ 298,333.33 samples per second.
This is a far higher sampling rate than is necessary to accurately produce a
440Hz sine wave. As the sampling rate goes up, so too does the number of samples
over a fixed period. This could cause us problems as memory is limited in the
NES. We need to store enough samples to cover one oscillation of the 440Hz sine
wave. If the sine wave repeats 440 times per second and we're sampling it
298,333.33 times per second, then a single iteration of the sine wave is 


