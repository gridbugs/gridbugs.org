+++
title = "In praise of rEFInd"
date = 2020-10-05
slug = "in-praise-of-refind"
+++

In a recent update, Windows saw fit to mess with my EFI (boot) partition in such a way
that my Windows/Linux dual-boot setup no longer functioned. When I turned on my PC, it
booted straight to Windows, rather than showing the GRUB menu first.
Poking around in my motherboard's UEFI BIOS tool, and it appears "Secure Boot" has been
enabled, and some keys installed. I'm 90% sure that I didn't set it up that way when I
built my PC about 5 years ago. The "default" boot image on my EFI partition also appeared
to have been updated in the last few days. Suspicious.

I tried setting the "default" boot image ("\EFI\bootx64.efi") back to the grub image,
but this had no effect. Not too surprising - not all implementations follow this convention.
I then disabled secure boot. The only way to do this using my motherboard's UEFI tool is to
delete the secure boot keys that Windows update seems to have installed. This made me a little
nervous, but if I had to pick between having a broken Windows install and a broken Linux install,
I'd forego Windows - all I use it for is playing games anyway.

I totally planned on breaking out an Archlinux live USB at this point and re-configuring UEFI,
but before going down this potential rabbit hole, I tried setting up the [rEFInd](http://www.rodsbooks.com/refind/)
bootloader. It's a tool that locates all the bootable images on in your EFI partition, and displays
a graphical menu to choose which one to boot. The [Windows Installation Instructions](http://www.rodsbooks.com/refind/installing.html#windows)
worked perfectly, though the first time I rebooted after installing rEFInd it took me straight to Windows,
and the second time I forced it to run rEFInd via my motherboard's UEFI tool. Now it runs rEFInd first.

A small quality of life feature I'm appreciative of is rEFInd remembers your last choice and selects it upon
subsequent boots. GRUB may have this setting but I never thought to look for it. This will mean that when Windows
decides to update and restart next time, it won't reboot into Linux (the default selection in my GRUB menu), but
instead boot back into Windows to continue the update.
