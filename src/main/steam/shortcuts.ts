import { app } from "electron";
import { Game } from "common/butlerd/messages";
import { mainLogger } from "main/logger";
import {
  parseBinaryVdf,
  writeBinaryVdf,
  VdfObject,
  VdfValue,
} from "main/steam/binary-vdf";
import { shortcutEntryId } from "main/steam/appid";
import {
  getSteamRoot,
  getActiveUserId,
  isSteamRunning,
} from "main/steam/steam-install";
import {
  downloadGridArt,
  removeGridArt,
  renameGridArt,
} from "main/steam/grid-art";
import { syncItchCollection } from "main/steam/collections";
import {
  SteamDirectTarget,
  SteamShortcutEntrySummary,
  SteamShortcutMode,
  SteamShortcutsSnapshot,
} from "common/types/steam";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "fs";
import { homedir } from "os";
import { dirname, join } from "path";

const logger = mainLogger.child(__filename);

export type SteamErrorCode =
  | "no-steam"
  | "no-user"
  | "no-launcher"
  | "no-target"
  | "steam-running";

export class SteamError extends Error {
  constructor(public code: SteamErrorCode) {
    super(`steam integration error: ${code}`);
  }
}

interface SteamContext {
  configDir: string;
  shortcutsPath: string;
}

function resolveContext(): SteamContext {
  const root = getSteamRoot();
  if (!root) {
    throw new SteamError("no-steam");
  }
  const userId = getActiveUserId(root);
  if (!userId) {
    throw new SteamError("no-user");
  }
  const configDir = join(root, "userdata", userId, "config");
  return { configDir, shortcutsPath: join(configDir, "shortcuts.vdf") };
}

// Our shortcuts are identified by one of two markers, not by title or
// exe path: those can change between add and remove, and titles can
// collide with shortcuts the user created themselves. "itch" mode
// entries carry an itch:// url in LaunchOptions; "direct" mode entries
// have no url, so they carry the id in DevkitGameID, a Steam schema
// field verified to survive Steam's rewrite-on-exit (an invented key
// would be dropped).
const markerRe = /itch:\/\/install\?game_id=(\d+)/;
const devkitRe = /^itch-game-(\d+)$/;

function entryGameId(entry: VdfObject): number | null {
  const launchOptions = getField(entry, "LaunchOptions");
  if (typeof launchOptions === "string") {
    const m = markerRe.exec(launchOptions);
    if (m) {
      return parseInt(m[1], 10);
    }
  }
  const devkit = getField(entry, "DevkitGameID");
  if (typeof devkit === "string") {
    const m = devkitRe.exec(devkit);
    if (m) {
      return parseInt(m[1], 10);
    }
  }
  return null;
}

function entryMode(entry: VdfObject): SteamShortcutMode {
  const launchOptions = getField(entry, "LaunchOptions");
  return typeof launchOptions === "string" && markerRe.test(launchOptions)
    ? "itch"
    : "direct";
}

interface Launcher {
  exePath: string;
  prefixArgs: string[];
}

// The versioned app exe moves on every self-update, so shortcuts target
// the stable itch-setup launcher, same as the desktop shortcuts the
// installer creates. Dev and canary builds deliberately point at the
// stable itch install too. No launcher means an error rather than a
// fallback to the versioned exe, which would break on the next update.
// macOS keeps the app bundle exe: its path is stable and itch-setup
// doesn't forward args there.
function resolveLauncher(): Launcher {
  switch (process.platform) {
    case "linux": {
      const shim = join(homedir(), ".itch", "itch");
      if (existsSync(shim)) {
        return { exePath: shim, prefixArgs: [] };
      }
      throw new SteamError("no-launcher");
    }
    case "win32": {
      const localAppData = process.env.LOCALAPPDATA;
      if (localAppData) {
        const setup = join(localAppData, "itch", "itch-setup.exe");
        if (existsSync(setup)) {
          return {
            exePath: setup,
            prefixArgs: ["--prefer-launch", "--appname", "itch", "--"],
          };
        }
      }
      throw new SteamError("no-launcher");
    }
  }
  return { exePath: app.getPath("exe"), prefixArgs: [] };
}

// stable per-game id key: deriving from the title (as Steam does for its
// own shortcuts) would collide across same-titled games and change on
// renames
function appidKey(gameId: number): string {
  return `itch-game-${gameId}`;
}

