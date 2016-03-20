#!/bin/sh -xe

# prerequisites

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

case $CI_BUILD_TAG in
(*-canary)
  export CI_CHANNEL=canary
;;
(*)
  export CI_CHANNEL=stable
;;esac

export NPM_CMD="npm --no-progress --quiet"

if (which grunt); then
  echo "Already have grunt"
else
  $NPM_CMD install -g grunt-cli
fi

export PATH=$PATH:$PWD/node_modules/.bin
$NPM_CMD install

grunt copy sass babel
npm test

if [ "$CI_OS" = "linux" ]; then
  npm run coveralls
fi

if [ -z "$CI_BUILD_TAG" ]; then
  exit 0
fi

export GOPATH="$HOME/go"
mkdir -p $GOPATH
export PATH="$PATH:$GOPATH/bin"
go get github.com/itchio/github-release

export GITHUB_USER=itchio
export GITHUB_REPO=itch
export CI_VERSION=$(echo $CI_BUILD_TAG | sed 's/^v//')

if [ "$CI_OS" = "linux" ]; then
  CI_ARCH="amd64" release/publish.sh
  CI_ARCH="386" release/publish.sh
fi

if [ "$CI_OS" = "windows" ]; then
  CI_ARCH="386" release/publish.sh
end

if [ "$CI_OS" = "darwin" ]; then
  CI_ARCH="amd64" release/publish.sh
end
