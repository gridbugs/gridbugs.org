---
layout: post
title: Component Pinouts and Notes
date: 2023-05-27
categories: electronics
permalink: /component-pinouts-and-notes/
excerpt_separator: <!--more-->
---

This page will list pinouts of some electronic components I commonly find myself
using, as well as some notes on using them that might not be obvious from
reading the datasheets.

<!--more-->

## 78L05 Voltage Regulator in TO-92 package

{% file component-datasheets/l78l.pdf | Datasheet (pdf) for L78L series voltage regulators which includes the 78L05 %}

The 78L05 provides a regulated 5v supply on its output pin if sufficient voltage
(at least 7v) is supplied to its input.
If a device's documentation says that the device requires a regulated 5v power
supply, this is the kind of thing that it means.

The TO-92 package is commonly used for transistors but other 3-pin components
can also be found in this package.

The pinout in the datasheet is from the bottom-up point of view which I found
counterintuitive and possibly dangerous for people skimming the manual looking
for a pinout without reading the text indicating it's a bottom-up view.
In my experience, when a voltage source is connected to the output pin of 78L05
(ie. when it is connected backwards), the same voltage can be measured at its
input pin. It's not clear how much current it will allow to flow when connected
backwards but it's possible that this could damage whatever component is being
powered by the incorrectly connected 78L05.

{% image 78l05-to92.png alt="diagram of 78L05 in TO-92 package with pins labelled" %}

The component has a round side and a flat side.
As shown in the image above, with the flat side facing you, with the pins
pointing downwards:
 - The _left_ pin is the _output_ and will provide 5V if sufficient voltage
   (at least 7v) is supplied to the input.
 - The _middle_ pin is _ground_.
 - The _right_ pin is the _input_.

The figure of 7v as the minimum input voltage is based on this image from the
manual:
{% image 78l05-input-to-output.png alt="plot showing the relationship between input and output voltage" %}

So the actual minimum input voltage depends on how much current is being drawn
from the output, but if it's up to 100mA then 7v will be fine.

## LM358 and TL072 Dual Op Amps

{% file component-datasheets/lm358.pdf | Datasheet (pdf) for LM385 Dual Op Amp (also contains information on related components) %}

{% file component-datasheets/tl072.pdf | Datasheet (pdf) for TL072 Dual Op Amp (also contains information on related components) %}

Both components include a pair of op amps on a single chip and they have
identical pinouts. This is the pinout viewed from top-down:

{% image dual-op-amp.png alt="pinout of both op amps" %}

This table lists the pins corresponding to their arrangement in the diagram
above. The semi-circular indentation on the top of the IC is facing upwards.

| Left Side   | Right Side  |
| ----------- | ----------- |
| 1OUT        | VCC+        |
| 1IN-        | 2OUT        |
| 1IN+        | 2IN-        |
| VCC-        | 2IN+        |

My mnemonic for this pinout is that the bottom left is usually ground and the
top right is usually positive voltage for ICs, and if you don't have a negative
supply voltage you'll probably connect the VCC- pin to ground. Then, a common
op amp feedback configuration is a voltage forwarder (aka. a buffer amplifier)
and in this configuration the IN- pin and the OUT pin are connected together. I
like to pretend that the designer wanted to make it easy to setup a voltage
forwarder by putting the OUT and IN- pins next to each other for both op amps on
the chip.

## Arduino Nano

{% file
component-datasheets/Atmel-7810-Automotive-Microcontrollers-ATmega328P_Datasheet.pdf
| Datasheet (pdf) for Atmel Atmega328P (the microcontroller on the Arduino Nano)
%}

{% file
component-datasheets/Arduino_Nano-Rev3.2-SCH.pdf
| Schematic of the Arduino Nano
%}

### Pinout

This is the pinout of the Arduino Nano from the Arduino documentation, except
I've modified it to clarify that pins A6 and A7 can't be used as digital I/O
port pins.

{% image arduino-nano.jpg alt="pinout of the arduino nano" %}

Here's the pinout in tabular form. The positions of pins correspond to a
top-down view of the Arduino Nano with the usb port facing upwards. Each entry
is named after what is literally printed on the PCB next to each pin. In
parentheses after each name are the I/O port pin function (PXn) and the ADC
channel (ADCn) if any.

| Left Side      | Right Side  |
| -------------- | ----------- |
| D13 (PB5)      | D12 (PB4)   |
| 3V3            | D11 (PB3)   |
| REF            | D10 (PB2)   |
| A0 (PC0, ADC0) | D9 (PB1)    |
| A1 (PC1, ADC1) | D8 (PB0)    |
| A2 (PC2, ADC2) | D7 (PD7)    |
| A3 (PC3, ADC3) | D6 (PD6)    |
| A4 (PC4, ADC4) | D5 (PD5)    |
| A5 (PC5, ADC5) | D4 (PD4)    |
| A6 (ADC6)      | D3 (PD3)    |
| A7 (ADC7)      | D2 (PD2)    |
| 5V             | GND         |
| RST (PC6)      | RST (PC6)   |
| GND            | RX0 (PD0)   |
| VIN            | TX1 (PD1)   |

### Power Supply

You can power the Arduino Nano by supplying between 7 and 12 volts to the VIN
pin, or by supplying regulated 5 volts to the 5V pin (such as with a 78L05
voltage regulator). When powering via the VIN pin, the 5V pin can be used as a
5V power supply for powering other components (including other Arduino Nanos, in
which case you would connect the 5V pin on one Arduino Nano to the 5V pin on
other other). This works because in between the VIN and 5V pins there is a 5v
voltage regulator similar to the 78L05 (but not identical - the Arduino Nano
uses a
[LM117IMPX-5.0](https://www.ti.com/lit/ds/symlink/lm1117.pdf?ts=168433779491)).
It supplies the Arduino with regulated 5V but can supply other things too via
the 5V pin, because its output connects directly to this pin.

Some sources will recommend against supplying your own voltage regulator and
powering via the 5V pin and using the VIN pin instead. Indeed there is little point
using the 5V pin as the onboard voltage regulator should be just as good as
whatever you use instead to produce the regulated 5v. One reason you might do
this anyway is because the voltage regulator could wear out over time and it's
much cheaper to replace a voltage regulator than an entire Arduino. You could
wait until the onboard regulator fails before circumventing it with an external
component but this might be hard once the Arduino is soldered in place compared
to replacing the external voltage regulator with a new one.
