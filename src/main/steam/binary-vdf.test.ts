import { test } from "node:test";
import assert from "node:assert/strict";
import { parseBinaryVdf, writeBinaryVdf } from "main/steam/binary-vdf";

// parsed objects have a null prototype (hostile keys stay data), which
// strict deep equality distinguishes from object literals
function plain(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

const shortcuts = {
  shortcuts: {
    "0": {
      appid: -479606703,
      AppName: "Boyfriend Simulator: Feed My Boyfriend",
      Exe: '"/home/leafo/.config/kitch/apps/feed_my_boyfriend.exe"',
      LaunchOptions: "",
      IsHidden: 0,
      DevkitGameID: "itch-game-239",
      tags: {},
    },
  },
};

test("round-trips objects, strings and int32 values", () => {
  const bytes = writeBinaryVdf(shortcuts);
  assert.deepEqual(plain(parseBinaryVdf(bytes)), shortcuts);
});

test("writes Steam's node layout", () => {
  // \x00 object, \x01 string, \x02 int32, \x08 end
  const bytes = writeBinaryVdf({ a: { s: "x", n: 1 } });
  assert.deepEqual(
    [...bytes],
    [
      0x00,
      ...Buffer.from("a\0"),
      0x01,
      ...Buffer.from("s\0"),
      ...Buffer.from("x\0"),
      0x02,
      ...Buffer.from("n\0"),
      1,
      0,
      0,
      0,
      0x08,
      0x08,
    ]
  );
});

test("parses an empty file as no shortcuts", () => {
  assert.deepEqual(plain(parseBinaryVdf(Buffer.alloc(0))), {});
});

test("keeps non-ASCII titles intact", () => {
  const root = { shortcuts: { "0": { AppName: "ドキドキ文芸部! – ünïcödé" } } };
  assert.deepEqual(plain(parseBinaryVdf(writeBinaryVdf(root))), root);
});

test("rejects input a rewrite would corrupt", () => {
  const duplicate = Buffer.concat([
    Buffer.from([0x01]),
    Buffer.from("k\0a\0"),
    Buffer.from([0x01]),
    Buffer.from("k\0b\0"),
  ]);
  assert.throws(() => parseBinaryVdf(duplicate), /duplicate key/);

  const latin1 = Buffer.concat([
    Buffer.from([0x01]),
    Buffer.from("k\0"),
    Buffer.from([0xe9, 0x00]),
  ]);
  assert.throws(() => parseBinaryVdf(latin1), /invalid UTF-8/);

  const unknownType = Buffer.from([0x07, ...Buffer.from("k\0")]);
  assert.throws(() => parseBinaryVdf(unknownType), /unknown node type/);

  const unterminated = Buffer.from([0x01, ...Buffer.from("k")]);
  assert.throws(() => parseBinaryVdf(unterminated), /unterminated string/);
});
