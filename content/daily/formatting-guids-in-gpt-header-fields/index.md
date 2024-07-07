+++
title = "Formatting GUIDs in GPT header fields"
date = 2020-10-12
slug = "formatting-guids-in-gpt-header-fields"
+++

"GPT" stands for "GUID Partition Table", and "GUID" stands for "Globally-Unique IDentifier".
A GUID is a number generated according to the GUID specification, which is a method for
generating numbers such that it is very unlikely that any two thus generated numbers will
be the same.

GPT uses GUIDs to identify disks, partitions, and partition _types_.

One normally writes a GUID as several dash-separated hexidecimal numbers.
An example GUID is `C12A7328-F81F-11D2-BA4B-00A0C93EC93B`. This particular
GUID is special, in that it indicates an "EFI System Partition" partition type.
This is the partition type that my tool will create, as it's aimed at generating
UEFI-bootable disk images.

Looking at an example UEFI-bootable disk, the _numeric_ value for its partition type
is `0x3bc93ec9a0004bba11d2f81fc12a7328`. Looking closely at this number and the EFI GUID
`C12A7328-F81F-11D2-BA4B-00A0C93EC93B`, every byte (pair of hex digits) is present. The
order of fields is reversed, and the order of bytes within _some_ fields is reversed.
I need to do some more digging to find out the general rule for encoding GUIDs in GPT
headers, though I suspect the pattern observable from this one example will suffice.
