import IntlMessageFormat from "intl-messageformat";

import { MainState } from "main";
import _ from "lodash";

export function formatMessage(
  ms: MainState,
  template: {
    id: string;
    values?: Record<string, string>;
  }
): string {
  const locales = [ms.localeState?.current?.lang ?? "en-US"];
  const message =
    ms.localeState?.current.strings[template.id] ||
    ms.localeState?.englishStrings[template.id] ||
    template.id;
  const formatter = new IntlMessageFormat(message, locales);
  // TODO: figure out this function signature..
  return formatter.format(template.values) as string;
}
