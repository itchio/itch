#!/usr/bin/env node

// compile typescript code and run unit tests

const $ = require("./common");

async function main() {
  process.env.NODE_ENV = "test";
  await $.showVersions(["npm"]);

  $(await $.npm("install"));

  $(await $.npm("run ts-check"));
  $(await $.npm("test"));

  if (process.platform === "linux") {
    $(await $.npm("run upload-coverage"));
  }
}

main();
