#!/bin/bash

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

read -p "Are you sure? " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    cd $DIR
    bundle exec jekyll build
    s3cmd sync _site/* s3://gridbugs.org
fi
