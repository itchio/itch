#!/usr/bin/env node

const $ = require("./common");

async function importStrings() {
  let src = `../itch-i18n/locales`;
  try {
    await $.lstat(src);
  } catch (e) {
    $.say(`Missing ../itch-i18n, not importing anything`);
    process.exit(1);
  }
  let dst = `./src/static/locales`;

  await $.sh(`rm -rf ${dst}`);
  await $.sh(`cp -rfv ${src} ${dst}`);
}

importStrings();
