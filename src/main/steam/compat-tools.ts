import { mainLogger } from "main/logger";
import {
  getTextField,
  getTextObject,
  parseTextVdf,
  TextVdfObject,
  writeTextVdf,
} from "main/steam/text-vdf";
import {
  copyFileSync,
  existsSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "fs";
import { join } from "path";

const logger = mainLogger.child(__filename);

// Steam runs a non-Steam shortcut's .exe natively, where it dies, unless
// config.vdf maps the shortcut's appid to a compatibility tool. Tools are
// named by their internal id, e.g. "proton_experimental" or "GE-Proton9-20".

/**
 * The tool every Windows-exe shortcut is mapped to. Steam installs it on
 * first launch when it is missing, and the user can pick a different
 * tool per shortcut in Steam's own properties dialog; existing mappings
 * are never overwritten here.
 */
export const DEFAULT_COMPAT_TOOL = "proton_experimental";

function configPath(root: string): string {
  return join(root, "config", "config.vdf");
}

// InstallConfigStore/Software/Valve/Steam/CompatToolMapping; casing of
// the intermediate keys varies between Steam versions
function steamSection(config: TextVdfObject): TextVdfObject | null {
  const store = getTextObject(config, "InstallConfigStore");
  const software = store && getTextObject(store, "Software");
  const valve = software && getTextObject(software, "Valve");
  return (valve && getTextObject(valve, "Steam")) ?? null;
}

/**
 * Unsigned appid (as decimal string) -> tool name, "0" being the
 * Steam-wide default. Throws when config.vdf can't be parsed: callers
 * planning mutations must not mistake an unreadable file for "nothing
 * mapped" (an itch-mode entry would keep a Proton mapping).
 */
export function readCompatToolMappings(root: string): Map<string, string> {
  const result = new Map<string, string>();
  const path = configPath(root);
  if (!existsSync(path)) {
    return result;
  }
  const config = parseTextVdf(readFileSync(path, "utf8"));
  const steam = steamSection(config);
  const mappings = steam && getTextObject(steam, "CompatToolMapping");
  for (const [appid, entry] of mappings ?? []) {
    const name = typeof entry === "object" && getTextField(entry, "name");
    if (typeof name === "string") {
      result.set(appid, name);
    }
  }
  return result;
}

export interface CompatToolSync {
  /** unsigned appids that need a mapping, with the tool to use when adding */
  ensure: Map<number, string>;
  /** unsigned appids whose mapping should go */
  remove: number[];
}

/**
 * Adds missing mappings and drops unwanted ones. An existing mapping is
 * left alone even if it names a different tool: the user may have
 * picked one in Steam's own properties dialog. Steam must not be
 * running (it rewrites config.vdf on exit, like shortcuts.vdf).
 */
export function syncCompatToolMappings(
  root: string,
  sync: CompatToolSync,
  options: {
    /**
     * false when an earlier write in the same save already took the
     * backup: overwriting it would leave a mid-save state to restore
     */
    backup: boolean;
  } = { backup: true }
) {
  const path = configPath(root);
  if (!existsSync(path)) {
    throw new Error(`${path} does not exist`);
  }
  const text = readFileSync(path, "utf8");
  // a parse failure aborts: never overwrite a config.vdf we couldn't
  // fully round-trip
  const config = parseTextVdf(text);
  const steam = steamSection(config);
  if (!steam) {
    throw new Error("unrecognized config.vdf structure");
  }
  let mappings = getTextObject(steam, "CompatToolMapping");
  if (!mappings) {
    mappings = new Map();
    steam.set("CompatToolMapping", mappings);
  }

  let changed = false;
  for (const appid of sync.remove) {
    if (mappings.delete(appid.toString())) {
      changed = true;
    }
  }
  for (const [appid, tool] of sync.ensure) {
    const key = appid.toString();
    const current = mappings.get(key);
    const currentName =
      typeof current === "object" ? getTextField(current, "name") : undefined;
    // Preserve a real user-selected tool, but heal the blank mapping
    // Steam can leave behind when a previously selected tool disappears.
    if (typeof currentName === "string" && currentName !== "") {
      continue;
    }
    mappings.set(
      key,
      new Map<string, string>([
        ["name", tool],
        ["config", ""],
        ["priority", "250"],
      ])
    );
    changed = true;
  }
  if (!changed) {
    return;
  }

  if (options.backup) {
    copyFileSync(path, `${path}.itch-bak`);
  }
  // atomic swap: a crash mid-write must not truncate Steam's main config
  const tmp = `${path}.itch-tmp`;
  writeFileSync(tmp, writeTextVdf(config));
  renameSync(tmp, path);
  logger.info(
    `updated Steam compat tool mappings: ensured ${sync.ensure.size}, removed ${sync.remove.length}`
  );
}
