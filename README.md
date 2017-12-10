## Setting up jekyll

```
# get rvm
curl -sSL https://rvm.io/mpapis.asc | gpg2 --import -
curl -sSL https://get.rvm.io | bash -s stable

# get ruby and gem
rvm install ruby-2.4.1

# get bundle
gem install bundle

# install dependencies (run from repo root)
bundle

# run server
jekyll serve
```
