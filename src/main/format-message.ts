import IntlMessageFormat from "intl-messageformat";

import { MainState } from "main";
import _ from "lodash";

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
