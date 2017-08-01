#!/usr/bin/env node

// run integration tests

const $ = require("./common");
const path = require("path").posix;

async function main() {
  process.env.GOPATH = path.join(process.cwd(), "gopath");
  const target = "github.com/itchio/itch-integration-tests";
  $(await $.sh(`rm -rf gopath/src/${target}`))
  $(await $.sh(`mkdir -p gopath/src/${target}`))
  $(await $.sh(`cp -rf integration-tests/* gopath/src/${target}`))
  $(await $.sh(`go get -v ${target}`))
  $(await $.sh(`gopath/bin/itch-integration-tests`))
  return;
}

main();

