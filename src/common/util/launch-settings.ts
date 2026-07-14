/** Parses a comma or whitespace separated list of environment variable
 * names, dropping duplicates. */
export function parseSandboxAllowEnv(rawText?: string): string[] {
  if (!rawText) {
    return [];
  }

  const result: string[] = [];
  const seen = new Set<string>();

  for (const token of rawText.split(/[\s,]+/)) {
    const name = token.trim();
    if (!name || seen.has(name)) {
      continue;
    }
    seen.add(name);
    result.push(name);
  }

  return result;
}
