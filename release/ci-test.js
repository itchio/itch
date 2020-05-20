//@ts-check
"use strict";

const { test } = require("./packaging/test");
const { parseContext } = require("./packaging/context");

async function main() {
  const cx = await parseContext();
  await test(cx);
}

main();
