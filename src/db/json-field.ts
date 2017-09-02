export type JSONField = string;

export function fromJSONField<T>(source: JSONField, fallback: T = null): T {
  if (source === null || source === undefined) {
    return fallback;
  }

  const type = typeof source;
  if (type !== "string") {
    if (type === "object") {
      return (source as any) as T;
    } else {
      return fallback;
    }
  }

  try {
    const result = JSON.parse(source);
    return result ? result : fallback;
  } catch (e) {
    return fallback;
  }
}

export function toJSONField<T>(source: T): JSONField {
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
