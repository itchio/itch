import { LocalizedString } from "common/types";

/**
 * "itch" shortcuts launch through the itch app via an itch:// url;
 * "direct" shortcuts point at the game's own executable, which gives up
 * update-before-play but gains the Steam overlay.
 */
export type SteamShortcutMode = "itch" | "direct";

/** Canonical command Steam should use for a resolved native launch target. */
export interface SteamDirectTarget {
  path: string;
  launchOptions: string;
}

/** one itch-created entry in Steam's shortcuts.vdf */
export interface SteamShortcutEntrySummary {
  gameId: number;
  appName: string;
  appid: number | null;
  exe: string;
  launchOptions: string;
  mode: SteamShortcutMode;
  /** exe missing on disk, or not the launcher we'd write today */
  staleExe: boolean;
  /** one or more launcher-derived fields differ from canonical values */
  needsRepair: boolean;
  /** entry has no grid art icon, or its file is gone */
  missingArt: boolean;
}

/**
 * Point-in-time view of the Steam shortcuts file, for the management
 * dialog. Failures are folded into fields rather than thrown so the
 * dialog can always render something.
 */
export interface SteamShortcutsSnapshot {
  steamRoot: string | null;
  userId: string | null;
  shortcutsPath: string | null;
  fileExists: boolean;
  fileSize: number | null;
  fileMtimeMs: number | null;
  backupExists: boolean;
  steamRunning: boolean;
  /** all shortcuts in the file, itch-created or not */
  totalEntries: number | null;
  parseError: string | null;
  /** inline error from the most recent dialog operation */
  lastOpError: LocalizedString | null;
  entries: SteamShortcutEntrySummary[];
}
