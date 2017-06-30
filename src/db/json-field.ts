export type JSONField = string;

export function fromJSONField<T>(source: JSONField): T {
  if (typeof source !== "string") {
    return source as T;
  }

  try {
    return JSON.parse(source);
  } catch (e) {
    return null;
  }
}

export function toJSONField<T>(source: T): JSONField {
  if (typeof source === "string") {
    return source;
  }

  try {
    return JSON.stringify(source);
  } catch (e) {
    return null;
  }
}
