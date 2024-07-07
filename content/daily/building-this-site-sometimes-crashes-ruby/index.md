+++
title = "Building this site sometimes crashes ruby"
date = 2020-11-06
slug = "building-this-site-sometimes-crashes-ruby"
+++

This is a jekyll site, which means that it's composed of a bunch of markdown files,
and I run a ruby script called "jekyll" which turns it into a bunch of html files
which I then upload to my web server. When working on a post, I usually run:
```
bundle exec jekyll serve
```
...which watches the markdown files, regenerating the
html each time a file changes, and serves the result on a local we server.
When I first switched to FreeBSD, the file-watching mechanism wasn't working properly,
and I would see:
```
          NoMethodError:
            undefined method `callback!' for nil:NilClass
          # ./vendor/bundle/ruby/2.6/gems/rb-kqueue-0.2.5/lib/rb-kqueue/event.rb:80:in `callback!'
          # ./vendor/bundle/ruby/2.6/gems/rb-kqueue-0.2.5/lib/rb-kqueue/queue.rb:337:in `block in process'
          # ./vendor/bundle/ruby/2.6/gems/rb-kqueue-0.2.5/lib/rb-kqueue/queue.rb:337:in `each'
          # ./vendor/bundle/ruby/2.6/gems/rb-kqueue-0.2.5/lib/rb-kqueue/queue.rb:337:in `process'
          # ./vendor/bundle/ruby/2.6/gems/rb-kqueue-0.2.5/lib/rb-kqueue/queue.rb:316:in `run'
```
...and the site wouldn't rebuild when a file changed. This is a [known issue](https://github.com/guard/listen/issues/475),
and I could work around it by polling instead of using FreeBSD's kqueue mechanism to watch files, but
the latency was quite high. I eventually [fixed](https://github.com/mat813/rb-kqueue/pull/12) a bug in the
rb-kqueue gem which seemed to solve the problem. It's not merged yet but I can include a reference to my
fork of the library in this site's Gemfile until it gets merged.

Lately however, I've started seeing this crash when changing a file:
```
/usr/home/steve/.rvm/gems/ruby-2.7.2/bundler/gems/rb-kqueue-144ee7bb7963/lib/rb-kqueue/native/flags.rb:145: [BUG] Segmentation fault at 0x0000000100210014
ruby 2.7.2p137 (2020-10-01 revision 5445e04352) [x86_64-freebsd12.2]
```
...which is clearly related to rb-kqueue. I'm not sure if this was introduced by my change.
Need to dig deeper!
