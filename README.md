# Gridbugs.org

## Production Site

https://gridbugs.org

## Staging Site

https://stevebob.gitlab.io/gridbugs.org/

## Deploy

```
scripts/publish.sh
```

## Setting up jekyll

```
# get bundle
gem install bundle

# install dependencies (run from repo root)
bundle

# run server
bundle exec jekyll serve
```

## Pygments

This site uses pygments instead of rouge, against the recommendations of jekyll, but rouge appears to have some issues with rust syntax highlighting.
Pygments still depends on python2. The easiest way to make it work is to make a virtualenv which uses python2 as its python and activate it before running
the server.

```
$ virtualenv --python=/path/to/python2 venv
$ source venv/bin/activate
$ bundle exec jekyll serve
```
