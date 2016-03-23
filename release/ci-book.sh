#!/bin/sh -xe

npm version
npm install -g gitbook-cli

(cd docs && gitbook build)

gsutil cp -r -a public-read docs/_book/* gs://docs.itch.ovh/itch/$CI_BUILD_REF_NAME/
