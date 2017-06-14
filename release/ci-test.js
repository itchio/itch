#!/usr/bin/env node

// compile typescript code and run unit tests

const $ = require('./common')

async function main () {
  process.env.NODE_ENV = "test";
  await $.showVersions(['yarn']);

  $(await $.yarn('install'));

  if (process.platform === "linux") {
    $(await $.sh('xvfb-run -s "-screen 0 1280x720x24" yarn test'));
  } else {
    $(await $.yarn('test'));
  }
}

main();
