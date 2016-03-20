#!/bin/sh -xe

export NODE_ENV=production
grunt babel sass copy

rm -rf stage/
mkdir stage/
cp -rf node_modules stage/

cp -rf app stage/

if [ "$CI_CHANNEL" = "canary" ]; then
  sed 's/: "itch"/: "itch-canary"/g' < package.json > stage/package.json
  cp -fv release/env-canary.js stage/app/env.js
else
  cp package.json stage/
  cp -fv release/env.js stage/app/env.js
fi
