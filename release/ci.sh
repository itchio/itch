#!/bin/sh -xe

7za | head -2
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
npm test

if [ "$CI_OS" = "linux" ]; then
  export COVERALLS_SERVICE_NAME=jenkins
  export COVERALLS_SERVICE_JOB_ID=$CI_BUILD_ID
  npm run coveralls
fi
