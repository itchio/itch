
export const list = require("static/locales.json");

type LocaleStrings = { [id: string]: string };
type AllLocaleStrings = { [lang: string]: LocaleStrings };

export const strings: AllLocaleStrings = {
  "ar": require("static/locales/ar.json") as LocaleStrings,
  "bg": require("static/locales/bg.json") as LocaleStrings,
  "ca": require("static/locales/ca.json") as LocaleStrings,
  "cs": require("static/locales/cs.json") as LocaleStrings,
  "cy": require("static/locales/cy.json") as LocaleStrings,
  "da": require("static/locales/da.json") as LocaleStrings,
  "de": require("static/locales/de.json") as LocaleStrings,
  "el": require("static/locales/el.json") as LocaleStrings,
  "en": require("static/locales/en.json") as LocaleStrings,
  "eo": require("static/locales/eo.json") as LocaleStrings,
  "es": require("static/locales/es.json") as LocaleStrings,
  "fa": require("static/locales/fa.json") as LocaleStrings,
  "fi": require("static/locales/fi.json") as LocaleStrings,
  "fr": require("static/locales/fr.json") as LocaleStrings,
  "ga": require("static/locales/ga.json") as LocaleStrings,
  "he": require("static/locales/he.json") as LocaleStrings,
  "hi": require("static/locales/hi.json") as LocaleStrings,
  "hu": require("static/locales/hu.json") as LocaleStrings,
  "in": require("static/locales/in.json") as LocaleStrings,
  "it": require("static/locales/it.json") as LocaleStrings,
  "ja": require("static/locales/ja.json") as LocaleStrings,
  "ko": require("static/locales/ko.json") as LocaleStrings,
  "nb": require("static/locales/nb.json") as LocaleStrings,
  "nl": require("static/locales/nl.json") as LocaleStrings,
  "pl": require("static/locales/pl.json") as LocaleStrings,
  "pt-BR": require("static/locales/pt-BR.json") as LocaleStrings,
  "pt-PT": require("static/locales/pt-PT.json") as LocaleStrings,
  "ro": require("static/locales/ro.json") as LocaleStrings,
  "ru": require("static/locales/ru.json") as LocaleStrings,
  "sk": require("static/locales/sk.json") as LocaleStrings,
  "sr": require("static/locales/sr.json") as LocaleStrings,
  "sv": require("static/locales/sv.json") as LocaleStrings,
  "tr": require("static/locales/tr.json") as LocaleStrings,
  "uk": require("static/locales/uk.json") as LocaleStrings,
  "vi": require("static/locales/vi.json") as LocaleStrings,
  "zh": require("static/locales/zh.json") as LocaleStrings,
};
