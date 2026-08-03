import env from "common/env";

interface FormattedDuration {
  id: string;
  values?: {
    [key: string]: number;
  };
}

export function formatDurationAsMessage(secs: number): FormattedDuration {
  if (secs < 60) {
    return {
      id: "duration.seconds",
      values: { x: Math.floor(secs) },
    };
  } else if (secs < 3600) {
    return {
      id: "duration.minutes",
      values: { x: Math.floor(secs / 60) },
    };
  } else {
    return {
      id: "duration.hours",
      values: { x: Math.floor(secs / 3600) },
    };
  }
}

export function formatPreciseDurationAsMessage(
  secs: number
): FormattedDuration {
  const totalMinutes = Math.floor(secs / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0 && minutes === 0) {
    return {
      id: "duration.precise.seconds_only",
      values: { seconds: Math.floor(secs % 60) },
    };
  }

  if (hours === 0) {
    return {
      id: "duration.precise.minutes_only",
      values: { minutes },
    };
  }

  if (minutes === 0) {
    return {
      id: "duration.precise.hours_only",
      values: { hours },
    };
  }

  return {
    id: "duration.precise.hours_minutes",
    values: { hours, minutes },
  };
}

export interface DateFormat {
  key: number;
  options: Intl.DateTimeFormatOptions;
}

const cacheByFormat = new Map<number, Map<string, Intl.DateTimeFormat>>();

/**
 * Format a date for humans in the given locale
 */

export function formatDate(
  date: Date,
  locale: string,
  format: DateFormat
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
export function getFormatter(
  format: DateFormat,
  locale: string
): Intl.DateTimeFormat {
  let cacheByLocale = cacheByFormat.get(format.key);
  if (!cacheByLocale) {
    cacheByLocale = new Map<string, Intl.DateTimeFormat>();
    cacheByFormat.set(format.key, cacheByLocale);
  }

  let formatter = cacheByLocale.get(locale);
  if (!formatter) {
    let locales = [locale];
    let stripped = locale.replace(/-.*$/, "");
    if (stripped !== locale) {
      locales = [locale, stripped];
    }
    if (env.integrationTests || env.unitTests) {
      // use UTC for tests, keep using guessed locale for
      // development/production environments.
      (format.options as any).timeZone = "UTC";
    }
    formatter = new Intl.DateTimeFormat(locales, format.options);
    cacheByLocale.set(locale, formatter);
  }
  return formatter;
}

export const DATE_FORMAT: DateFormat = {
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

export const MONTH_YEAR_FORMAT: DateFormat = {
  key: 2,
  options: {
    year: "numeric",
    month: "long",
  },
};

export const DAY_MONTH_FORMAT: DateFormat = {
  key: 3,
  options: {
    month: "long",
    day: "numeric",
  },
};

export function elapsed(t1: number, t2: number) {
  return (t2 - t1).toFixed(2) + "ms";
}
