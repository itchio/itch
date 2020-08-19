import { promises as fs, constants, Stats } from "fs";
import path from "path";

import { ReadFileOpts, WriteFileOpts } from "common/types/sf";

import { EventEmitter } from "events";
import rimraf from "rimraf";

/**
 * Returns true if file exists, false if ENOENT, throws if other error
 */
export async function exists(file: string) {
  try {
    await fs.access(file, constants.R_OK);
    return true;
  } catch (err) {
    if (err.code === "ENOENT") {
      return false;
    } else {
      throw err;
    }
  }
}

/**
 * List children of a directory
 */
export async function readdir(dir: string): Promise<string[]> {
  return await fs.readdir(dir);
}

/**
 * Return file contents (defaults to utf-8)
 */
export async function readFile(
  file: string,
  opts: ReadFileOpts
): Promise<string> {
  return await fs.readFile(file, opts);
}

/**
 * Append content to a file (defaults to utf-8)
 * Creates the file and any required parent directory if they don't exist.
 */
export async function appendFile(
  file: string,
  contents: string | Buffer,
  opts?: WriteFileOpts
): Promise<void> {
  await mkdir(path.dirname(file));
  return await fs.appendFile(file, contents, opts);
}

/**
 * Writes an utf-8 string to 'file'.
 * Creates the file and any required parent directory if they don't exist.
 */
export async function writeFile(
  file: string,
  contents: string | Buffer,
  opts: WriteFileOpts
): Promise<void> {
  await mkdir(path.dirname(file));
  return await fs.writeFile(file, contents, opts);
}

/**
 * Turns a stream into a promise, resolves when
 * 'close' or 'end' is emitted, rejects when 'error' is
 */
export async function promised(stream: EventEmitter): Promise<any> {
  const p = new Promise((resolve, reject) => {
    stream.on("close", resolve);
    stream.on("end", resolve);
    stream.on("error", reject);
  });
  return await p;
}

/**
 * `mkdir -p`
 */
export async function mkdir(dir: string): Promise<string> {
  return await fs.mkdir(dir, { recursive: true });
}

/**
 * `mv older newer`
 */
export async function rename(older: string, newer: string): Promise<void> {
  return await fs.rename(older, newer);
}

export async function lstat(file: string): Promise<Stats> {
  return await fs.lstat(file);
}

/**
 * `rm -rf`
 */
export async function wipe(dir: string): Promise<void> {
  return await new Promise((resolve, reject) => {
    rimraf(dir, {}, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export async function unlink(file: string): Promise<void> {
  return await fs.unlink(file);
}

export async function chmod(
  file: string,
  mode: string | number
): Promise<void> {
  return await fs.chmod(file, mode);
}
