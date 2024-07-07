+++
title = "Disk image tool progress - Counter-intuitive header population"
date = 2020-11-13
slug = "disk-image-tool-progress-counter-intuitive-header-population"
+++

While preparing to implement a disk image creation tool I built a few tools for
reading files from inside disk images. In the process I wrote some code for
parsing the various disk and partition header structures present in a disk
image.  Now that I'm actually generating images of my own, I need to populate
headers in the images.

The most obvious way to do this is to populate the fields of the same header
type that I previously parsed from disk images when reading files from them,
and then have some additional code for serializing the header type into the
disk image in whatever format the GPT or FAT protocols expect.

After going a little way down this path I stopped and tried an alternative,
where I write header information directly in its serialized form to a buffer,
and then parse it back out with my existing header parsers, purely as a sanity
check. There are two benefits to this approach.  The first is the sanity check
- I've tested the header parsing code on real disk images and have some degree
of confidence that it works. In addition to parsing values from disk headers,
it also performs some validation, such as checking checksums.  Writing the disk
header directly and parsing it back means I can check that the header I'm
writing to disk is valid.

The second benefit is less code. Were I to populate a struct with header
fields, and then serialize it, I'd have 3 places where each field is listed out
in the code - parsing headers, populating header structs, and serializing
header structs. As it is now, there are only two - parsing headers, and writing
header fields.