function quoteWindowsArgument(arg: string): string {
  // CommandLineToArgvW quoting: backslashes only need doubling when they
  // precede a quote or the closing quote.
  let result = '"';
  let backslashes = 0;
  for (const char of arg) {
    if (char === "\\") {
      backslashes++;
      continue;
    }
    if (char === '"') {
      result += "\\".repeat(backslashes * 2 + 1) + '"';
    } else {
      result += "\\".repeat(backslashes) + char;
    }
    backslashes = 0;
  }
  return result + "\\".repeat(backslashes * 2) + '"';
}

function quotePosixArgument(arg: string): string {
  return `'${arg.replace(/'/g, `'\\''`)}'`;
}

/** Serializes an argv vector for Steam's non-Steam shortcut command line. */
export function encodeSteamArguments(args: string[]): string {
  const quote =
    process.platform === "win32" ? quoteWindowsArgument : quotePosixArgument;
  return args.map(quote).join(" ");
}

// Quoted so Steam's shell invocation on Linux doesn't interpret ? and &
function launchOptionsFor(launcher: Launcher, gameId: number): string {
  const url = `itch://install?game_id=${gameId}&launch`;
  const args = [...launcher.prefixArgs, url].map((arg) => `"${arg}"`).join(" ");
  if (process.platform === "linux") {
    // Steam LD_PRELOADs gameoverlayrenderer.so even with the overlay
    // toggle off (the game recording pipeline shares the hook), and it
    // crashes Chromium's sandboxed zygote, deadlocking app startup.
    // %command% expands to the shortcut's Exe.
    return `LD_PRELOAD="" %command% ${args}`;
  }
  return args;
}

function getField(entry: VdfObject, name: string): VdfValue | undefined {
  // Steam has written these keys with varying casing over the years
  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(entry)) {
    if (key.toLowerCase() === lower) {
      return value;
    }
  }
  return undefined;
}

function setField(entry: VdfObject, name: string, value: VdfValue) {
  const lower = name.toLowerCase();
  for (const key of Object.keys(entry)) {
    if (key.toLowerCase() === lower) {
      entry[key] = value;
      return;
    }
  }
  entry[name] = value;
}

interface CanonicalShortcutFields {
  exe: string;
  startDir: string;
  launchOptions: string;
  appid: number;
  allowOverlay: number;
  devkitGameId: string;
}

function canonicalItchFields(
  launcher: Launcher,
  gameId: number
): CanonicalShortcutFields {
  const exe = `"${launcher.exePath}"`;
  return {
    exe,
    startDir: `"${dirname(launcher.exePath)}"`,
    launchOptions: launchOptionsFor(launcher, gameId),
    appid: shortcutEntryId(exe, appidKey(gameId)),
    // the overlay's LD_PRELOAD breaks Chromium's single-instance
    // handshake, so launches silently no-op while the app is running
    allowOverlay: 0,
    devkitGameId: appidKey(gameId),
  };
}

function canonicalDirectFields(
  target: SteamDirectTarget,
  gameId: number
): CanonicalShortcutFields {
  const exe = `"${target.path}"`;
  return {
    exe,
    startDir: `"${dirname(target.path)}"`,
    launchOptions: target.launchOptions,
    appid: shortcutEntryId(exe, appidKey(gameId)),
    allowOverlay: 1,
    devkitGameId: appidKey(gameId),
  };
}

// titles are deliberately not checked here; the ensure path compares
// them against the fresh game record instead
function entryNeedsRepair(
  entry: VdfObject,
  fields: CanonicalShortcutFields
): boolean {
  const launchOptions = getField(entry, "LaunchOptions");
  return (
    getField(entry, "Exe") !== fields.exe ||
    getField(entry, "StartDir") !== fields.startDir ||
    launchOptions !== fields.launchOptions ||
    getField(entry, "appid") !== fields.appid ||
    getField(entry, "AllowOverlay") !== fields.allowOverlay ||
    getField(entry, "DevkitGameID") !== fields.devkitGameId
  );
}

function readShortcutsFile(path: string): VdfObject {
  if (!existsSync(path)) {
    return { shortcuts: {} };
  }
  // a parse failure aborts the whole operation: we must never overwrite a
  // shortcuts.vdf we couldn't fully round-trip
  return parseBinaryVdf(readFileSync(path));
}

