import { test } from "node:test";
import assert from "node:assert/strict";
import { shortAppId, shortcutEntryId } from "main/steam/appid";

// values cross-checked against the ids Steam itself assigned when these
// entries were written to shortcuts.vdf
const exe =
  '"/home/leafo/.config/kitch/apps/boyfriend-simulator-feed-my-boyfriend/feed_my_boyfriend/feed_my_boyfriend.exe"';

test("derives Steam's crc-based shortcut id", () => {
  assert.equal(shortAppId(exe, "itch-game-239"), "3815360593");
  assert.equal(
    shortAppId(
      '"/home/leafo/.config/kitch/apps/ddlc/DDLC-1.1.1-pc/DDLC.exe"',
      "DDLC test"
    ),
    "2562272308"
  );
});

test("entry id is the signed int32 view of the same value", () => {
  assert.equal(shortcutEntryId(exe, "itch-game-239"), -479606703);
  assert.equal(shortcutEntryId(exe, "itch-game-239") >>> 0, 3815360593);
});

test("always sets the high bit, as Steam does for non-Steam games", () => {
  for (const key of ["a", "itch-game-1", "itch-game-99999999"]) {
    assert.ok(parseInt(shortAppId('"x"', key), 10) >= 0x80000000);
  }
});
