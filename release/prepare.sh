#!/bin/sh -xe

export NODE_ENV=production
grunt -v babel sass copy

rm -rf stage/
mkdir stage/
cp -rf node_modules package.json stage/

cp -rf app stage/
cp -fv release/env.js stage/app/env.js
