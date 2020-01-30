import IntlMessageFormat from "intl-messageformat";

import { MainState } from "main";
import _ from "lodash";

const emptyObj = {};

/**
 * Returns the input if it's a string, or a localized message if
 * the input is in the form [i18nKeys, {i18nValue1: foo, i18nValue2: bar}?]
 */
export function formatMessage(
  ms: MainState,
  template: {
    id: string;
    values?: Record<string, string | number | boolean | null | undefined>;
  }
): string {
  const locales = [ms.localeState?.current?.lang ?? "en-US"];
  const message =
    ms.localeState?.current.strings[template.id] ||
    ms.localeState?.englishStrings[template.id] ||
    template.id;
  const formatter = new IntlMessageFormat(message, locales);
  return formatter.format(template.values);
}
