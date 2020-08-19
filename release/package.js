//@ts-check
"use strict";

const { doPackage } = require("./packaging/do-package");
const { parseContext } = require("./packaging/context");

async function main() {
  const cx = await parseContext();
  await doPackage(cx);
}

main();
