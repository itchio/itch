#!/bin/sh -xe
# generate latest documentation for itch using gitbook
# and deploy it to google cloud storage.

npm version
npm install -g gitbook-cli

(cd docs && npm install && gitbook build)

gsutil cp -r -a public-read docs/_book/* gs://docs.itch.ovh/itch/$CI_BUILD_REF_NAME/
