
const jta = require("javascript-time-ago");
const locales = require("../static/locales.json").locales;

import rootLogger from "../logger";
const logger = rootLogger.child({name: "time-locales"});

let numLoaded = 0;
let total = 0;
for (const locale of locales) {
  total++;
  const name = locale.value.replace(/_/g, "-");
  try {
    const data = require(`cldr-dates-modern/main/${name}/dateFields.json`);
    jta.locale(data);
    numLoaded++;
  } catch (e) {
    logger.debug(`No date locale for ${name}, ${e.message}`);
  }
}

if (numLoaded === 0) {
  logger.warn(`No time format locales loaded, that seems fishy`);
} else {
  logger.info(`Loaded ${numLoaded}/${total} time format locales`);
}