function writeShortcutsFile(path: string, root: VdfObject) {
  if (existsSync(path)) {
    copyFileSync(path, `${path}.itch-bak`);
  }
  // atomic swap: a crash mid-write must not truncate the user's whole
  // shortcut list
  const tmp = `${path}.itch-tmp`;
  writeFileSync(tmp, writeBinaryVdf(root));
  renameSync(tmp, path);
}

function getShortcutsTable(root: VdfObject): VdfObject {
  const table = getField(root, "shortcuts");
  if (table !== undefined && typeof table !== "object") {
    // same rule as a parse failure: never rewrite a file whose structure
    // we don't recognize
    throw new Error("unexpected non-object 'shortcuts' value");
  }
  if (table) {
    return table;
  }
  const fresh: VdfObject = {};
  setField(root, "shortcuts", fresh);
  return fresh;
}

function entriesOf(table: VdfObject): VdfObject[] {
  return Object.values(table).filter(
    (v): v is VdfObject => typeof v === "object"
  );
}

// serializes the read-modify-write cycles on shortcuts.vdf; concurrent
// add/remove dispatches would otherwise clobber each other's writes
let mutationQueue: Promise<void> = Promise.resolve();

function serialized<T>(work: () => Promise<T>): Promise<T> {
  const run = mutationQueue.then(work);
  mutationQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

export interface EnsureShortcut {
  game: Game;
  mode: SteamShortcutMode;
  /** canonical executable and arguments; required for "direct" mode */
  target?: SteamDirectTarget;
}

export interface ApplyShortcutsInput {
  /**
   * Games whose shortcuts should exist. Existing entries are rewritten
   * in canonical form for the requested mode (healing stale launchers,
   * old id schemes, and mode switches); new ones are appended with
   * freshly downloaded grid art.
   */
  ensure: EnsureShortcut[];
  /**
   * Existing entries whose launcher-derived fields should be rewritten.
   * Only applies to "itch" mode entries: repairing a direct entry needs
   * a fresh target path, which only the ensure path carries.
   */
  repairGameIds: number[];
  /** game ids whose shortcuts should be removed */
  removeGameIds: number[];
  /** reports completed games while ensuring shortcut data and artwork */
  onProgress?: (completed: number, total: number) => void;
}

export function applyShortcuts(input: ApplyShortcutsInput): Promise<void> {
  return serialized(() => performApply(input));
}

async function performApply(input: ApplyShortcutsInput): Promise<void> {
  const removeSet = new Set(input.removeGameIds);
  const ensure = input.ensure.filter((e) => !removeSet.has(e.game.id));
  const repairSet = new Set(
    input.repairGameIds.filter((gameId) => !removeSet.has(gameId))
  );
  if (ensure.length === 0 && repairSet.size === 0 && removeSet.size === 0) {
    return;
  }
  if (await isSteamRunning()) {
    // Steam rewrites shortcuts.vdf from memory on exit, discarding edits
    // made while it runs
    throw new SteamError("steam-running");
  }
  const ctx = resolveContext();
  const root = readShortcutsFile(ctx.shortcutsPath);
  const table = getShortcutsTable(root);

  const kept: VdfObject[] = [];
  const removed: VdfObject[] = [];
  for (const entry of Object.values(table)) {
    if (typeof entry !== "object") {
      // reindexing would re-key values we don't understand; leave the
      // file alone instead
      throw new Error("unexpected non-object entry in shortcuts table");
    }
    const entryId = entryGameId(entry);
    if (entryId !== null && removeSet.has(entryId)) {
      removed.push(entry);
    } else {
      kept.push(entry);
    }
  }

  let changed = removed.length > 0;
  const retiredAppids: number[] = [];

  const canonicalize = (
    entry: VdfObject,
    fields: CanonicalShortcutFields
  ): boolean => {
    if (!entryNeedsRepair(entry, fields)) {
      return false;
    }
    const oldAppid = getField(entry, "appid");
    if (typeof oldAppid === "number" && oldAppid !== fields.appid) {
      // grid art is named after the unsigned form of the appid; carry
      // it over so healing an entry doesn't lose its art
      const oldShortId = (oldAppid >>> 0).toString();
      const newShortId = (fields.appid >>> 0).toString();
      retiredAppids.push(oldAppid >>> 0);
      renameGridArt(ctx.configDir, oldShortId, newShortId);
      const icon = getField(entry, "icon");
      if (typeof icon === "string" && icon.includes(oldShortId)) {
        setField(entry, "icon", icon.split(oldShortId).join(newShortId));
      }
    }
    setField(entry, "Exe", fields.exe);
    setField(entry, "StartDir", fields.startDir);
    setField(entry, "LaunchOptions", fields.launchOptions);
    setField(entry, "appid", fields.appid);
    setField(entry, "AllowOverlay", fields.allowOverlay);
    setField(entry, "DevkitGameID", fields.devkitGameId);
    return true;
  };

  const byGameId = new Map<number, VdfObject>();
  for (const entry of kept) {
    const entryId = entryGameId(entry);
    if (entryId !== null) {
      byGameId.set(entryId, entry);
    }
  }

  // Pure removals and direct-mode work do not depend on the itch
  // launcher. Itch-mode additions and explicitly requested repairs do.
  const launcher =
    ensure.some((e) => e.mode === "itch") || repairSet.size > 0
      ? resolveLauncher()
      : null;

  const fieldsFor = (item: EnsureShortcut): CanonicalShortcutFields => {
    if (item.mode === "direct") {
      if (!item.target) {
        throw new SteamError("no-target");
      }
      return canonicalDirectFields(item.target, item.game.id);
    }
    return canonicalItchFields(launcher!, item.game.id);
  };

  const ensuredIds = new Set<number>();
  for (const [gameIndex, item] of ensure.entries()) {
    const { game } = item;
    const fields = fieldsFor(item);
    const shortId = (fields.appid >>> 0).toString();
    ensuredIds.add(game.id);
    const existing = byGameId.get(game.id);
    if (existing) {
      if (canonicalize(existing, fields)) {
        changed = true;
      }
      if (getField(existing, "AppName") !== game.title) {
        setField(existing, "AppName", game.title);
        changed = true;
      }
      // heal art that failed to download when the entry was created
      const icon = getField(existing, "icon");
      if (typeof icon !== "string" || icon === "" || !existsSync(icon)) {
        try {
          const newIcon = await downloadGridArt(
            logger,
            ctx.configDir,
            shortId,
            game
          );
          if (newIcon) {
            setField(existing, "icon", newIcon);
            changed = true;
          }
        } catch (e) {
          logger.warn(`could not download grid art for ${game.title}: ${e}`);
        }
      }
      input.onProgress?.(gameIndex + 1, ensure.length);
      continue;
    }

    let icon = "";
    try {
      icon =
        (await downloadGridArt(logger, ctx.configDir, shortId, game)) ?? "";
    } catch (e) {
      logger.warn(`could not download grid art for ${game.title}: ${e}`);
    }
    kept.push({
      appid: fields.appid,
      AppName: game.title,
      Exe: fields.exe,
      StartDir: fields.startDir,
      icon,
      ShortcutPath: "",
      LaunchOptions: fields.launchOptions,
      IsHidden: 0,
      AllowDesktopConfig: 1,
      AllowOverlay: fields.allowOverlay,
      OpenVR: 0,
      Devkit: 0,
      DevkitGameID: fields.devkitGameId,
      DevkitOverrideAppID: 0,
      LastPlayTime: 0,
      FlatpakAppID: "",
      tags: {},
    });
    changed = true;
    input.onProgress?.(gameIndex + 1, ensure.length);
  }

  if (launcher) {
    for (const entryId of repairSet) {
      const entry = byGameId.get(entryId);
      if (!entry || ensuredIds.has(entryId) || entryMode(entry) === "direct") {
        continue;
      }
      if (canonicalize(entry, canonicalItchFields(launcher, entryId))) {
        changed = true;
      }
    }
  }

  if (!changed) {
    return;
  }

  // art downloads above can take a while: re-check that Steam didn't
  // start in the meantime before replacing the file
  if (await isSteamRunning()) {
    throw new SteamError("steam-running");
  }

  const reindexed: VdfObject = {};
  kept.forEach((entry, i) => {
    reindexed[i.toString()] = entry;
  });
  setField(root, "shortcuts", reindexed);
  mkdirSync(ctx.configDir, { recursive: true });
  writeShortcutsFile(ctx.shortcutsPath, root);

  for (const entry of removed) {
    const appid = getField(entry, "appid");
    if (typeof appid === "number") {
      retiredAppids.push(appid >>> 0);
      removeGridArt(ctx.configDir, (appid >>> 0).toString());
    }
  }

  // cosmetic: a failure here must not fail the save, the shortcuts
  // themselves are already written
  try {
    const collectionIds: number[] = [];
    for (const entry of kept) {
      if (entryGameId(entry) === null) {
        continue;
      }
      const appid = getField(entry, "appid");
      if (typeof appid === "number") {
        collectionIds.push(appid >>> 0);
      }
    }
    syncItchCollection(ctx.configDir, {
      ensure: collectionIds,
      remove: retiredAppids,
    });
  } catch (e) {
    logger.warn(`could not sync Steam collection: ${e}`);
  }
  logger.info(
    `applied Steam shortcuts: ensured ${ensure.length}, repaired ${repairSet.size}, removed ${removed.length}`
  );
}

function unquote(s: string): string {
  const m = /^"(.*)"$/.exec(s);
  return m ? m[1] : s;
}

/** never throws: every failure becomes a snapshot field */
export async function getSnapshot(): Promise<SteamShortcutsSnapshot> {
  const snapshot: SteamShortcutsSnapshot = {
    steamRoot: null,
    userId: null,
    shortcutsPath: null,
    fileExists: false,
    fileSize: null,
    fileMtimeMs: null,
    backupExists: false,
    steamRunning: false,
    totalEntries: null,
    parseError: null,
    lastOpError: null,
    entries: [],
  };

  try {
    snapshot.steamRunning = await isSteamRunning();
  } catch (e) {
    logger.warn(`could not check for running Steam: ${e}`);
  }

  snapshot.steamRoot = getSteamRoot();
  if (!snapshot.steamRoot) {
    return snapshot;
  }
  snapshot.userId = getActiveUserId(snapshot.steamRoot);
  if (!snapshot.userId) {
    return snapshot;
  }

  const configDir = join(
    snapshot.steamRoot,
    "userdata",
    snapshot.userId,
    "config"
  );
  const shortcutsPath = join(configDir, "shortcuts.vdf");
  snapshot.shortcutsPath = shortcutsPath;
  snapshot.backupExists = existsSync(`${shortcutsPath}.itch-bak`);
  if (!existsSync(shortcutsPath)) {
    return snapshot;
  }
  snapshot.fileExists = true;
  try {
    const stats = statSync(shortcutsPath);
    snapshot.fileSize = stats.size;
    snapshot.fileMtimeMs = stats.mtimeMs;
  } catch (e) {
    // fine without stats
  }

  let table: VdfObject;
  try {
    table = getShortcutsTable(readShortcutsFile(shortcutsPath));
  } catch (e) {
    snapshot.parseError = String(e);
    return snapshot;
  }

  let launcher: Launcher | null = null;
  try {
    launcher = resolveLauncher();
  } catch (e) {
    // repair detection degrades to an existence check
  }

  const all = Object.values(table);
  snapshot.totalEntries = all.length;
  for (const entry of all) {
    if (typeof entry !== "object") {
      continue;
    }
    const gameId = entryGameId(entry);
    if (gameId === null) {
      continue;
    }
    const appName = getField(entry, "AppName");
    const exe = getField(entry, "Exe");
    const launchOptions = getField(entry, "LaunchOptions");
    const appid = getField(entry, "appid");
    const icon = getField(entry, "icon");
    const mode = entryMode(entry);
    const exePath = typeof exe === "string" ? unquote(exe) : "";
    const staleExe =
      !exePath ||
      !existsSync(exePath) ||
      (mode === "itch" && launcher !== null && exePath !== launcher.exePath);
    let needsRepair: boolean;
    if (mode === "direct") {
      // whether the exe still matches the game's current launch target
      // needs butlerd, which this module can't reach; the dialog layers
      // that check on top
      needsRepair =
        staleExe ||
        (typeof exe === "string" &&
          entryNeedsRepair(
            entry,
            canonicalDirectFields(
              {
                path: unquote(exe),
                launchOptions:
                  typeof launchOptions === "string" ? launchOptions : "",
              },
              gameId
            )
          ));
    } else {
      needsRepair = launcher
        ? entryNeedsRepair(entry, canonicalItchFields(launcher, gameId))
        : staleExe;
    }
    const missingArt =
      typeof icon !== "string" || icon === "" || !existsSync(icon);
    const summary: SteamShortcutEntrySummary = {
      gameId,
      appName: typeof appName === "string" ? appName : "",
      appid: typeof appid === "number" ? appid : null,
      exe: typeof exe === "string" ? exe : "",
      launchOptions: typeof launchOptions === "string" ? launchOptions : "",
      mode,
      staleExe,
      needsRepair,
      missingArt,
    };
    snapshot.entries.push(summary);
  }

  return snapshot;
}
