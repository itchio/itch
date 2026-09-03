import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getTextField,
  getTextObject,
  parseTextVdf,
  writeTextVdf,
} from "main/steam/text-vdf";

// the shape Steam writes: tab indented, two tabs between key and value
const steamStyle = `"InstallConfigStore"
{
\t"Software"
\t{
\t\t"valve"
\t\t{
\t\t\t"Steam"
\t\t\t{
\t\t\t\t"CompatToolMapping"
\t\t\t\t{
\t\t\t\t\t"3815360593"
\t\t\t\t\t{
\t\t\t\t\t\t"name"\t\t"proton_experimental"
\t\t\t\t\t\t"config"\t\t""
\t\t\t\t\t\t"priority"\t\t"250"
\t\t\t\t\t}
\t\t\t\t}
\t\t\t\t"MTBF"\t\t"930760972"
\t\t\t}
\t\t}
\t}
}
`;

test("round-trips Steam's own formatting byte for byte", () => {
  assert.equal(writeTextVdf(parseTextVdf(steamStyle)), steamStyle);
});

test("preserves key order, including numeric keys", () => {
  const parsed = parseTextVdf(`"a" { "440" "x" "240" "y" "z" "w" }`);
  assert.deepEqual(
    [...getTextObject(parsed, "a")!.keys()],
    ["440", "240", "z"]
  );
});

test("handles backslash and quote escapes, raw newlines and tabs", () => {
  const input = `"k"\t\t"C:\\\\Program Files\\\\x"\n"q"\t\t"say \\"hi\\""\n"nl"\t\t"a\nb\tc"\n`;
  const parsed = parseTextVdf(input);
  assert.equal(parsed.get("k"), "C:\\Program Files\\x");
  assert.equal(parsed.get("q"), 'say "hi"');
  assert.equal(parsed.get("nl"), "a\nb\tc");
  assert.equal(writeTextVdf(parsed), input);
});

test("accepts bare tokens and // comments", () => {
  const parsed = parseTextVdf(`// header\n"a" { bare token } // trailing\n`);
  assert.equal(getTextObject(parsed, "a")!.get("bare"), "token");
});

test("strips a UTF-8 BOM", () => {
  assert.equal(parseTextVdf(`\ufeff"a" "b"`).get("a"), "b");
});

test("looks up keys case-insensitively", () => {
  const parsed = parseTextVdf(`"Valve" { "x" "1" }`);
  assert.equal(getTextField(getTextObject(parsed, "valve")!, "X"), "1");
});

test("rejects what a rewrite could not preserve", () => {
  const bad: [string, RegExp][] = [
    [`"a" "x\\ny"`, /unsupported escape/],
    [`"a" "x" "a" "y"`, /duplicate key/],
    [`#include "other.vdf"`, /directives/],
    [`"a" { "b" "c" [$WIN32] }`, /conditionals/],
    [`"a" { "b" "c"`, /unexpected end/],
    [`"a" "unterminated`, /unterminated string/],
    [`}`, /unbalanced/],
    [`"a"`, /missing value/],
  ];
  for (const [input, message] of bad) {
    assert.throws(() => parseTextVdf(input), message, input);
  }
});
