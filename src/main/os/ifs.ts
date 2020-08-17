// asar-aware filesystem module
import fs from "fs";

/** reads an entire file as an UTF-8 string */
export async function readFile(file: string): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    fs.readFile(file, { encoding: "utf8" }, (err, res) => {
      if (err) {
        return reject(err);
      }
      resolve(res);
    });
  });
}

/** returns true if a file can be read (actually reads it to test) */
export async function exists(file: string): Promise<boolean> {
  try {
    // Note: we can't use fs.access via ASAR, it always returns false
    await readFile(file);
  } catch (err) {
    return false;
  }
  return true;
}

import * as sf from "main/os/sf";
export const writeFile = sf.writeFile;
