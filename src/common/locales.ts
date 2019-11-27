export interface CurrentLocale {
  lang: string;
  strings: LocaleStrings;
}

export interface LocaleStrings {
  [key: string]: string;
}
