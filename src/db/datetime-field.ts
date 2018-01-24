export function fromDateTimeField(input: any): Date {
  if (input === null || input === undefined) {
    return null;
  }

  const type = typeof input;
  let d: Date = null;
  if (type === "number") {
    d = new Date(input);
  } else if (type === "string") {
    // we support two string formats:
    if (input.lastIndexOf("Z") === input.length - 1) {
      // "2006-01-02T15:04:05Z" (ISO-8601)
      d = new Date(input);
    } else {
      // "2006-01-02 15:04:05'
      d = new Date(input + "+0");
    }
  } else if (input instanceof Date) {
    d = input;
  } else {
    // invalid dates = null;
  }
  return d;
}

export function toDateTimeField(input: any): any {
  const value = fromDateTimeField(input);
  if (value === null) {
    return null;
  }

  // "2006-01-02T15:04:05Z" (ISO-8601)
  return value.toISOString();
}
