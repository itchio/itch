export function getResponseHeader(
  responseHeaders: Record<string, string | string[]> | undefined,
  headerName: string
): string | null {
  if (!responseHeaders) {
    return null;
  }

  let value = responseHeaders[headerName];
  // `string` type
  if (typeof value === "string") {
    return value;
  }

  // `string[]` type
  if (typeof value === "object" && typeof value.length === "number") {
    return value[0];
  }

  return null;
}
