//@ts-check

import { lstatSync } from "fs";
import { $ } from "@itchio/bob";

async function importStrings() {
  let src = `../itch-i18n/locales`;
  try {
    lstatSync(src);
  } catch (e) {
    console.log(`Missing ../itch-i18n, not importing anything`);
    process.exit(1);
  }
  let dst = `./src/static/locales`;

  $(`rm -rf '${dst}'`, {silent: false});
  $(`cp -rfv '${src}' '${dst}'`, {silent: false});
}

importStrings();
