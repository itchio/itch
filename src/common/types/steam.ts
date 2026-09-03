import { LocalizedString } from "common/types";

/**
 * "itch" shortcuts launch through itch-setup and butler, which run the
 * game headlessly (Steam overlay and playtime tracking work) and boot
 * the app only when they must (html games, login needed). On macOS they
 * launch the app with an url instead (see macos-runner-parity.md).
 * "direct" shortcuts point at the game's own executable, skipping itch's
 * runtime configuration entirely.
 */
export type SteamShortcutMode = "itch" | "direct";

/** Canonical command Steam should use for a resolved native launch target. */
export interface SteamDirectTarget {
  path: string;
  launchOptions: string;
  /**
   * Steam compatibility tool (Proton) the shortcut must be mapped to;
   * set for Windows executables on Linux, where Steam otherwise execs
   * the .exe natively
   */
  compatTool?: string;
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
  /** Windows executable on Linux with no compatibility tool mapped in Steam */
  missingCompatTool: boolean;
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
