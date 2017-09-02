// pretty dumb workaround to make typescript@2.5.2 happy :o
export type JSONField<T> = string | T;

export function fromJSONField<T, U extends T>(
  source: JSONField<T>,
  fallback: U = null
): T {
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
    const result = JSON.parse(source as string);
    return result ? result : fallback;
  } catch (e) {
    return fallback;
  }
}

export function toJSONField<T>(source: T): JSONField<T> {
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
