/**
 * Minimal reader/writer for Steam's text KeyValues format, as used by
 * `config/config.vdf`, `libraryfolders.vdf` and `appmanifest_*.acf`.
 * Supports nested objects, quoted and bare tokens, Steam's two escapes
 * (backslash and quote) and `//` comments. Anything else (conditionals,
 * #include) is an error: the files we rewrite must round-trip losslessly.
 */

export type TextVdfValue = string | TextVdfObject;
/** a Map rather than an object: Steam's key order must survive a rewrite */
export type TextVdfObject = Map<string, TextVdfValue>;

interface Reader {
  text: string;
  offset: number;
}

function skipWhitespaceAndComments(r: Reader) {
  while (r.offset < r.text.length) {
    const c = r.text[r.offset];
    if (c === " " || c === "\t" || c === "\r" || c === "\n") {
      r.offset++;
    } else if (c === "/" && r.text[r.offset + 1] === "/") {
      const end = r.text.indexOf("\n", r.offset);
      r.offset = end < 0 ? r.text.length : end + 1;
    } else {
      return;
    }
  }
}

type Token =
  | { kind: "string"; value: string }
  | { kind: "open" }
  | { kind: "close" }
  | { kind: "eof" };

function readToken(r: Reader): Token {
  skipWhitespaceAndComments(r);
  if (r.offset >= r.text.length) {
    return { kind: "eof" };
  }
  const c = r.text[r.offset];
  if (c === "{") {
    r.offset++;
    return { kind: "open" };
  }
  if (c === "}") {
    r.offset++;
    return { kind: "close" };
  }
  if (c === '"') {
    r.offset++;
    let value = "";
    while (true) {
      if (r.offset >= r.text.length) {
        throw new Error("unterminated string in text VDF");
      }
      const ch = r.text[r.offset++];
      if (ch === '"') {
        return { kind: "string", value };
      }
      if (ch === "\\") {
        // Steam escapes only backslash and quote; newlines and tabs are
        // written raw. Anything else would not survive a rewrite.
        const escaped = r.text[r.offset++];
        if (escaped !== "\\" && escaped !== '"') {
          throw new Error(`unsupported escape \\${escaped} in text VDF`);
        }
        value += escaped;
      } else {
        value += ch;
      }
    }
  }
  if (c === "[") {
    throw new Error("conditionals are not supported in text VDF");
  }
  if (c === "#") {
    // #include / #base pull in another file; quoting the directive on
    // write would silently drop that file's contents
    throw new Error("directives are not supported in text VDF");
  }
  // bare token: runs until whitespace or a brace
  const start = r.offset;
  while (r.offset < r.text.length && !/[\s{}"]/.test(r.text[r.offset])) {
    r.offset++;
  }
  return { kind: "string", value: r.text.slice(start, r.offset) };
}

function readObjectBody(r: Reader, topLevel: boolean): TextVdfObject {
  const result: TextVdfObject = new Map();
  while (true) {
    const keyToken = readToken(r);
    if (keyToken.kind === "eof") {
      if (topLevel) {
        return result;
      }
      throw new Error("unexpected end of text VDF");
    }
    if (keyToken.kind === "close") {
      if (topLevel) {
        throw new Error("unbalanced '}' in text VDF");
      }
      return result;
    }
    if (keyToken.kind !== "string") {
      throw new Error("expected a key in text VDF");
    }
    if (result.has(keyToken.value)) {
      // last-wins would silently drop data on the next write
      throw new Error(`duplicate key "${keyToken.value}" in text VDF`);
    }
    const valueToken = readToken(r);
    if (valueToken.kind === "open") {
      result.set(keyToken.value, readObjectBody(r, false));
    } else if (valueToken.kind === "string") {
      result.set(keyToken.value, valueToken.value);
    } else {
      throw new Error(`missing value for "${keyToken.value}" in text VDF`);
    }
  }
}

export function parseTextVdf(text: string): TextVdfObject {
  // a UTF-8 BOM would otherwise become part of the first key
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  return readObjectBody({ text: clean, offset: 0 }, true);
}

function quote(s: string): string {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function writeObjectBody(lines: string[], obj: TextVdfObject, depth: number) {
  const indent = "\t".repeat(depth);
  for (const [key, value] of obj) {
    if (typeof value === "string") {
      lines.push(`${indent}${quote(key)}\t\t${quote(value)}`);
    } else {
      lines.push(`${indent}${quote(key)}`, `${indent}{`);
      writeObjectBody(lines, value, depth + 1);
      lines.push(`${indent}}`);
    }
  }
}

/** Serializes in the same tab-indented style Steam itself writes. */
export function writeTextVdf(root: TextVdfObject): string {
  const lines: string[] = [];
  writeObjectBody(lines, root, 0);
  return lines.join("\n") + "\n";
}

/** case-insensitive lookup: Steam's own casing of keys varies by version */
export function getTextField(
  obj: TextVdfObject,
  name: string
): TextVdfValue | undefined {
  const lower = name.toLowerCase();
  for (const [key, value] of obj) {
    if (key.toLowerCase() === lower) {
      return value;
    }
  }
  return undefined;
}

export function getTextObject(
  obj: TextVdfObject,
  name: string
): TextVdfObject | undefined {
  const value = getTextField(obj, name);
  return typeof value === "object" ? value : undefined;
}
