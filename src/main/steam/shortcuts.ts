import { app } from "electron";
import { Game } from "common/butlerd/messages";
import env from "main/env";
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
  CompatToolSync,
  DEFAULT_COMPAT_TOOL,
  readCompatToolMappings,
  syncCompatToolMappings,
} from "main/steam/compat-tools";
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
  root: string;
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
  return {
    root,
    configDir,
    shortcutsPath: join(configDir, "shortcuts.vdf"),
  };
}

// Our shortcuts are identified by one of two markers, not by title or
// exe path: those can change between add and remove, and titles can
// collide with shortcuts the user created themselves. "itch" mode
// entries carry an itch:// (or kitch://) url in LaunchOptions on macOS
// and --run-game arguments elsewhere. Entries with neither carry the id
// in DevkitGameID, a Steam schema field verified to survive Steam's
// rewrite-on-exit (an invented key would be dropped); every entry we
// write sets it.
const markerRe = /(?:itch|kitch):\/\/install\?game_id=(\d+)/;
const devkitRe = /^itch-game-(\d+)$/;
const runnerRe = /--run-game/;
const runnerProfileRe = /--profile-id"?\s+"?(\d+)/;

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

// both the url form (macOS) and the --run-game form count as "itch";
// entries in the wrong form for this platform heal through repair
function entryMode(entry: VdfObject): SteamShortcutMode {
  const launchOptions = getField(entry, "LaunchOptions");
  if (typeof launchOptions === "string") {
    if (markerRe.test(launchOptions) || runnerRe.test(launchOptions)) {
      return "itch";
    }
  }
  return "direct";
}

/** profile baked into an itch entry's LaunchOptions, if any */
function entryProfileId(entry: VdfObject): number | undefined {
  const launchOptions = getField(entry, "LaunchOptions");
  if (typeof launchOptions === "string") {
    const m = runnerProfileRe.exec(launchOptions);
    if (m) {
      return parseInt(m[1], 10);
    }
  }
  return undefined;
}

interface Launcher {
  exePath: string;
  prefixArgs: string[];
}

// macOS lacks the stable itch-setup copy and arg forwarding needed for
// --run-game (see macos-runner-parity.md), so it keeps launching the app
// with an url instead
const runnerPlatform =
  process.platform === "linux" || process.platform === "win32";

// The versioned app exe moves on every self-update, so shortcuts target
// the stable itch-setup copy, same one the installer maintains. No
// launcher means an error rather than a fallback to the versioned exe,
// which would break on the next update.
function resolveLauncher(): Launcher {
  const appName = env.appName;
  switch (process.platform) {
    case "linux": {
      const setup = join(homedir(), `.${appName}`, "itch-setup");
      if (existsSync(setup)) {
        return { exePath: setup, prefixArgs: ["--appname", appName] };
      }
      throw new SteamError("no-launcher");
    }
    case "win32": {
      const localAppData = process.env.LOCALAPPDATA;
      if (localAppData) {
        const setup = join(localAppData, appName, "itch-setup.exe");
        if (existsSync(setup)) {
          return { exePath: setup, prefixArgs: ["--appname", appName] };
        }
      }
      throw new SteamError("no-launcher");
    }
  }
  if (app.isPackaged) {
    return { exePath: app.getPath("exe"), prefixArgs: [] };
  }
  // in dev, app.getPath("exe") is the bare Electron binary, which would
  // treat the itch:// url argument as an app path to load
  for (const dir of ["/Applications", join(homedir(), "Applications")]) {
    const exe = join(dir, `${appName}.app`, "Contents", "MacOS", appName);
    if (existsSync(exe)) {
      return { exePath: exe, prefixArgs: [] };
    }
  }
  throw new SteamError("no-launcher");
}

// Steam only runs a Windows executable through Proton when config.vdf
// maps the shortcut to a compatibility tool, so on Linux direct entries
// for .exe targets carry such a mapping (see compat-tools.ts)
const compatPlatform = process.platform === "linux";

