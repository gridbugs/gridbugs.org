+++
title = "New phone, and an arduous journey bootstrapping LineageOS"
date = 2020-09-15
slug = "new-phone-and-an-arduous-journey-bootstrapping-lineageos"
+++

After 5 years of gradually degrading service (as expected of any phone, sadly), my
LG Nexus 5 succumbed to a stuck power button, as has been the fate of the Nexus 5 of
everyone I know who owned one. I replaced it with a OnePlus 6 (from 2018, refurbished I think),
and naturally I spent the evening installing LineageOS - a custom android ROM.

The install could have gone smoother. Typically, you use `fastboot` to flash a custom "recovery image",
boot into recovery mode, and then install the main OS and Google Play (and possibly other Google apps).
Lineage's recovery image didn't boot for me - possibly because my firmware was out of date.
I briefly thought I bricked my phone, but then found that powering on with volume-up pressed
takes you directly to fastboot from which you can re-flash the recovery image and try again. I ended up installing
TWRP - an alternative to Lineage's recovery image - and installing Lineage through that. For whatever reason,
the Google Play installer thought the installed version of android was incorrect (8 instead of 10).
I ended up booting LineageOS without Google Play (which can't be installed after the OS has booted
the first time for some reason). This incidentally replaced TWRP with Lineage's recovery image,
and this time I was then able to boot into that, and *reinstall* LineageOS *and* Google Play successfully.
