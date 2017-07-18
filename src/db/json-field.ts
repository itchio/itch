export type JSONField<T> = string;

export function fromJSONField<T>(source: JSONField<T>, fallback: T = null): T {
  if (typeof source !== "string") {
    return source as T;
  }

  try {
    return JSON.parse(source);
  } catch (e) {
    return fallback;
  }
}

export function toJSONField<T>(source: T): JSONField<T> {
  if (!source) {
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
