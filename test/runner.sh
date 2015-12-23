#!/bin/sh
BASE="`dirname "$0"`"

node $BASE/runner.js $@ | $BASE/../node_modules/.bin/tap-spec
