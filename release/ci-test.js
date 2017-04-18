#!/usr/bin/env node

// compile typescript code and run unit tests

const $ = require('./common')

async function main () {
  await $.showVersions(['npm']);

  $(await $.npm('install'));
  $(await $.npm('run build-tests'));

  process.env.ELECTRON_ENABLE_LOGGING = '1';

  if (process.platform === "linux") {
    $(await $.npm('run run-tests-xvfb'));
  } else {
    $(await $.npm('run run-tests'));
  }
}

main();
