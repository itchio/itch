export type JSONField<T> = string;

export function fromJSONField<T>(source: JSONField<T>, fallback: T = null): T {
  if (!source) {
    return fallback;
  }

  if (typeof source !== "string") {
    return source as T;
  }

  try {
    const result = JSON.parse(source);
    return result ? result : fallback;
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
