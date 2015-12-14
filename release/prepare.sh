#!/bin/sh -xe

rm -rf stage/
mkdir stage/
cp -rf node_modules package.json stage/

sassc app/style/main.scss app/style/main.css

babel -D -d stage/app app

cp -fv release/env.js stage/app/env.js

