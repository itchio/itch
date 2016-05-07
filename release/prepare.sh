#!/bin/sh -xe
# prepare 'env.js' for release, adjust package name in package.json if needed

export NODE_ENV=production
export PATH=$PATH:$PWD/node_modules/.bin
grunt babel sass copy

rm -rf stage/
mkdir stage/
cp -rf node_modules stage/

cp -rf app stage/

if [ "$CI_CHANNEL" = "canary" ]; then
  sed 's/: "itch"/: "itch_canary"/g' < package.json > stage/package.json
  cp -fv release/env-canary.js stage/app/env.js
else
  cp package.json stage/
  cp -fv release/env.js stage/app/env.js
fi
