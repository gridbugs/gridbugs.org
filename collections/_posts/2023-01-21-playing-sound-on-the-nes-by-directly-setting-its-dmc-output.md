---
layout: post
title: "Playing sound on the NES by directly setting its DMC output"
date: 2023-01-21
categories: emulation audio
permalink: /playing-sound-on-the-nes-by-directly-controlling-its-dmc-output
excerpt_separator: <!--more-->
---

Games on the Nintendo Entertainment System play audio using a handful of
tools within the device's Audio Processing Unit (APU). The Delta Modulation
Channel (DMC) is the most expressive such tool as it can play arbitrary audio
samples. Any sound you've heard come out of a NES other than variations on
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
intuition for what to expect when using the DMC, so I did some experiments which
I will share.

A brief note on my mental model for audio.


