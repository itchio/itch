#!/bin/sh -e

if [ -z "$CI_BUILD_TAG" ]; then
  exit 0
fi

case $CI_BUILD_TAG in
(*-canary)
  export CI_CHANNEL=canary
  export CI_APPNAME=itch_canary
;;
(*)
  export CI_CHANNEL=stable
  export CI_APPNAME=itch
;;esac

echo "Creating GitHub release for $CI_BUILD_TAG"
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

# fetch last-but-one tag - all tags are annotated
# so we can use that to sort them by date
OLD_TAG="$(git for-each-ref --sort=taggerdate --format '%(refname) %(taggerdate)' refs/tags | tail -2 | head -1 | cut -d ' ' -f 1 | cut -d '/' -f 3)"
echo "Previous tag: $OLD_TAG"

CHANGELOG="$(git log --oneline --no-merges $OLD_TAG..$CI_BUILD_TAG | cut -c 9- | sed 's/^/  * /')"
echo "Changelog:\n\n$CHANGELOG\n\n"

github-release delete \
 --tag "$CI_BUILD_TAG" || echo "Well that's fine!"

github-release release \
 --tag "$CI_BUILD_TAG" \
 --draft \
 --pre-release \
 --description "$CHANGELOG"
