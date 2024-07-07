+++
title = "Encoding disk headers into disk images"
date = 2020-10-11
slug = "encoding-disk-headers-into-disk-images"
+++

My first attempt at implementing disk image creation feels messy.
Each type of header has a corresponding `struct` in the code base.
When reading headers from a disk, populating a `struct` with their
fields is an easy way to debug (in rust one can just `[derive(Debug)]`
on the `struct` and print each field name/value pair).
For generating headers for new disk images however, populating the
header `struct` first then encoding it into a disk image file feels
like redundant work. In particular, when some of the header fields
are meant to contain a checksum of th remaining fields (as is the case
in GPT headers), these fields can only be populated once the header
is encoded as a byte array anyway. In such cases, I suspect I'll have
an easier time generating the byte array directly rather than going
via a header `struct`.
