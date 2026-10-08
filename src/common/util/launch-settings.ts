import { Action } from "common/butlerd/messages";

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

/** butler compares launch target paths as slash paths without a leading "./" */
export function normalizeTargetPath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\.\//, "");
}

/**
 * Whether butler made this action up for a bare executable rather than
 * reading it from a manifest: those are named after the file, plus its size.
 */
export function isImplicitAction(action: Action): boolean {
  const base = normalizeTargetPath(action.path).replace(/^.*\//, "");
  return action.name === base || action.name.startsWith(`${base} (`);
}

/** The action's name without the size butler appends to implicit ones */
export function launchTargetDisplayName(action: Action): string {
  if (isImplicitAction(action)) {
    return normalizeTargetPath(action.path).replace(/^.*\//, "");
  }
  return action.name;
}

/**
 * The string saved as a cave's launchTarget for a launch target's action.
 *
 * butler matches it against action names first, then paths. Manifest
 * actions go by name: it's what the developer meant, and two actions can
 * share a path (play, play --editor). Implicit targets' names change on
 * every update, so those go by path.
 */
export function launchTargetKey(action: Action): string {
  return isImplicitAction(action)
    ? normalizeTargetPath(action.path)
    : action.name;
}
