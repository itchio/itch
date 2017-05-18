
const jta = require("javascript-time-ago");
const locales = require("../static/locales.json").locales;

for (const locale of locales) {
  const name = locale.value.replace(/_/g, "-");
  try {
    const data = require(`cldr-dates-modern/main/${name}/dateFields.json`);
    jta.locale(data);
  } catch (e) {
    console.warn(`No date locale for ${name}, ${e.message}`);
  }
}
