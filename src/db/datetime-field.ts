export type DateTimeField = string;

export function fromDateTimeField(input: any): Date {
  if (!input) {
    return null;
  }

  const type = typeof input;
  let d: Date = null;
  if (type === "number") {
    d = new Date(input);
  } else if (type === "string") {
    d = new Date(input + "+0");
  } else if (input instanceof Date) {
    d = input;
  } else {
    // invalid dates = null;
  }
  if (d) {
    d.setMilliseconds(0);
  }
  return d;
}

export function toDateTimeField(input: any): DateTimeField {
  const value = fromDateTimeField(input);
  if (!value) {
    return null;
  }

  return (
    formatZerolessValue(value.getUTCFullYear()) +
    "-" +
    formatZerolessValue(value.getUTCMonth() + 1) +
    "-" +
    formatZerolessValue(value.getUTCDate()) +
    " " +
    formatZerolessValue(value.getUTCHours()) +
    ":" +
    formatZerolessValue(value.getUTCMinutes()) +
    ":" +
    formatZerolessValue(value.getUTCSeconds())
  );
}

function formatZerolessValue(value: number): string {
  if (value < 10) {
    return "0" + value;
  }

  return String(value);
}
