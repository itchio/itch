#!/usr/bin/env node

const $ = require("./common");
const { build } = require("./packaging/build");
const { package } = require("./packaging/package");
const { test } = require("./packaging/test");
const { parseContext } = require("./packaging/context");

async function main() {
  const cx = await parseContext();

  await build(cx);
  await package(cx);
  await test(cx);
}

main();
