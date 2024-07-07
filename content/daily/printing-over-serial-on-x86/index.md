+++
title = "Printing over serial on x86"
date = 2020-08-17
slug = "printing-over-serial-on-x86"
+++

Tonight I set myself the task of printing some text over a serial port in a tiny
kernel mode program that boots with the [BOOTBOOT](https://wiki.osdev.org/BOOTBOOT)
bootloader. I didn't start from scratch, but from some
[example code](https://gitlab.com/bztsrc/bootboot/-/tree/master/mykernel)
in the BOOTBOOT reference implementation.

The only reason it wasn't trivial is that I'm targeting a UEFI machine,
and between the [BOOTBOOT spec](https://gitlab.com/bztsrc/bootboot/raw/master/bootboot_spec_1st_ed.pdf)
and the [osdev wiki page about serial ports](https://wiki.osdev.org/Serial_Ports)
or [UEFI](https://wiki.osdev.org/UEFI), it's not clear whether the "old fashioned" way
of interacting with serial ports is supported on UEFI. All the information I could find about
how to print via serial console on UEFI systems implied that I should use a library which
abstracts access to hardware via UEFI.

Instead I elected to try doing it the "old fashioned" way, based on the
[debug printing code from the seL4 microkernel](https://github.com/seL4/seL4/blob/master/src/plat/pc99/machine/io.c#L30).
Here's how it looks.

I added a small assembly file defining a `com1_putc` function that sends its argument to I/O port `0x3F8`,
which conventionally addresses the `COM1` serial port.
```nasm
; ioports.asm

global com1_putc

%define COM1 0x3F8

section .text
bits 64

com1_putc:
    mov rax, rdi
    mov dx, COM1
    out dx, al
    ret
```
Assemble the new file:
```make
# Makefile

mykernel.x86_64.elf: kernel.c
	nasm -f elf64 ioports.asm -o ioports.o
	... (add ioports.o to the linker arguments)
```

And call the new function from `_start`:
```c
// kernel.c

void com1_putc(char c);
void com1_puts(char* s);

void _start()
{
    com1_puts("Hello, COM1\n");
}

void com1_puts(char* s) {
    do {
        com1_putc(*(s++));
    } while (*s);
}
```
Despite its simplicity, I'm not convinced that this code is correct in all cases.
I rushed this because I just wanted to get something working, and now that it works
for me, I'll slow down and understand this code as deeply as I can before moving on.
