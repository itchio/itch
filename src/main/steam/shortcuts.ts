import { app } from "electron";
import { Game } from "common/butlerd/messages";
import { mainLogger } from "main/logger";
import {
  parseBinaryVdf,
  writeBinaryVdf,
  VdfObject,
  VdfValue,
} from "main/steam/binary-vdf";
import { shortcutEntryId, shortAppId } from "main/steam/appid";
import {
  getSteamRoot,
  getActiveUserId,
  isSteamRunning,
} from "main/steam/steam-install";
import { downloadGridArt, removeGridArt } from "main/steam/grid-art";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import { homedir } from "os";
import { dirname, join } from "path";

const logger = mainLogger.child(__filename);

export type SteamErrorCode =
  | "no-steam"
  | "no-user"
  | "no-launcher"
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

// Our shortcuts are identified by this marker in LaunchOptions, not by
// title or exe path: those can change between add and remove, and titles
// can collide with shortcuts the user created themselves.
const markerRe = /itch:\/\/install\?game_id=(\d+)/;

function entryGameId(entry: VdfObject): number | null {
  const launchOptions = getField(entry, "LaunchOptions");
  if (typeof launchOptions !== "string") {
    return null;
  }
  const m = markerRe.exec(launchOptions);
  return m ? parseInt(m[1], 10) : null;
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
function appidKey(game: Game): string {
  return `itch-game-${game.id}`;
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
  writeFileSync(path, writeBinaryVdf(root));
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

export function addShortcut(game: Game): Promise<void> {
  return serialized(() => performAddShortcut(game));
}

export function removeShortcut(gameId: number): Promise<void> {
  return serialized(() => performRemoveShortcut(gameId));
}

async function performAddShortcut(game: Game): Promise<void> {
  if (await isSteamRunning()) {
    // Steam rewrites shortcuts.vdf from memory on exit, discarding edits
    // made while it runs
    throw new SteamError("steam-running");
  }
  const ctx = resolveContext();

  const root = readShortcutsFile(ctx.shortcutsPath);
  const table = getShortcutsTable(root);

  const launcher = resolveLauncher();
  const exe = `"${launcher.exePath}"`;
  const appid = shortcutEntryId(exe, appidKey(game));
  const shortId = shortAppId(exe, appidKey(game));

  let icon = "";
  try {
    icon = (await downloadGridArt(logger, ctx.configDir, shortId, game)) ?? "";
  } catch (e) {
    logger.warn(`could not download grid art for ${game.title}: ${e}`);
  }

  const existing = entriesOf(table).find((e) => entryGameId(e) === game.id);
  if (existing) {
    // refresh fields that may have gone stale (exe path changes across
    // app updates, titles get renamed)
    const oldAppid = getField(existing, "appid");
    if (typeof oldAppid === "number" && oldAppid !== appid) {
      removeGridArt(ctx.configDir, (oldAppid >>> 0).toString());
    }
    setField(existing, "AppName", game.title);
    setField(existing, "Exe", exe);
    setField(existing, "StartDir", `"${dirname(launcher.exePath)}"`);
    setField(existing, "LaunchOptions", launchOptionsFor(launcher, game.id));
    setField(existing, "appid", appid);
    // deliberately reverts a manual re-enable, since the overlay breaks
    // relaunch-while-running (see AllowOverlay below)
    setField(existing, "AllowOverlay", 0);
    if (icon) {
      setField(existing, "icon", icon);
    }
  } else {
    const indices = Object.keys(table)
      .map((k) => parseInt(k, 10))
      .filter((n) => Number.isFinite(n));
    const nextIndex = indices.length > 0 ? Math.max(...indices) + 1 : 0;
    table[nextIndex.toString()] = {
      appid,
      AppName: game.title,
      Exe: exe,
      StartDir: `"${dirname(launcher.exePath)}"`,
      icon,
      ShortcutPath: "",
      LaunchOptions: launchOptionsFor(launcher, game.id),
      IsHidden: 0,
      AllowDesktopConfig: 1,
      // the overlay's LD_PRELOAD breaks Chromium's single-instance
      // handshake, so launches silently no-op while the app is running
      AllowOverlay: 0,
      OpenVR: 0,
      Devkit: 0,
      DevkitGameID: "",
      DevkitOverrideAppID: 0,
      LastPlayTime: 0,
      FlatpakAppID: "",
      tags: {},
    };
  }

  mkdirSync(ctx.configDir, { recursive: true });
  writeShortcutsFile(ctx.shortcutsPath, root);
  logger.info(`added Steam shortcut for ${game.title} (${game.id})`);
}

async function performRemoveShortcut(gameId: number): Promise<void> {
  if (await isSteamRunning()) {
    throw new SteamError("steam-running");
  }
  const ctx = resolveContext();
  if (!existsSync(ctx.shortcutsPath)) {
    return;
  }

  const root = readShortcutsFile(ctx.shortcutsPath);
  const table = getShortcutsTable(root);

  const kept: VdfValue[] = [];
  const removed: VdfObject[] = [];
  for (const entry of Object.values(table)) {
    if (typeof entry !== "object") {
      // reindexing would re-key values we don't understand; leave the
      // file alone instead
      throw new Error("unexpected non-object entry in shortcuts table");
    }
    if (entryGameId(entry) === gameId) {
      removed.push(entry);
    } else {
      kept.push(entry);
    }
  }
  if (removed.length === 0) {
    return;
  }

  const reindexed: VdfObject = {};
  kept.forEach((entry, i) => {
    reindexed[i.toString()] = entry;
  });
  setField(root, "shortcuts", reindexed);
  writeShortcutsFile(ctx.shortcutsPath, root);

  for (const entry of removed) {
    // grid art is named after the unsigned form of the entry's appid
    const appid = getField(entry, "appid");
    if (typeof appid === "number") {
      removeGridArt(ctx.configDir, (appid >>> 0).toString());
    }
  }
  logger.info(`removed Steam shortcut for game ${gameId}`);
}

/**
 * Sync so it can run while building a context menu. Returns null when
 * Steam (or its active user) can't be located, and never throws.
 */
export function getShortcutState(gameId: number): "present" | "absent" | null {
  try {
    const ctx = resolveContext();
    if (!existsSync(ctx.shortcutsPath)) {
      return "absent";
    }
    const table = getShortcutsTable(readShortcutsFile(ctx.shortcutsPath));
    const present = entriesOf(table).some((e) => entryGameId(e) === gameId);
    return present ? "present" : "absent";
  } catch (e) {
    return null;
  }
}
