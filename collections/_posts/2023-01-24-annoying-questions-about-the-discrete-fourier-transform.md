---
layout: post
title: "Annoying Questions about the Discrete Fourier Transform"
date: 2023-01-24
categories: maths audio
permalink: /annoying-questions-about-the-discrete-fourier-transform/
excerpt_separator: <!--more-->
---

Putting my pedantic student hat back on and trying to answer some burning questions I've
had about the Discrete Fourier Transform for quite some time. It's probably the most commonly
executed computation in the world and dammit we deserve answers!

## 1. What does it really mean when software that plays music displays a dynamic audio spectrogram?

Like this. What is this?

{% image vlc-spectrogram.png alt="Screenshot of the Spectrum visualization from VLC representing the intensity of frequency buckets using vertical bars" %}

Obviously the height of each vertical bar corresponds to the intensity of a
particular range of frequencies. If we really wanted to we could compute the
intensity of each frequency range over the entire length of the song and just
display that, but then the bars wouldn't move around as the track played, which
wouldn't be as fun. Presumably it's the intensity of frequencies within some
relatively short window of time that slides as the song plays. If I was making
my own music player, how would I choose this length? Given that as the window
slides from one position to the next its contents will be largely unchanged, is
there an optimization which avoids re-computing the entire DFT of the contents
of the new window, given that we know the DFT of the previous window?

<!--more-->

## 2. If I separate all the sine waves of different frequencies that make up a song and then add them back up with the correct offsets I'll get the original song back. But what happens if I don't stop the sine waves at the end of the song? What will we hear?

Since each wave repeats an integer number of time over the duration of the song,
I would expect that each wave is back to its starting offset at the moment the
song ends, so my prediction is that the song will start playing again from the
start.

## 3. What is an "instant" in the context of audio? Does this concept even make sense?

## 4. If I have a minute of silence punctuated with a brief pulse at 30s, how does the DFT of the signal "remember" the delay?

## 5. Why is the result of the inverse discrete fourier transform a real number given that it's computed as the sum of complex numbers?

## 6. What is the point of the second half of the frequency domain? That is, how does the DFT detect the presence of signals that repeat more than N/2 times in N samples?
