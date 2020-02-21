#!/usr/bin/env node

const { package } = require("./packaging/package");
const { parseContext } = require("./packaging/context");

async function main() {
  const cx = await parseContext();
  await package(cx);
}

main();

