import IntlMessageFormat from "intl-messageformat";

import { II18nState } from "../types";

const emptyObj = {};

export function t(i18n: II18nState, input: any): string {
  if (!input) {
    return input;
  }

  if (Array.isArray(input)) {
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
