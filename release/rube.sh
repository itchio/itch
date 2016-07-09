#!/bin/bash -xe

# this script shouldn't even need to exist but hey, ruby!

# assuming this is what bundler uses
export BUNDLE_PATH="${PWD}/vendor/bundle"
# assuming this is what gem uses
export GEM_HOME="${BUNDLE_PATH}"

# because not installed by default with ruby 2.3 still
which bundler || gem install bundler
mkdir -p ${BUNDLE_PATH}

# for stuff like fpm, etc.
export PATH="${PATH}:${BUNDLE_PATH}/bin:`ruby -e 'print Gem.user_dir'`/bin"

# make sure we run with a clean unicode english locale
export LC_ALL="en_US.UTF-8"
export LANGUAGE="en_US.UTF-8"
export LANG="en_US.UTF-8"

bundle install
bundle exec ruby "$@"
