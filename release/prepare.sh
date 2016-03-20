#!/bin/sh -xe

export NODE_ENV=production
grunt -v babel sass copy

rm -rf stage/
mkdir stage/
cp -rf node_modules stage/

cp -rf app stage/

if [ "$CI_CHANNEL" = "canary" ]; then
  cp package.json
  cp -fv release/env-canary.js stage/app/env.js
else
  sed 's/: "itch"/: "itch-canary"/g' < package.json > stage/package.json
  cp -fv release/env.js stage/app/env.js
fi
