import IntlMessageFormat from "intl-messageformat";

import { II18nState, ILocalizedString } from "../types";

const emptyObj = {};

/**
 * Returns the input if it's a string, or a localized message if
 * the input is in the form [i18nKeys, {i18nValue1: foo, i18nValue2: bar}?]
 */
export function t(i18n: II18nState, input: string | ILocalizedString): string {
  if (!input) {
    return "";
  }

  if (Array.isArray(input)) {
    if (input.length < 1) {
      return "";
    }

    const { strings, lang } = i18n;
    const messages = strings[lang] || strings[lang.substring(0, 2)] || emptyObj;
    const enMessages = strings.en || emptyObj;
    const [key, values] = input;
    const message = messages[key] || enMessages[key] || key;
    const formatter = new IntlMessageFormat(message, lang);
    return formatter.format(values);
  } else {
    return input;
  }
}
