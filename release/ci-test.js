#!/usr/bin/env node

// compile typescript code and run unit tests

const $ = require('./common')

async function main () {
  await $.showVersions(['yarn']);

  $(await $.yarn('install'));
  $(await $.yarn('run build-tests'));

  process.env.ELECTRON_ENABLE_LOGGING = '1';

  if (process.platform === "linux") {
    $(await $.yarn('run run-tests-xvfb'));
  } else {
    $(await $.yarn('run run-tests'));
  }
}

main();
