#!/usr/bin/env bash

set -euxo pipefail

SCRIPTS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DIR=$SCRIPTS_DIR/..

read -p "Are you sure? " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    cd $DIR
    jekyll build --config _config.yml,_config_gridbugs.yml
    rm -f _site/*.core
    rsync -Pav _site/ gridbugs_nfs:
fi
