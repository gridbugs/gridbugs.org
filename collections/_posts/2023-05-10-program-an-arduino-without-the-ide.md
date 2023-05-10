---
layout: post
title: "Program an Arduino without the IDE"
date: 2023-05-10
categories: arduino
permalink: /program-an-arduine-without-the-ide/
excerpt_separator: <!--more-->
og_image: arduino1.png
---

This is a guide I wrote mostly for myself on how to set up an ergonomic
development environment for writing Arduino programs in c without any
Arduino-specific tools and using an Arduino to make a simple circuit with some
flashing LEDs. The code for this guide is at [github.com/gridbugs/hello-avr](https://github.com/gridbugs/hello-avr).

{% image arduino1.png alt="A breadboard holding an Arduino and several other
components including a range of coloured LEDs, some of which are on." %}

<!--more-->

## Get an Arduino

For this guide I'll be using one of
[these](https://www.elegoo.com/en-au/products/elegoo-nano-v3-0):

{% image arduino3.png alt="A top-down view of an Arduino Nano" %}

It's an Elagoo Nano - a cheaper drop-in replacement for the Arduino Nano. The only
noticeable differences are that you have to solder the headers pins on yourself
and it has a different USB to serial chip (a CH340 instead of the FT232 found on
the Arduino).

## USB Serial Driver

The docs on the [Elagoo
website](https://www.elegoo.com/en-au/products/elegoo-nano-v3-0) suggest that
you'll need to install special drivers in order for your computer to detect the
Elagoo Nano when you plug it in with a USB cable. The necessary linux driver is
called `ch341` and it's probably already installed as a kernel module on most
linux distributions.

Enable it:
```
$ sudo modprobe ch341
$ lsmod | grep ch341
ch341                  28672  0
usbserial              73728  2 pl2303,ch341
usbcore               385024  13 pl2303,usbserial,xhci_hcd,snd_usb_audio,usbhid,snd_usbmidi_lib,xpad,usb_storage,uvcvideo,btusb,xhci_pci,uas,ch341
```

When you connect the Elagoo Nano via a USB cable, you'll see this in the output
of `dmesg`:
```

```

## Get the Tools

We won't be using the Arduino IDE but we still need to install some tools.
Namely:

### `avr-gcc`

A c compiler targeting AVR processors such as the one found in the Arduino.


## Print "Hello, World!"

## Jump to Definition and other ergonomics with LanguageClient-neovim and clangd

## LED Flasher Circuit

Here's a close up of an Arduino Nano with the names of each pin visible:

{% image arduino2.png alt="A top-down view of an Arduino Nano" %}

And this is the circuit diagram for the LED flasher. The orientation of the
Arduino is the same as in the above image, and the pins are all in the same
positions.

{% image arduino-circuit.jpg alt="A circuit diagram with an Arduino Nano at the
centre, and a resistor and LED connected in series between several pins (D2, D3,
D4, D5, D6, D7, D8, D9, D10, A0, A1, A2, A3, A4, A5) and ground." %}

In the circuit, some pins are connected to a resistor in series with an LED.
The cathode of each LED is connected to ground. The resistor is there to limit
the current flowing through the pin and LED to prevent damage to each. I used 1K
resistors though the specific resistance doesn't matter too much.

Here's how the circuit looks on a breadboard:

{% image arduino-breadboard.png alt="An Arduino Nano on a broadboard according
to the circuit diagram above" %}

## USB UART Adapter
