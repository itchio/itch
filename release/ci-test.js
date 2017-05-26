#!/usr/bin/env node

// compile typescript code and run unit tests

const $ = require('./common')

async function main () {
  await $.showVersions(['yarn']);

  $(await $.yarn('install'));

  $(await $.yarn('run compile'));
  if (process.platform === "linux") {
    $(await $.sh('xvfb-run yarn test'));
  } else {
    $(await $.yarn('test'));
  }
}

main();
