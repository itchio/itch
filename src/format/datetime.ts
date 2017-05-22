
import {ILocalizer} from "../localizer";

/**
 * Return an input suitable for t.format() for a duration.
 */
export function formatDuration(secs: number, t: ILocalizer): string {
  if (secs < 60) {
    return t.format(["duration.minute"]);
  } else if (secs < 3600) {
    return t.format(["duration.minutes", { x: Math.floor(secs / 60).toFixed() }]);
  } else if (secs < 3600 * 2) {
    return t.format(["duration.hour"]);
  } else {
    return t.format(["duration.hours", { x: Math.floor(secs / 3600).toFixed() }]);
  }
}

interface IDateFormat {
  key: number;
  options: Intl.DateTimeFormatOptions;
}

const formatterCache = new Map<number, Map<string, Intl.DateTimeFormat>>();

/**
 * Format a date for humans in the given locale
 */

export function formatDate(date: Date, locale: string, format: IDateFormat): string {
  return getFormatter(format, locale).format(date);
}

// Get a formatter, cached by format & locale
function getFormatter(format: IDateFormat, locale: string): Intl.DateTimeFormat {
  let localeCache = formatterCache.get(format.key);
  if (!localeCache) {
    localeCache = new Map<string, Intl.DateTimeFormat>();
    formatterCache.set(format.key, localeCache);
  }

  let formatter = localeCache.get(locale);
  if (!formatter) {
    let locales = [locale];
    let stripped = locale.replace(/-.*$/, "");
    if (stripped !== locale) {
      locales = [locale, stripped];
    }
    formatter = new Intl.DateTimeFormat(locales, format.options);
  }
  return formatter;
}

export const DATE_FORMAT: IDateFormat = {
  key: 1,
  options: {
    year: "numeric",
    month: "long",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    day: "numeric",
    hour12: false,
  },
};

export const FS_DATE_FORMAT: IDateFormat = {
  key: 2,
  options: "YYYY.MM.DD-HH.mm.ss",
};

export function elapsed (t1: number, t2: number) {
  return (t2 - t1).toFixed(2) + "ms";
}
