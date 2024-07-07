+++
title = "If you use a custom linker script, _start might not be your entry point"
date = 2023-01-07
path = "if-you-use-a-custom-linker-script-_start-is-not-necessarily-the-entry-point"

[taxonomies]
tags = ["unix"]
+++

For most of my life I took for granted that programs begin executing at an
address denoted by the symbol `_start` (a single underscore, followed by the
word "start"). Turns out it's not so simple.

Take this x86 assembly program that prints "Hello, World!" on Linux:
```asm
.global _start

.text

message:
    .ascii "Hello, World!\n"

_start:
    # print the message
    mov $1, %rax        # syscall 1 is write
    mov $1, %rdi        # file descriptor 1 is stdout
    mov $message, %rsi  # pass address of messsage
    mov $13, %rdx       # pass length of message
    syscall             # perform write system call

    # exit
    mov $60, %rax       # syscall 60 is exit
    mov $0, %rdi        # pass exit status of 0
    syscall             # perform exit system call
```

To compile and run this program (assume it's in the file hello.s):
```
$ gcc -c hello.s   # compile hello.s to object file hello.o
$ ld hello.o       # link hello.o to executable a.out
$ ./a.out
Hello, World!
```
<!-- more -->

Now add this custom linker script in a file named link.ld:
```ld
SECTIONS {
    . = 0x1000;
}
```
The linker decides how a program will be laid out in memory, and the
`. = 0x1000;` line instructs the linker to begin at (virtual) address 0x1000
(without this line it defaults to starting from address 0 which would cause
problems on most systems).

Re-link the executable, this time passing `-T link.ld` to the linker to get it
to use the custom linker script:
```
$ ld hello.o -T link.ld
$ ./a.out
Segmentation fault (core dumped)
```

Oh no.

Use `readelf` to find out the entry point of a.out:
```
$ readelf --file-header a.out
ELF Header:
...
  Entry point address:               0x1000
```

And use `objdump` to disassemble a.out:
```
$ objdump -d a.out

a.out:     file format elf64-x86-64


Disassembly of section .text:

0000000000001000 <message>:
    1000:       48                      rex.W
    1001:       65 6c                   gs insb (%dx),%es:(%rdi)
    1003:       6c                      insb   (%dx),%es:(%rdi)
    1004:       6f                      outsl  %ds:(%rsi),(%dx)
    1005:       2c 20                   sub    $0x20,%al
    1007:       57                      push   %rdi
    1008:       6f                      outsl  %ds:(%rsi),(%dx)
    1009:       72 6c                   jb     1077 <_start+0x69>
    100b:       64 21 0a                and    %ecx,%fs:(%rdx)

000000000000100e <_start>:
    100e:       48 c7 c0 01 00 00 00    mov    $0x1,%rax
    1015:       48 c7 c7 01 00 00 00    mov    $0x1,%rdi
    101c:       48 c7 c6 00 10 00 00    mov    $0x1000,%rsi
    1023:       48 c7 c2 0d 00 00 00    mov    $0xd,%rdx
    102a:       0f 05                   syscall
    102c:       48 c7 c0 3c 00 00 00    mov    $0x3c,%rax
    1033:       48 c7 c7 00 00 00 00    mov    $0x0,%rdi
    103a:       0f 05                   syscall
```

First in memory at 0x1000 is the ascii-encoded message "Hello, World!"
which `objdump` has attempted to disassemble, not realizing that it's
not code (you generally wouldn't put literal data in the `.text` section anyway).
The `_start` function begins at address 0x100e which is where we'd like to
begin execution, but `readelf` reported that the entry point is 0x1000.
So execution is beginning at the start of the message, and the processor is trying
to execute whatever instructions happen to correspond to the ascii-encoding
of "Hello, World!".

No wonder it crashes.

One way to fix this problem is to force the linker to use `_start` as the
entry point by updating the linker script to:
```ld
ENTRY(_start);

SECTIONS {
    . = 0x1000;
}
```
```
$ ld hello.o -T link.ld
$ ./a.out
Hello, World!
```
```
$ readelf --file-header a.out
ELF Header:
...
  Entry point address:               0x100e
```
The program now works again, and the entry point is set to 0x100e as expected (that's the address
referred to by `_start` according to the output of `objdump` above).

But hang on, why is this necessary, isn't `_start` the default entry point?

Well according to [the ld docs](https://ftp.gnu.org/old-gnu/Manuals/ld-2.9.1/html_chapter/ld_3.html#SEC24):
```
ENTRY is only one of several ways of choosing the entry point.
You may indicate it in any of the following ways.
 - the `-e' entry command-line option;
 - the ENTRY(symbol) command in a linker control script;
 - the value of the symbol start, if present;
 - the address of the first byte of the .text section, if present;
 - The address 0.
```

Note the option `the value of the symbol start, if present;`.

So with that in mind, get rid of the `ENTRY(_start);` from the custom linker script, and change the assembly
program to replace `_start` with `start`:
```asm
.global start

.text

message:
    .ascii "Hello, World!\n"

start:
...
```
```
$ ld hello.o -T link.ld
$ ./a.out
Hello, World!
```

And sure enough, that works too.

Also note the option `the address of the first byte of the .text section, if present;`.
This is the option we were hitting that led to the program crashing earlier.
I must confess that I contrived an example program where `_start` wasn't
at the beginning of the `.text` section so the program wouldn't work when the linker fell back to this option.
A lot of toy assembly programs define a `_start` symbol at the start of the `.text` section.
It feels natural for `_start` to be the first function in your program's text, and if
you use a custom linker script and don't specify `_start` as your entry point,
it will work just fine although the `_start` symbol will be ignored.

If your program starts at the beginning of `text`, you don't even need a symbol to point
to the entry point:
```asm
.text
    # print the message
    mov $1, %rax        # syscall 1 is write
    mov $1, %rdi        # file descriptor 1 is stdout
    mov $message, %rsi  # pass address of messsage
    mov $13, %rdx       # pass length of message
    syscall             # perform write system call

    # exit
    mov $60, %rax       # syscall 60 is exit
    mov $0, %rdi        # pass exit status of 0
    syscall             # perform exit system call

message:
    .ascii "Hello, World!\n"
```

So it looks like the default entry point is at `start`, not `_start`.
If that's the case, why did the initial program work?

Relink the executable without the custom linker script, but pass `--verbose`:
```
$ ld hello.o --verobse
GNU ld (GNU Binutils) 2.39
  Supported emulations:
   elf_x86_64
   elf32_x86_64
   elf_i386
   elf_iamcu
using internal linker script:
==================================================
/* Script for -z combreloc -z separate-code */
/* Copyright (C) 2014-2022 Free Software Foundation, Inc.
   Copying and distribution of this script, with or without modification,
   are permitted in any medium without royalty provided the copyright
   notice and this notice are preserved.  */
OUTPUT_FORMAT("elf64-x86-64", "elf64-x86-64",
              "elf64-x86-64")
OUTPUT_ARCH(i386:x86-64)
ENTRY(_start)
...
```

If you don't specify a custom linker script, the linker uses an internal linker script, which explicitly sets
the entry point to `_start`.

For programs that don't use a custom linker script (ie. the vast majority of programs), `_start` is effectively
the default entry point by means of the linker's internal linker script.
However as soon as you define your own linker script, it's up to you to ensure that your program's entry point is set correctly.

