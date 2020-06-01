//@ts-check
"use strict";

const { lstatSync } = require("fs");
const { $ } = require("@itchio/bob");

async function importStrings() {
  let src = `../itch-i18n/locales`;
  try {
    lstatSync(src);
  } catch (e) {
    console.log(`Missing ../itch-i18n, not importing anything`);
    process.exit(1);
  }
  let dst = `./src/static/locales`;

  $(`rm -rf ${dst}`);
  $(`cp -rfv ${src} ${dst}`);
}

importStrings();
