
export const list = import("../../static/locales.json").then(x => x.default);

type LocaleStrings = { [id: string]: string };
type AllLocaleStrings = { [lang: string]: Promise<LocaleStrings> };

export const strings: AllLocaleStrings = {
  "ar": import("../../static/locales/ar.json").then(x => x.default as LocaleStrings),
  "bg": import("../../static/locales/bg.json").then(x => x.default as LocaleStrings),
  "ca": import("../../static/locales/ca.json").then(x => x.default as LocaleStrings),
  "cs": import("../../static/locales/cs.json").then(x => x.default as LocaleStrings),
  "cy": import("../../static/locales/cy.json").then(x => x.default as LocaleStrings),
  "da": import("../../static/locales/da.json").then(x => x.default as LocaleStrings),
  "de": import("../../static/locales/de.json").then(x => x.default as LocaleStrings),
  "el": import("../../static/locales/el.json").then(x => x.default as LocaleStrings),
  "en": import("../../static/locales/en.json").then(x => x.default as LocaleStrings),
  "eo": import("../../static/locales/eo.json").then(x => x.default as LocaleStrings),
  "es": import("../../static/locales/es.json").then(x => x.default as LocaleStrings),
  "fa": import("../../static/locales/fa.json").then(x => x.default as LocaleStrings),
  "fi": import("../../static/locales/fi.json").then(x => x.default as LocaleStrings),
  "fr": import("../../static/locales/fr.json").then(x => x.default as LocaleStrings),
  "ga": import("../../static/locales/ga.json").then(x => x.default as LocaleStrings),
  "he": import("../../static/locales/he.json").then(x => x.default as LocaleStrings),
  "hi": import("../../static/locales/hi.json").then(x => x.default as LocaleStrings),
  "hu": import("../../static/locales/hu.json").then(x => x.default as LocaleStrings),
  "in": import("../../static/locales/in.json").then(x => x.default as LocaleStrings),
  "it": import("../../static/locales/it.json").then(x => x.default as LocaleStrings),
  "ja": import("../../static/locales/ja.json").then(x => x.default as LocaleStrings),
  "ko": import("../../static/locales/ko.json").then(x => x.default as LocaleStrings),
  "nb": import("../../static/locales/nb.json").then(x => x.default as LocaleStrings),
  "nl": import("../../static/locales/nl.json").then(x => x.default as LocaleStrings),
  "pl": import("../../static/locales/pl.json").then(x => x.default as LocaleStrings),
  "pt-BR": import("../../static/locales/pt-BR.json").then(x => x.default as LocaleStrings),
  "pt-PT": import("../../static/locales/pt-PT.json").then(x => x.default as LocaleStrings),
  "ro": import("../../static/locales/ro.json").then(x => x.default as LocaleStrings),
  "ru": import("../../static/locales/ru.json").then(x => x.default as LocaleStrings),
  "sk": import("../../static/locales/sk.json").then(x => x.default as LocaleStrings),
  "sr": import("../../static/locales/sr.json").then(x => x.default as LocaleStrings),
  "sv": import("../../static/locales/sv.json").then(x => x.default as LocaleStrings),
  "tr": import("../../static/locales/tr.json").then(x => x.default as LocaleStrings),
  "uk": import("../../static/locales/uk.json").then(x => x.default as LocaleStrings),
  "vi": import("../../static/locales/vi.json").then(x => x.default as LocaleStrings),
  "zh": import("../../static/locales/zh.json").then(x => x.default as LocaleStrings),
};
