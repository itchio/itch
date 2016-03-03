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

npm config set spin false
npm install -g grunt-cli

export PATH=$PATH:$PWD/node_modules/.bin
npm install

grunt copy sass babel
npm test

if [ "$CI_OS" = "linux" ]; then
  npm run coveralls
fi
