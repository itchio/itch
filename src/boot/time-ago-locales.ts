
const jta = require("javascript-time-ago");
const locales = require("../static/locales.json").locales;

import rootLogger from "../logger";
const logger = rootLogger.child({name: "time-locales"});

let numLoaded;
let total;
for (const locale of locales) {
  total++;
  const name = locale.value.replace(/_/g, "-");
  try {
    const data = require(`cldr-dates-modern/main/${name}/dateFields.json`);
    jta.locale(data);
    numLoaded++;
  } catch (e) {
    console.warn(`No date locale for ${name}, ${e.message}`);
  }
}

logger.info(`Loaded ${numLoaded}/${total} time format locales`);
