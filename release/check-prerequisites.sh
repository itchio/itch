#!/bin/sh -xe

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
