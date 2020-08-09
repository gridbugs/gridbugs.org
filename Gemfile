source "https://rubygems.org"

gem "jekyll", "~> 4.1"

gem "jekyll-feed", "~> 0.15.0"

gem "jekyll-seo-tag", "~> 2.6"

gem "jekyll-paginate-v2", "~> 3.0"

require 'rbconfig'
if RbConfig::CONFIG['target_os'] =~ /(?i-mx:bsd|dragonfly)/
  gem 'rb-kqueue', :git => "https://github.com/stevebob/rb-kqueue.git", :ref => "144ee7bb7963c77fc219ba736df7ee952d50ab19"
end
