export function getResponseHeader(
  responseHeaders: Record<string, string[]> | undefined,
  headerName: string
): string | null {
  if (!responseHeaders) {
    return null;
  }

  let value = responseHeaders[headerName];
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && typeof value.length === "number") {
    return value[0];
  }

  return null;
}
