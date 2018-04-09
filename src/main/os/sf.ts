import { promisify, ItchPromise } from "common/util/itch-promise";

import fs from "fs";
import path from "path";

import { IFSError, IReadFileOpts, IWriteFileOpts } from "common/types/sf";

/*
 * Let's patch all the things! Electron randomly decides to
 * substitute 'fs' with their own version that considers '.asar'
 * files to be read-only directories.
 *
 * Since itch can install applications that have .asar files, that
 * won't do.
 *
 * We want sf to operate on actual files, so we need to operate some
 * magic for various modules to use the original fs module, not the
 * asar-aware one.
 */

import { EventEmitter } from "events";

type Mkdirp = (path: string, opts?: any) => Promise<void>;
export const mkdirp: Mkdirp = promisify(require("mkdirp")) as any;

type Rimraf = (path: string, opts?: any) => Promise<void>;
const rimraf: Rimraf = promisify(require("rimraf")) as any;

export const nodeReaddir = (promisify(fs.readdir) as any) as typeof readdir;
export const nodeReadFile = (promisify(fs.readFile) as any) as typeof readFile;
export const nodeWriteFile = (promisify(
  fs.writeFile
) as any) as typeof writeFile;
export const nodeAppendFile = (promisify(
  fs.appendFile
) as any) as typeof appendFile;

export const utimes = (promisify(fs.utimes) as any) as (
  path: string,
  atime: number,
  mtime: number
) => Promise<void>;
export const chmod = (promisify(fs.chmod) as any) as (
  path: string,
  mode: number
) => Promise<void>;
export const stat = promisify(fs.stat);
export const lstat = promisify(fs.lstat);
export const readlink = promisify(fs.readlink);
export const symlink = (promisify(fs.symlink) as any) as (
  srcpath: string,
  dstpath: string
) => Promise<void>;
export const rename = (promisify(fs.rename) as any) as (
  oldpath: string,
  newpath: string
) => Promise<void>;
export const rmdir = promisify(fs.rmdir);
export const unlink = (promisify(fs.unlink) as any) as (
  file: string
) => Promise<void>;

export const createReadStream = fs.createReadStream.bind(fs);
export const createWriteStream = fs.createWriteStream.bind(fs);

/**
 * Returns true if file exists, false if ENOENT, throws if other error
 */
export async function exists(file: string) {
  return new ItchPromise((resolve, reject) => {
    const callback = (err: IFSError) => {
      if (err) {
        if (err.code === "ENOENT") {
          resolve(false);
        } else {
          reject(err);
        }
      } else {
        resolve(true);
      }
    };

    fs.access(file, fs.constants.R_OK, callback);
  });
}

/**
 * List children of a directory
 */
export async function readdir(dir: string): Promise<string[]> {
  return await nodeReaddir(dir);
}

/**
 * Return file contents (defaults to utf-8)
 */
export async function readFile(
  file: string,
  opts: IReadFileOpts
): Promise<string> {
  return await nodeReadFile(file, opts);
}

/**
 * Append content to a file (defaults to utf-8)
 * Creates the file and any required parent directory if they don't exist.
 */
export async function appendFile(
  file: string,
  contents: string | Buffer,
  opts?: IWriteFileOpts
): Promise<void> {
  await mkdir(path.dirname(file));
  return await nodeAppendFile(file, contents, opts);
}

/**
 * Writes an utf-8 string to 'file'.
 * Creates the file and any required parent directory if they don't exist.
 */
export async function writeFile(
  file: string,
  contents: string | Buffer,
  opts: IWriteFileOpts
): Promise<void> {
  await mkdir(path.dirname(file));
  return await nodeWriteFile(file, contents, opts);
}

/**
 * Turns a stream into a promise, resolves when
 * 'close' or 'end' is emitted, rejects when 'error' is
 */
export async function promised(stream: EventEmitter): Promise<any> {
  const p = new ItchPromise((resolve, reject) => {
    stream.on("close", resolve);
    stream.on("end", resolve);
    stream.on("error", reject);
  });
  return await p;
}

/**
 * Create each supplied directory including any necessary parent directories that
 * don't yet exist.
 *
 * If the directory already exists, do nothing.
 * Uses mkdirp: https://www.npmjs.com/package/mkdirp
 */
export async function mkdir(dir: string): Promise<void> {
  await mkdirp(dir);
}

/**
 * Burn to the ground an entire directory and everything in it
 * Also works on file, don't bother with unlink.
 */
export async function wipe(shelter: string): Promise<void> {
  await rimraf(shelter);
}
