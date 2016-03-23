#!/bin/sh -xe

npm version
npm install -g gitbook-cli

(cd docs && gitbook build)

CI_VERSION="head"
if [ -n "$CI_BUILD_TAG" ]; then
  CI_VERSION="$CI_BUILD_TAG"
fi

gsutil cp -r -a public-read docs/_book/* gs://docs.itch.ovh/itch/$CI_VERSION/
