#!/bin/sh

SCALE=3
ffmpeg -i "$1" -c:v libx264 -crf 30 -pix_fmt yuv420p -vf "scale=trunc(iw/$SCALE/2)*2:trunc(ih/$SCALE/2)*2" "$2"
