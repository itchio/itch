export function fromJSONField(source: any, fallback: any = null): any {
  if (source === null || source === undefined) {
    return fallback;
  }

  const type = typeof source;
  if (type !== "string") {
    if (type === "object") {
      return source;
    } else {
      return fallback;
    }
  }

  try {
    const result = JSON.parse(source as string);
    return result ? result : fallback;
  } catch (e) {
    return fallback;
  }
}

export function toJSONField(source: any): any {
  if (source === null || source === undefined) {
    return null;
  }

  if (typeof source === "string") {
    return source;
  }

  try {
    return JSON.stringify(source);
  } catch (e) {
    return null;
  }
}
