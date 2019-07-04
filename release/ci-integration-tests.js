#!/usr/bin/env node

// run integration tests

const $ = require("./common");

async function main() {
  let binName = `itch-integration-tests`;
  await $.cd("integration-tests", async () => {
    $(await $.sh(`go build -o runner -v`));
  });
  process.env.ELECTRON_DISABLE_SANDBOX = "1";
  $(await $.sh(`./integration-tests/runner`));
  return;
}

main();
