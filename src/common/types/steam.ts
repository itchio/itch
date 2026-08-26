import { LocalizedString } from "common/types";

/** one itch-created entry in Steam's shortcuts.vdf */
export interface SteamShortcutEntrySummary {
  gameId: number;
  appName: string;
  appid: number | null;
  exe: string;
  launchOptions: string;
  /** exe missing on disk, or not the launcher we'd write today */
  staleExe: boolean;
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
