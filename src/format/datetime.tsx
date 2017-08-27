import * as React from "react";
import { FormattedMessage } from "react-intl";

import env from "../env";

/**
 * Return an input suitable for t.format() for a duration.
 */
export function formatDuration(secs: number): JSX.Element {
  return <FormattedMessage {...formatDurationAsMessage(secs)} />;
}

interface IFormattedDuration {
  id: string;
  values?: {
    [key: string]: string;
  };
}

export function formatDurationAsMessage(secs: number): IFormattedDuration {
  if (secs < 120) {
    return { id: "duration.minute" };
  } else if (secs < 3600) {
    return {
      id: "duration.minutes",
      values: { x: Math.floor(secs / 60).toFixed() },
    };
  } else if (secs < 3600 * 2) {
    return { id: "duration.hour" };
  } else {
    return {
      id: "duration.hours",
      values: { x: Math.floor(secs / 3600).toFixed() },
    };
  }
}

interface IDateFormat {
  key: number;
  options: Intl.DateTimeFormatOptions;
}

const formatterCache = new Map<number, Map<string, Intl.DateTimeFormat>>();

export type MixedDate = Date | string | number;

/**
 * Format a date for humans in the given locale
 */

export function formatDate(
  date: Date,
  locale: string,
  format: IDateFormat
): string {
  if (!date) {
    return "";
  }

  if (!date.getTime || isNaN(date.getTime())) {
    return "Ø";
  }

  return getFormatter(format, locale).format(date);
}

// Get a formatter, cached by format & locale
function getFormatter(
  format: IDateFormat,
  locale: string
): Intl.DateTimeFormat {
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
    if (env.name === "test") {
      // use UTC for tests, keep using guessed locale for
      // development/production environments.
      (format.options as any).timeZone = "UTC";
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

export function elapsed(t1: number, t2: number) {
  return (t2 - t1).toFixed(2) + "ms";
}
