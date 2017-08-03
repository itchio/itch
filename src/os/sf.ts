import * as invariant from "invariant";
import { promisify } from "bluebird";
import * as bluebird from "bluebird";

import * as fs from "fs";
import * as path from "path";

import {
  IFSError,
  IGlobStatic,
  IReadFileOpts,
  IWriteFileOpts,
} from "../types/sf";

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

/**
 * Promised version of isaacs' little globber
 * https://www.npmjs.com/package/glob
 * 
 * (single function, callback-based, doesn't accept fs)
 */
export const glob = promisify(require("glob") as IGlobStatic);

type Mkdirp = (path: string, opts?: any) => Promise<void>;
export const mkdirp: Mkdirp = promisify(require("mkdirp")) as any;

type Rimraf = (path: string, opts?: any) => Promise<void>;
const rimraf: Rimraf = promisify(require("rimraf")) as any;

// global ignore patterns
export const globIgnore = [
  // on macOS, trashes exist on dmg volumes but cannot be scandir'd for some reason
  "**/.Trashes/**",
];

export const nodeReadFile = (bluebird.promisify(
  fs.readFile,
) as any) as typeof readFile;
export const nodeWriteFile = (bluebird.promisify(
  fs.writeFile,
) as any) as typeof writeFile;
export const nodeAppendFile = (bluebird.promisify(
  fs.appendFile,
) as any) as typeof appendFile;

export const utimes = (bluebird.promisify(fs.utimes) as any) as (
  path: string,
  atime: number,
  mtime: number,
) => Promise<void>;
export const chmod = (bluebird.promisify(fs.chmod) as any) as (
  path: string,
  mode: number,
) => Promise<void>;
export const stat = bluebird.promisify(fs.stat);
export const lstat = bluebird.promisify(fs.lstat);
export const readlink = bluebird.promisify(fs.readlink);
export const symlink = (bluebird.promisify(fs.symlink) as any) as (
  srcpath: string,
  dstpath: string,
) => Promise<void>;
export const rename = (bluebird.promisify(fs.rename) as any) as (
  oldpath: string,
  newpath: string,
) => Promise<void>;
export const rmdir = bluebird.promisify(fs.rmdir);
export const unlink = (bluebird.promisify(fs.unlink) as any) as (
  file: string,
) => Promise<void>;

export const createReadStream = fs.createReadStream.bind(fs);
export const createWriteStream = fs.createWriteStream.bind(fs);

/**
 * Returns true if file exists, false if ENOENT, throws if other error
 */
export async function exists(file: string) {
  return new Promise((resolve, reject) => {
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
 * Return file contents (defaults to utf-8)
 */
export async function readFile(
  file: string,
  opts: IReadFileOpts,
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
  opts?: IWriteFileOpts,
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
  opts: IWriteFileOpts,
): Promise<void> {
  await mkdir(path.dirname(file));
  return await nodeWriteFile(file, contents, opts);
}

/**
 * Turns a stream into a promise, resolves when
 * 'close' or 'end' is emitted, rejects when 'error' is
 */
export async function promised(stream: EventEmitter): Promise<any> {
  invariant(typeof stream === "object", "sf.promised has object stream");

  const p = new bluebird((resolve, reject) => {
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
