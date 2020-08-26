//@ts-check
"use strict";

const { parseContext } = require("./packaging/context");
const { build } = require("./packaging/build");
const { doPackage } = require("./packaging/do-package");
const { test } = require("./packaging/test");

async function main() {
  const cx = await parseContext();

  await build(cx);
  await doPackage(cx);
  await test(cx);
}

main().catch((e) => {
  throw e;
});
