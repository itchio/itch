#!/bin/sh -xe
# prints version of a few tools used on the CI servers
# not quite proper dependency management, but gives insight on failed builds

if [ "$CI_OS" = "darwin" ]; then
  7za | head -2
fi
node --version
npm --version
go version

if [ "$CI_OS" = "linux" ]; then
  ruby --version
  gem --version
fi
