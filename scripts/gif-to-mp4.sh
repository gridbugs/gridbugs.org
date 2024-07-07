#!/bin/sh

ffmpeg -i "$1" -c:v libx264 -crf 40 -pix_fmt yuv420p "$2"
