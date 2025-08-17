import { crc32 } from "crc";

function generatePreliminaryId(exe: string, appname: string) {
  const key = exe + appname;
  const top = BigInt(crc32(key)) | BigInt(0x80000000);
  return (BigInt(top) << BigInt(32)) | BigInt(0x02000000);
}

export function generateShortcutId(exe: string, appname: string) {
  const id =
    (generatePreliminaryId(exe, appname) >> BigInt(32)) - BigInt(0x100000000);
  // Ensure the ID fits in a 32-bit signed integer (keep negative values)
  return Number(BigInt.asIntN(32, id));
}

export function generateAppId(exe: string, appname: string) {
  return String(generatePreliminaryId(exe, appname));
}

export function generateShortAppId(exe: string, appname: string) {
  return String(generatePreliminaryId(exe, appname) >> BigInt(32));
}
