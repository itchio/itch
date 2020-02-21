#!/usr/bin/env node

const { build } = require("./packaging/build");
const { parseContext } = require("./packaging/context");

async function main() {
  const cx = await parseContext();
  await build(cx);
}

main();
