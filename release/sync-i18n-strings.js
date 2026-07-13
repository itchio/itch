//@ts-check

import { lstatSync } from "fs";
import { $ } from "@itchio/bob";

async function syncStrings() {
  let i18nLocales = `../itch-i18n/locales`;
  try {
    lstatSync(i18nLocales);
  } catch (e) {
    console.log(`Missing ../itch-i18n, not syncing anything`);
    process.exit(1);
  }
  let localLocales = `./src/static/locales`;

  // This repo is the source of truth for English strings. Push en.json into
  // itch-i18n first so translators on Weblate see the latest keys.
  $(`cp -fv '${localLocales}/en.json' '${i18nLocales}/en.json'`);

  // Then pull every locale back from itch-i18n. en.json round-trips
  // unchanged; the rest are translator output that this repo consumes.
  $(`rm -rf '${localLocales}'`);
  $(`cp -rfv '${i18nLocales}' '${localLocales}'`);
}

syncStrings();
