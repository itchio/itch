#!/bin/sh -xe

if [ -z "$CI_BUILD_TAG" ]; then
  exit 0
fi

release/check-prerequisites.sh
export NPM_CMD="npm --no-progress --quiet"
export PATH=$PATH:$PWD/node_modules/.bin

if (which grunt); then
  echo "Already have grunt"
else
  $NPM_CMD install -g grunt-cli
fi

case $CI_BUILD_TAG in
(*-canary)
  export CI_CHANNEL=canary
  export CI_APPNAME=itch-canary
;;
(*)
  export CI_CHANNEL=stable
  export CI_APPNAME=itch
;;esac

export GOPATH="$HOME/go"
mkdir -p $GOPATH
export PATH="$PATH:$GOPATH/bin"

if (which github-release); then
  echo "Already have github-release"
else
  go get github.com/itchio/github-release
fi

export GITHUB_USER=itchio
export GITHUB_REPO=$CI_APPNAME
export CI_VERSION=$(echo $CI_BUILD_TAG | sed 's/^v//')

release/publish.sh
