import { IntlMessageFormat } from "intl-messageformat";

import { I18nResources, I18nState, LocalizedString } from "common/types";

const emptyObj: I18nResources = {};

/**
 * Locale strings may use <strong>/<em>/<code> tags; only React contexts
 * render them (via IntlProvider's defaultRichTextElements). String
 * contexts use these handlers to collapse them to plain text.
 */
export const stripRichTags = {
  strong: (chunks: string[]) => collapseIntlChunks(chunks),
  em: (chunks: string[]) => collapseIntlChunks(chunks),
  code: (chunks: string[]) => collapseIntlChunks(chunks),
};

/**
 * Returns the input if it's a string, or a localized message if
 * the input is in the form [i18nKeys, {i18nValue1: foo, i18nValue2: bar}?]
 */
export function t(i18n: I18nState, input: string | LocalizedString): string {
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
    const message =
      messages[key] ||
      enMessages[key] ||
      (values && values.defaultValue) ||
      key;
    try {
      const formatter = new IntlMessageFormat(message, lang);
      return collapseIntlChunks(
        formatter.format<string>({ ...stripRichTags, ...values })
      );
    } catch (e) {
      // a malformed translation shouldn't take the UI down with it
      return message;
    }
  } else {
    return input;
  }
}

export function collapseIntlChunks(s: string | string[]): string {
  if (Array.isArray(s)) {
    return s.join("");
  } else {
    return s;
  }
}
