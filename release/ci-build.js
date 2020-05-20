//@ts-check
"use strict";

const { build } = require("./packaging/build");
const { parseContext } = require("./packaging/context");

async function main() {
  const cx = await parseContext();
  await build(cx);
}

main();
