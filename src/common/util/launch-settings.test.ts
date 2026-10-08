import { test } from "node:test";
import assert from "node:assert/strict";
import { Action } from "common/butlerd/messages";
import {
  launchTargetKey,
  normalizeTargetPath,
} from "common/util/launch-settings";

function action(name: string, path: string): Action {
  return { name, path } as Action;
}

test("normalizeTargetPath matches butler's comparison form", () => {
  assert.equal(normalizeTargetPath("./game.exe"), "game.exe");
  assert.equal(normalizeTargetPath("win\\game.exe"), "win/game.exe");
  assert.equal(normalizeTargetPath("."), ".");
});

test("manifest actions are keyed by name", () => {
  assert.equal(launchTargetKey(action("play", "./game.exe")), "play");
  assert.equal(launchTargetKey(action("editor", "tools/editor.sh")), "editor");
  assert.equal(launchTargetKey(action("Open folder", ".")), "Open folder");
});

test("a manifest action named after its file falls back to the path", () => {
  // looks like an implicit target, and butler matches paths too, so the
  // key still resolves
  assert.equal(
    launchTargetKey(action("editor", "tools/editor")),
    "tools/editor"
  );
});

test("implicit targets are keyed by path, their names carry the size", () => {
  assert.equal(
    launchTargetKey(action("game.exe (13.0 KiB)", "win/game.exe")),
    "win/game.exe"
  );
  assert.equal(launchTargetKey(action("Kids", "Kids")), "Kids");
  assert.equal(
    launchTargetKey(action("index.html (2.1 KiB)", "./index.html")),
    "index.html"
  );
});
