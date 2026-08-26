/**
 * Minimal reader/writer for the binary VDF format Steam uses for
 * `userdata/<user>/config/shortcuts.vdf`. Only the three node types that
 * appear in that file are supported: nested object, string, and int32.
 */

export type VdfValue = string | number | VdfObject;
export interface VdfObject {
  [key: string]: VdfValue;
}

const TYPE_OBJECT = 0x00;
const TYPE_STRING = 0x01;
const TYPE_INT32 = 0x02;
const TYPE_END = 0x08;

interface Reader {
  buffer: Buffer;
  offset: number;
}

export function parseBinaryVdf(buffer: Buffer): VdfObject {
  return readObjectBody({ buffer, offset: 0 }, true);
}

function readCString(r: Reader): string {
  const end = r.buffer.indexOf(0, r.offset);
  if (end < 0) {
    throw new Error("unterminated string in binary VDF");
  }
  const raw = r.buffer.subarray(r.offset, end);
  const s = raw.toString("utf8");
  if (!Buffer.from(s, "utf8").equals(raw)) {
    // a lossy decode (e.g. latin-1 bytes from a third-party tool) would
    // silently corrupt the string on the next write
    throw new Error("invalid UTF-8 in binary VDF string");
  }
  r.offset = end + 1;
  return s;
}

function readObjectBody(r: Reader, topLevel = false): VdfObject {
  // null prototype so hostile keys like __proto__ stay plain data
  const result: VdfObject = Object.create(null);
  while (true) {
    if (topLevel && r.offset >= r.buffer.length) {
      return result;
    }
    const type = r.buffer[r.offset++];
    if (type === TYPE_END) {
      return result;
    }
    const key = readCString(r);
    if (key in result) {
      // last-wins would silently drop data on the next write
      throw new Error(`duplicate key "${key}" in binary VDF`);
    }
    switch (type) {
      case TYPE_OBJECT:
        result[key] = readObjectBody(r);
        break;
      case TYPE_STRING:
        result[key] = readCString(r);
        break;
      case TYPE_INT32:
        result[key] = r.buffer.readInt32LE(r.offset);
        r.offset += 4;
        break;
      default:
        throw new Error(
          `unknown node type 0x${type.toString(16)} in binary VDF`
        );
    }
  }
}

export function writeBinaryVdf(root: VdfObject): Buffer {
  const chunks: Buffer[] = [];
  writeObjectBody(chunks, root);
  chunks.push(Buffer.from([TYPE_END]));
  return Buffer.concat(chunks);
}

function cstring(s: string): Buffer {
  return Buffer.concat([Buffer.from(s, "utf8"), Buffer.from([0])]);
}

function writeObjectBody(chunks: Buffer[], obj: VdfObject) {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "number") {
      const b = Buffer.alloc(4);
      b.writeInt32LE(value | 0);
      chunks.push(Buffer.from([TYPE_INT32]), cstring(key), b);
    } else if (typeof value === "string") {
      chunks.push(Buffer.from([TYPE_STRING]), cstring(key), cstring(value));
    } else {
      chunks.push(Buffer.from([TYPE_OBJECT]), cstring(key));
      writeObjectBody(chunks, value);
      chunks.push(Buffer.from([TYPE_END]));
    }
  }
}