function isWindowsExe(path: string): boolean {
  return /\.exe$/i.test(path);
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
function appUrlLaunchOptions(launcher: Launcher, gameId: number): string {
  // kitch only handles kitch:// urls, so the scheme follows the app
  const url = `${env.appName}://install?game_id=${gameId}&launch`;
  return [...launcher.prefixArgs, url].map((arg) => `"${arg}"`).join(" ");
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
  gameId: number,
  profileId: number | undefined
): CanonicalShortcutFields {
  const exe = `"${launcher.exePath}"`;
  if (!runnerPlatform) {
    return {
      exe,
      startDir: `"${dirname(launcher.exePath)}"`,
      launchOptions: appUrlLaunchOptions(launcher, gameId),
      appid: shortcutEntryId(exe, appidKey(gameId)),
      // the overlay's preload breaks Chromium's single-instance
      // handshake, so launches silently no-op while the app is running
      allowOverlay: 0,
      devkitGameId: appidKey(gameId),
    };
  }
  // the game runs as a child of this process tree and should get Steam's
  // overlay preload; the app-handoff path strips it on the itch-setup side
  const args = [...launcher.prefixArgs, "--run-game", String(gameId)];
  if (profileId) {
    args.push("--profile-id", String(profileId));
  }
  return {
    exe,
    startDir: `"${dirname(launcher.exePath)}"`,
    launchOptions: args.map((arg) => `"${arg}"`).join(" "),
    appid: shortcutEntryId(exe, appidKey(gameId)),
    allowOverlay: 1,
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
  /** profile play sessions are attributed to; "itch" mode only */
  profileId?: number;
}

export interface ApplyShortcutsInput {
  /**
   * Games whose shortcuts should exist. Existing entries are rewritten
   * in canonical form for the requested mode (healing stale launchers
   * and mode switches); new ones are appended with freshly downloaded
   * grid art.
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
  // new unsigned appid -> old one, for entries healed to a new id
  const appidRenames = new Map<number, number>();

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
      appidRenames.set(fields.appid >>> 0, oldAppid >>> 0);
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
    return canonicalItchFields(launcher!, item.game.id, item.profileId);
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
      // the baked profile is preserved: only the launcher-derived
      // fields are being healed
      if (
        canonicalize(
          entry,
          canonicalItchFields(launcher, entryId, entryProfileId(entry))
        )
      ) {
        changed = true;
      }
    }
  }

  const compatSync = compatPlatform
    ? planCompatToolSync(ctx.root, kept, removed, ensure, appidRenames)
    : null;
  const compatChanged =
    compatSync !== null &&
    (compatSync.ensure.size > 0 || compatSync.remove.length > 0);

  if (!changed && !compatChanged) {
    return;
  }

  // art downloads above can take a while: re-check that Steam didn't
  // start in the meantime before replacing the file
  if (await isSteamRunning()) {
    throw new SteamError("steam-running");
  }

  // Mappings are added before the shortcuts write and removed after it,
  // so a failure in between never leaves a .exe entry without its
  // mapping (Steam would exec it natively); a stray extra mapping on an
  // entry that failed to switch is harmless.
  let compatBackupTaken = false;
  if (compatSync && compatSync.ensure.size > 0) {
    syncCompatToolMappings(ctx.root, { ensure: compatSync.ensure, remove: [] });
    compatBackupTaken = true;
  }
  const removeCompatMappings = () => {
    if (compatSync && compatSync.remove.length > 0) {
      syncCompatToolMappings(
        ctx.root,
        { ensure: new Map(), remove: compatSync.remove },
        { backup: !compatBackupTaken }
      );
    }
  };
  if (!changed) {
    removeCompatMappings();
    return;
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
  // a failure here leaves the entry mapped; the snapshot flags that as
  // a repair so the next save removes it
  removeCompatMappings();

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

/**
 * Which of our entries need a compatibility tool mapping and which must
 * lose theirs. Ensured entries follow their resolved target; other
 * direct entries pointing at a .exe get a mapping healed in with the
 * default tool; everything else (itch mode, removed, retired appids)
 * must not be mapped, or itch-setup itself would run under Proton.
 */
function planCompatToolSync(
  root: string,
  kept: VdfObject[],
  removed: VdfObject[],
  ensure: EnsureShortcut[],
  appidRenames: Map<number, number>
): CompatToolSync {
  const existing = readCompatToolMappings(root);
  const sync: CompatToolSync = { ensure: new Map(), remove: [] };
  const ensuredTools = new Map<number, string | undefined>();
  for (const item of ensure) {
    ensuredTools.set(
      item.game.id,
      item.mode === "direct" ? item.target?.compatTool : undefined
    );
  }
  for (const entry of kept) {
    const gameId = entryGameId(entry);
    const appid = getField(entry, "appid");
    if (gameId === null || typeof appid !== "number") {
      continue;
    }
    const unsignedId = appid >>> 0;
    const exe = getField(entry, "Exe");
    const mappingKey = unsignedId.toString();
    const hasMapping = existing.has(mappingKey);
    const mappedTool = existing.get(mappingKey) || undefined;
    let wantsTool: string | undefined;
    if (ensuredTools.has(gameId)) {
      wantsTool = ensuredTools.get(gameId);
    } else if (
      entryMode(entry) === "direct" &&
      typeof exe === "string" &&
      isWindowsExe(unquote(exe))
    ) {
      wantsTool = DEFAULT_COMPAT_TOOL;
    }
    if (wantsTool && !mappedTool) {
      // an entry healed to a new appid keeps the tool the user had
      const previous = appidRenames.get(unsignedId);
      const carried =
        previous !== undefined ? existing.get(previous.toString()) : undefined;
      sync.ensure.set(unsignedId, carried || wantsTool);
    } else if (!wantsTool && hasMapping) {
      sync.remove.push(unsignedId);
    }
  }
  const gone = [
    ...appidRenames.values(),
    ...removed.map((entry) => getField(entry, "appid")),
  ];
  for (const appid of gone) {
    if (typeof appid === "number" && existing.has((appid >>> 0).toString())) {
      sync.remove.push(appid >>> 0);
    }
  }
  return sync;
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
  // null when config.vdf is unreadable: nothing is flagged then, since
  // a repair could never succeed
  let compatMappings: Map<string, string> | null = null;
  if (compatPlatform) {
    try {
      compatMappings = readCompatToolMappings(snapshot.steamRoot);
    } catch (e) {
      logger.warn(`could not read Steam compat tool mappings: ${e}`);
    }
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
    const mappingKey =
      typeof appid === "number" ? (appid >>> 0).toString() : null;
    const hasMapping =
      mappingKey !== null && (compatMappings?.has(mappingKey) ?? false);
    const mappedTool =
      mappingKey !== null ? compatMappings?.get(mappingKey) : undefined;
    const wantsMapping = mode === "direct" && isWindowsExe(exePath);
    const missingCompatTool =
      wantsMapping && compatMappings !== null && !mappedTool;
    // a mapping left on an entry that no longer targets a .exe (a save
    // that failed after writing shortcuts.vdf) would run the launcher
    // under Proton; the next save removes it
    const strayCompatTool = !wantsMapping && hasMapping;
    let needsRepair: boolean;
    if (mode === "direct") {
      // whether the exe still matches the game's current launch target
      // needs butlerd, which this module can't reach; the dialog layers
      // that check on top
      needsRepair =
        staleExe ||
        missingCompatTool ||
        strayCompatTool ||
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
      needsRepair =
        strayCompatTool ||
        (launcher
          ? entryNeedsRepair(
              entry,
              canonicalItchFields(launcher, gameId, entryProfileId(entry))
            )
          : staleExe);
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
      missingCompatTool,
    };
    snapshot.entries.push(summary);
  }

  return snapshot;
}
