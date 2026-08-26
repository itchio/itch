import { crc32 } from "zlib";

// Steam's crc-based id scheme for non-Steam shortcuts. The key we pass is
// a stable per-game string rather than the title Steam itself would use:
// titles collide across games and change on renames, and Steam accepts
// whatever appid the entry declares.
function baseId(exe: string, key: string): number {
  return (crc32(exe + key) | 0x80000000) >>> 0;
}

/** value for the shortcut entry's `appid` field (signed int32) */
export function shortcutEntryId(exe: string, key: string): number {
  return baseId(exe, key) | 0;
}

/** unsigned id used to name grid art files */
export function shortAppId(exe: string, key: string): string {
  return baseId(exe, key).toString();
}
