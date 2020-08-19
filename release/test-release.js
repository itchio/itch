//@ts-check
"use strict";

const { $ } = require("@itchio/bob");

async function main() {
  console.log("Wiping build/");
  $("rm -rf build/");

  $(`node release/build.js --detect-osarch`);
  $(`node release/package.js --detect-osarch`);
}

main().catch((e) => {
  console.error("In main: ", e.stack);
});
